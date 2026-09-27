import express, { Request, Response } from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import Redis from 'ioredis';
import dotenv from 'dotenv';
import { verifySocketToken } from './auth';
import chatHandler from './handlers/chat';
import presenceHandler from './handlers/presenceHandler';

dotenv.config();

const app = express();
app.use(express.json());

// Simple health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

function parseCorsOrigins(): string[] {
  const raw =
    process.env.CORS_ORIGINS ??
    process.env.NEXT_PUBLIC_WEB_URL ??
    'http://localhost:3000';
  return raw.split(',').map((o) => o.trim()).filter(Boolean);
}

const corsOrigins = parseCorsOrigins();

const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin || corsOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Redis adapter for scaling & presence tracking (Only in production to avoid local Redis requirement)
if (process.env.NODE_ENV === 'production' && process.env.REDIS_URL) {
  const pubClient = new Redis(process.env.REDIS_URL as string, { maxRetriesPerRequest: null });
  const subClient = pubClient.duplicate();
  
  pubClient.on('error', (err: any) => console.error('Redis Pub Client Error', err));
  subClient.on('error', (err: any) => console.error('Redis Sub Client Error', err));
  
  io.adapter(createAdapter(pubClient, subClient));
  console.log('Redis adapter configured');
} else {
  console.log('Using default memory adapter for Socket.io (development mode)');
}

io.use(async (socket, next) => {
  try {
    let token = socket.handshake.auth?.token as string | undefined;
    if (!token && socket.handshake.headers.cookie) {
      const match = socket.handshake.headers.cookie.match(/(?:^|;\s*)access_token=([^;]+)/);
      if (match) token = match[1];
    }
    if (!token) throw new Error('Missing token');
    const payload = await verifySocketToken(token);
    if (!payload) throw new Error('Invalid token');
    (socket as any).user = payload;
    next();
  } catch (err) {
    console.error('Socket auth error:', err);
    next(new Error('Authentication error'));
  }
});

io.on('connection', (socket) => {
  console.log('Socket connected', (socket as any).user?.userId);
  chatHandler(io, socket);
  presenceHandler(io, socket);
});

app.post('/internal/message', (req: Request, res: Response) => {
  const secret = req.headers['x-internal-secret'];
  const expected = process.env.INTERNAL_API_SECRET ?? 'dev-internal-secret';
  if (secret !== expected) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const { conversationId, message } = req.body ?? {};
  if (!conversationId || !message) {
    res.status(400).json({ error: 'Invalid payload' });
    return;
  }

  io.to(`conv_${conversationId}`).emit('new_message', { message });
  res.json({ ok: true });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`⚡️ Socket server listening on port ${PORT}`);
});
