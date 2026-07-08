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

const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.NEXT_PUBLIC_WEB_URL || 'http://localhost:3000',
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
    // Attach user info to socket data for later handlers
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

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`⚡️ Socket server listening on port ${PORT}`);
});
