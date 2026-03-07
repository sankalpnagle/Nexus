import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';

interface SocketState {
  socket: Socket | null;
  online: Record<string, boolean>;
  connect: (userId: string) => void;
  disconnect: () => void;
  setOnline: (userId: string, status: boolean) => void;
}

export const useSocket = create<SocketState>((set, get) => ({
  socket: null,
  online: {},

  connect: userId => {
    if (get().socket?.connected) return;
    const s = io({ transports: ['websocket'] });
    s.emit('user:online', userId);
    s.on('user:status', (d: { userId: string; isOnline: boolean }) =>
      set(state => ({ online: { ...state.online, [d.userId]: d.isOnline } }))
    );
    set({ socket: s });
  },

  disconnect: () => {
    get().socket?.close();
    set({ socket: null, online: {} });
  },

  setOnline: (userId, status) =>
    set(state => ({ online: { ...state.online, [userId]: status } })),
}));
