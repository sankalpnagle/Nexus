import { Server, Socket } from 'socket.io';
import User from '../models/User.js';

const onlineMap: Record<string, string> = {}; // userId → socketId

export const initSocket = (io: Server): void => {
  io.on('connection', (socket: Socket) => {

    socket.on('user:online', async (userId: string) => {
      onlineMap[userId] = socket.id;
      socket.data.userId = userId;
      await User.findByIdAndUpdate(userId, { isOnline: true });
      io.emit('user:status', { userId, isOnline: true });
    });

    socket.on('conversation:join',  (id: string) => socket.join(`conv:${id}`));
    socket.on('conversation:leave', (id: string) => socket.leave(`conv:${id}`));

    socket.on('message:send', (d: { conversationId: string; message: object }) => {
      socket.to(`conv:${d.conversationId}`).emit('message:receive', d.message);
    });

    socket.on('typing:start', (d: { conversationId: string; userId: string; name: string }) => {
      socket.to(`conv:${d.conversationId}`).emit('typing:start', d);
    });
    socket.on('typing:stop', (d: { conversationId: string }) => {
      socket.to(`conv:${d.conversationId}`).emit('typing:stop', d);
    });

    socket.on('notification:send', (d: { recipientId: string; notification: object }) => {
      const sid = onlineMap[d.recipientId];
      if (sid) io.to(sid).emit('notification:receive', d.notification);
    });

    socket.on('post:liked',     (d: object) => io.emit('post:liked', d));
    socket.on('post:commented', (d: object) => io.emit('post:commented', d));

    socket.on('disconnect', async () => {
      const uid = socket.data.userId as string | undefined;
      if (uid) {
        delete onlineMap[uid];
        await User.findByIdAndUpdate(uid, { isOnline: false, lastSeen: new Date() });
        io.emit('user:status', { userId: uid, isOnline: false, lastSeen: new Date() });
      }
    });
  });
};
