import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Home, Users, MessageCircle, Grid3x3, Bookmark, Clock, ChevronRight, Zap } from 'lucide-react';
import { useAuth } from '../../store/authStore';
import { Avatar } from '../ui';
import { cx } from '../../utils/helpers';

const navItems = [
  { to: '/',         icon: Home,          label: 'Home Feed' },
  { to: '/friends',  icon: Users,         label: 'Friends' },
  { to: '/messages', icon: MessageCircle, label: 'Messages' },
  { to: '/groups',   icon: Grid3x3,       label: 'Groups' },
  { to: '/saved',    icon: Bookmark,      label: 'Saved' },
  { to: '/memories', icon: Clock,         label: 'Memories' },
];

export default function LeftSidebar() {
  const { user } = useAuth();
  const nav = useNavigate();
  const friends = (user?.friends as { _id: string; firstName: string; lastName: string; avatar: string; isOnline: boolean }[]) || [];
  const onlineFriends = friends.filter(f => typeof f === 'object' && f.isOnline);

  return (
    <aside className="w-64 shrink-0 sticky top-14 h-[calc(100vh-56px)] overflow-y-auto py-4 px-2 hidden lg:flex flex-col gap-1">

      {/* Profile link */}
      <button
        onClick={() => nav(`/profile/${user?._id}`)}
        className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#181c26] transition-colors group mb-1 w-full text-left"
      >
        <Avatar user={user} size={36} />
        <div>
          <p className="text-sm font-semibold text-[#e8eaf0] group-hover:text-[#00d4b4] transition-colors">
            {user?.firstName} {user?.lastName}
          </p>
          <p className="text-xs text-[#6b7280]">View profile</p>
        </div>
      </button>

      {/* Nav items */}
      <nav className="space-y-0.5">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) => cx(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group',
              isActive
                ? 'bg-[rgba(0,212,180,0.1)] text-[#00d4b4]'
                : 'text-[#9ca3af] hover:bg-[#181c26] hover:text-[#e8eaf0]'
            )}
          >
            {({ isActive }) => (
              <>
                <span className={cx(
                  'w-8 h-8 rounded-xl flex items-center justify-center transition-colors',
                  isActive ? 'bg-[#00d4b4] text-[#0d0f14]' : 'bg-[#232736] text-[#9ca3af] group-hover:bg-[#2e3347]'
                )}>
                  <Icon size={16} />
                </span>
                <span className="flex-1">{label}</span>
                {isActive && <ChevronRight size={13} className="opacity-50" />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Separator */}
      <div className="border-t border-[#232736] my-2" />

      {/* Online Friends */}
      {onlineFriends.length > 0 && (
        <div>
          <div className="flex items-center gap-2 px-3 mb-2">
            <Zap size={12} className="text-[#00d4b4]" />
            <p className="text-[10px] font-bold text-[#6b7280] uppercase tracking-wider">Online Friends</p>
          </div>
          {onlineFriends.slice(0, 8).map(f => (
            <button
              key={f._id}
              onClick={() => nav(`/profile/${f._id}`)}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-[#181c26] transition-colors text-left"
            >
              <Avatar user={f as never} size={30} online />
              <span className="text-sm text-[#9ca3af] hover:text-[#e8eaf0] truncate">{f.firstName} {f.lastName}</span>
            </button>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="mt-auto pt-4 border-t border-[#232736]">
        <p className="text-[10px] text-[#6b7280] px-3 leading-relaxed">
          Nexus © 2025 · Privacy · Terms
        </p>
      </div>
    </aside>
  );
}
