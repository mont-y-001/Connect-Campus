"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const redis_adapter_1 = require("@socket.io/redis-adapter");
const ioredis_1 = __importDefault(require("ioredis"));
const dotenv_1 = __importDefault(require("dotenv"));
const auth_1 = require("./auth");
const chat_1 = __importDefault(require("./handlers/chat"));
const presenceHandler_1 = __importDefault(require("./handlers/presenceHandler"));
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use(express_1.default.json());
// Simple health check
app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
});
function parseCorsOrigins() {
    const raw = process.env.CORS_ORIGINS ??
        process.env.NEXT_PUBLIC_WEB_URL ??
        'http://localhost:3000';
    return raw.split(',').map((o) => o.trim()).filter(Boolean);
}
const corsOrigins = parseCorsOrigins();
const server = http_1.default.createServer(app);
const io = new socket_io_1.Server(server, {
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
    const pubClient = new ioredis_1.default(process.env.REDIS_URL, { maxRetriesPerRequest: null });
    const subClient = pubClient.duplicate();
    pubClient.on('error', (err) => console.error('Redis Pub Client Error', err));
    subClient.on('error', (err) => console.error('Redis Sub Client Error', err));
    io.adapter((0, redis_adapter_1.createAdapter)(pubClient, subClient));
    console.log('Redis adapter configured');
}
else {
    console.log('Using default memory adapter for Socket.io (development mode)');
}
io.use(async (socket, next) => {
    try {
        let token = socket.handshake.auth?.token;
        if (!token && socket.handshake.headers.cookie) {
            const match = socket.handshake.headers.cookie.match(/(?:^|;\s*)access_token=([^;]+)/);
            if (match)
                token = match[1];
        }
        if (!token)
            throw new Error('Missing token');
        const payload = await (0, auth_1.verifySocketToken)(token);
        if (!payload)
            throw new Error('Invalid token');
        socket.user = payload;
        next();
    }
    catch (err) {
        console.error('Socket auth error:', err);
        next(new Error('Authentication error'));
    }
});
io.on('connection', (socket) => {
    console.log('Socket connected', socket.user?.userId);
    (0, chat_1.default)(io, socket);
    (0, presenceHandler_1.default)(io, socket);
});
app.post('/internal/message', (req, res) => {
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
