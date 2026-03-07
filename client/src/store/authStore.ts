import { create } from 'zustand';
import api from '../utils/api';
import { User } from '../types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  init: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    firstName: string; lastName: string;
    email: string; password: string; birthday?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (u: User) => void;
  refreshUser: () => Promise<void>;
}

export const useAuth = create<AuthState>(set => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  init: async () => {
    if (!localStorage.getItem('nexus_token')) { set({ isLoading: false }); return; }
    try {
      const r = await api.get('/auth/me');
      set({ user: r.data.user, isAuthenticated: true, isLoading: false });
    } catch {
      localStorage.removeItem('nexus_token');
      set({ isLoading: false });
    }
  },

  login: async (email, password) => {
    const r = await api.post('/auth/login', { email, password });
    localStorage.setItem('nexus_token', r.data.token);
    set({ user: r.data.user, isAuthenticated: true });
  },

  register: async data => {
    const r = await api.post('/auth/register', data);
    localStorage.setItem('nexus_token', r.data.token);
    set({ user: r.data.user, isAuthenticated: true });
  },

  logout: async () => {
    try { await api.post('/auth/logout'); } catch {}
    localStorage.removeItem('nexus_token');
    set({ user: null, isAuthenticated: false });
  },

  setUser: u => set({ user: u }),

  refreshUser: async () => {
    const r = await api.get('/auth/me');
    set({ user: r.data.user });
  },
}));
