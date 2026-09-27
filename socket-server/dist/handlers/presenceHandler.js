"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = presenceHandler;
const ioredis_1 = __importDefault(require("ioredis"));
const redis = process.env.NODE_ENV === 'production' && process.env.REDIS_URL
    ? new ioredis_1.default(process.env.REDIS_URL)
    : null;
function presenceHandler(io, socket) {
    const user = socket.user;
    if (!user)
        return;
    const userId = user.userId;
    // Mark online
    if (redis)
        redis.setex(`user:${userId}:online`, 30, '1').catch(console.error);
    // Notify others (could be broadcasted or handled via Redis PubSub)
    io.emit('presence_update', { userId, online: true });
    socket.on('disconnect', () => {
        if (redis)
            redis.del(`user:${userId}:online`).catch(console.error);
        io.emit('presence_update', { userId, online: false });
    });
}
