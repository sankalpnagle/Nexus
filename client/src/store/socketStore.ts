import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import { Notification } from '../types';

interface SocketState {
  socket: Socket | null;
  online: Record<string, boolean>;
  newNotif: Notification | null;
  connect: (userId: string) => void;
  disconnect: () => void;
  setOnline: (userId: string, status: boolean) => void;
  clearNewNotif: () => void;
}

export const useSocket = create<SocketState>((set, get) => ({
  socket: null,
  online: {},
  newNotif: null,

  connect: userId => {
    if (get().socket?.connected) return;
    const s = io({ transports: ['websocket'] });
    s.emit('user:online', userId);

    s.on('user:status', (d: { userId: string; isOnline: boolean }) =>
      set(state => ({ online: { ...state.online, [d.userId]: d.isOnline } }))
    );

    // Real-time notification push
    s.on('notification:receive', (notif: Notification) => {
      set({ newNotif: notif });
    });

    set({ socket: s });
  },

  disconnect: () => {
    get().socket?.close();
    set({ socket: null, online: {}, newNotif: null });
  },

  setOnline: (userId, status) =>
    set(state => ({ online: { ...state.online, [userId]: status } })),

  clearNewNotif: () => set({ newNotif: null }),
}));
