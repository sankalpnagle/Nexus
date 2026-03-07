import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, Sparkles } from 'lucide-react';
import api from '../../utils/api';
import { User } from '../../types';
import { Avatar } from '../ui';
import { getAvatar } from '../../utils/helpers';
import toast from 'react-hot-toast';

export default function RightSidebar() {
  const [suggestions, setSuggestions] = useState<User[]>([]);
  const nav = useNavigate();

  useEffect(() => {
    api.get('/users/suggestions').then(r => setSuggestions(r.data.users.slice(0, 6))).catch(() => {});
  }, []);

  const add = async (uid: string) => {
    try {
      await api.post(`/users/${uid}/friend-request`);
      setSuggestions(p => p.filter(u => u._id !== uid));
      toast.success('Request sent!');
    } catch { toast.error('Failed'); }
  };

  if (!suggestions.length) return null;

  return (
    <aside className="w-64 shrink-0 sticky top-14 h-[calc(100vh-56px)] overflow-y-auto py-4 px-2 hidden xl:block">
      <div className="flex items-center gap-2 px-2 mb-3">
        <Sparkles size={13} className="text-[#00d4b4]" />
        <p className="text-[10px] font-bold text-[#6b7280] uppercase tracking-wider">People You May Know</p>
      </div>

      <div className="space-y-1">
        {suggestions.map(u => (
          <div
            key={u._id}
            className="flex items-center gap-2.5 px-2 py-2.5 rounded-xl hover:bg-[#181c26] transition-colors group"
          >
            <img
              src={getAvatar(u, 72)}
              alt=""
              className="w-9 h-9 rounded-full object-cover shrink-0 cursor-pointer"
              onClick={() => nav(`/profile/${u._id}`)}
            />
            <div
              className="flex-1 min-w-0 cursor-pointer"
              onClick={() => nav(`/profile/${u._id}`)}
            >
              <p className="text-sm font-semibold text-[#e8eaf0] truncate">
                {u.firstName} {u.lastName}
              </p>
              <p className="text-xs text-[#6b7280]">{(u.friends as string[]).length} mutual friends</p>
            </div>
            <button
              onClick={() => add(u._id)}
              className="opacity-0 group-hover:opacity-100 transition-opacity w-7 h-7 flex items-center justify-center rounded-lg bg-[rgba(0,212,180,0.1)] text-[#00d4b4] hover:bg-[#00d4b4] hover:text-[#0d0f14]"
            >
              <UserPlus size={13} />
            </button>
          </div>
        ))}
      </div>
    </aside>
  );
}
