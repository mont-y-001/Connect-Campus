import { Server, Socket } from 'socket.io';
import Redis from 'ioredis';

const redis = process.env.NODE_ENV === 'production' && process.env.REDIS_URL
  ? new Redis(process.env.REDIS_URL)
  : null;

export default function presenceHandler(io: Server, socket: Socket) {
  const user = (socket as any).user;
  if (!user) return;

  const userId = user.userId;

  // Mark online
  if (redis) redis.setex(`user:${userId}:online`, 30, '1').catch(console.error);
  
  // Notify others (could be broadcasted or handled via Redis PubSub)
  io.emit('presence_update', { userId, online: true });

  socket.on('disconnect', () => {
    if (redis) redis.del(`user:${userId}:online`).catch(console.error);
    io.emit('presence_update', { userId, online: false });
  });
}
