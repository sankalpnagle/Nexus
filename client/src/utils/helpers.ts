import { User } from '../types';

export const getAvatar = (u?: User | null, size = 80): string => {
  if (u?.avatar) return u.avatar;
  const name = encodeURIComponent(`${u?.firstName || 'U'} ${u?.lastName || ''}`);
  return `https://ui-avatars.com/api/?name=${name}&background=9b83f9&color=ffffff&size=${size}&bold=true&format=png`;
};

export const getGroupAvatar = (name?: string, size = 80): string => {
  const n = encodeURIComponent(name || 'G');
  return `https://ui-avatars.com/api/?name=${n}&background=6366f1&color=ffffff&size=${size}&bold=true&format=png`;
};

export const cx = (...cls: (string | undefined | false | null)[]): string =>
  cls.filter(Boolean).join(' ');

export const timeAgo = (date: string): string => {
  const now = Date.now();
  const then = new Date(date).getTime();
  const diff = now - then;
  const min = Math.floor(diff / 60000);
  const hr  = Math.floor(diff / 3600000);
  const day = Math.floor(diff / 86400000);
  if (min < 1)  return 'just now';
  if (min < 60) return `${min}m ago`;
  if (hr < 24)  return `${hr}h ago`;
  if (day < 7)  return `${day}d ago`;
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};
