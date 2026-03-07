import { create } from 'zustand';

type Theme = 'dark' | 'light';

interface ThemeState {
  theme: Theme;
  toggle: () => void;
  setTheme: (t: Theme) => void;
}

function applyTheme(t: Theme) {
  document.documentElement.setAttribute('data-theme', t);
  localStorage.setItem('nexus_theme', t);
}

const saved = (localStorage.getItem('nexus_theme') as Theme | null) || 'dark';
applyTheme(saved);

export const useTheme = create<ThemeState>((set, get) => ({
  theme: saved,
  toggle: () => {
    const next: Theme = get().theme === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    set({ theme: next });
  },
  setTheme: (t: Theme) => {
    applyTheme(t);
    set({ theme: t });
  },
}));
