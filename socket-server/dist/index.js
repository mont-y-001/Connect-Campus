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
const server = http_1.default.createServer(app);
const io = new socket_io_1.Server(server, {
    cors: {
        origin: process.env.NEXT_PUBLIC_WEB_URL || 'http://localhost:3000',
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
        // Attach user info to socket data for later handlers
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
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
    console.log(`⚡️ Socket server listening on port ${PORT}`);
});
