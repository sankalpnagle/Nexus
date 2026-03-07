import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Home, Users, MessageCircle, Grid3x3, Bell, Search,
  LogOut, User as UserIcon, Settings, ChevronDown, X, Check, UserPlus,
} from 'lucide-react';
import { useAuth } from '../../store/authStore';
import { Avatar, Badge, Spinner } from '../ui';
import { cx, timeAgo, getAvatar } from '../../utils/helpers';
import { Notification, User } from '../../types';
import api from '../../utils/api';
import toast from 'react-hot-toast';

export default function Navbar() {
  const { user, logout } = useAuth();
  const loc = useLocation();
  const nav = useNavigate();
  const [q, setQ] = useState('');
  const [results, setResults] = useState<User[]>([]);
  const [searching, setSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const notifRef  = useRef<HTMLDivElement>(null);
  const menuRef   = useRef<HTMLDivElement>(null);

  useEffect(() => { fetchNotifs(); }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (!searchRef.current?.contains(e.target as Node)) setShowSearch(false);
      if (!notifRef.current?.contains(e.target as Node))  setShowNotifs(false);
      if (!menuRef.current?.contains(e.target as Node))   setShowMenu(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  useEffect(() => {
    const t = setTimeout(async () => {
      if (!q.trim()) { setResults([]); setShowSearch(false); return; }
      setSearching(true);
      try {
        const r = await api.get(`/users/search?q=${q}`);
        setResults(r.data.users);
        setShowSearch(true);
      } finally { setSearching(false); }
    }, 350);
    return () => clearTimeout(t);
  }, [q]);

  const fetchNotifs = async () => {
    try { const r = await api.get('/notifications'); setNotifs(r.data.notifications); } catch {}
  };

  const unread = notifs.filter(n => !n.isRead).length;

  const navLinks = [
    { to: '/',         icon: Home,          label: 'Home' },
    { to: '/friends',  icon: Users,         label: 'Friends' },
    { to: '/messages', icon: MessageCircle, label: 'Messages' },
    { to: '/groups',   icon: Grid3x3,       label: 'Groups' },
  ];

  const notifText = (n: Notification) => {
    const name = `${n.sender.firstName} ${n.sender.lastName}`;
    if (n.type === 'friend_request') return `${name} sent you a friend request`;
    if (n.type === 'friend_accepted') return `${name} accepted your request`;
    if (n.type === 'post_like') return `${name} liked your post`;
    if (n.type === 'post_comment') return `${name} commented on your post`;
    if (n.type === 'group_join') return `${name} joined your group`;
    return `${name} interacted with you`;
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-14 bg-[#13161e]/95 backdrop-blur-xl border-b border-[#232736] flex items-center px-4 gap-3">

      {/* Logo */}
      <Link to="/" className="flex items-center gap-2 shrink-0">
        <div className="w-8 h-8 rounded-xl bg-[#00d4b4] flex items-center justify-center shadow-[0_0_16px_rgba(0,212,180,0.4)]">
          <span className="text-[#0d0f14] font-black text-base leading-none font-[var(--font-display)]">N</span>
        </div>
        <span className="text-lg font-black text-[#f4f6fc] font-[var(--font-display)] hidden sm:block tracking-tight">
          Nexus
        </span>
      </Link>

      {/* Search */}
      <div ref={searchRef} className="relative ml-1">
        <div className="flex items-center bg-[#181c26] border border-[#232736] rounded-full px-3 py-2 gap-2 w-48 focus-within:border-[#00d4b4] focus-within:ring-1 focus-within:ring-[rgba(0,212,180,0.2)] transition-all">
          {searching ? <Spinner size={14} /> : <Search size={13} className="text-[#6b7280] shrink-0" />}
          <input
            type="text"
            placeholder="Search…"
            value={q}
            onChange={e => setQ(e.target.value)}
            onFocus={() => q && setShowSearch(true)}
            className="bg-transparent border-none outline-none text-sm w-full text-[#e8eaf0] placeholder-[#6b7280]"
          />
          {q && (
            <button onClick={() => { setQ(''); setShowSearch(false); }} className="text-[#6b7280] hover:text-[#e8eaf0]">
              <X size={13} />
            </button>
          )}
        </div>
        {showSearch && results.length > 0 && (
          <div className="absolute top-full left-0 mt-2 bg-[#13161e] border border-[#2e3347] rounded-2xl shadow-2xl w-72 z-50 py-2 overflow-hidden animate-fade-in">
            {results.map(u => (
              <div
                key={u._id}
                onClick={() => { nav(`/profile/${u._id}`); setShowSearch(false); setQ(''); }}
                className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#181c26] cursor-pointer transition-colors"
              >
                <Avatar user={u} size={36} />
                <div>
                  <p className="text-sm font-semibold text-[#f4f6fc]">{u.firstName} {u.lastName}</p>
                  <p className="text-xs text-[#6b7280]">{(u.friends as string[]).length} friends</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Nav tabs — center */}
      <nav className="flex-1 flex items-center justify-center gap-1">
        {navLinks.map(({ to, icon: Icon, label }) => {
          const active = to === '/' ? loc.pathname === '/' : loc.pathname.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              title={label}
              className={cx(
                'relative flex items-center justify-center w-11 h-9 rounded-xl transition-all group',
                active
                  ? 'bg-[rgba(0,212,180,0.1)] text-[#00d4b4]'
                  : 'text-[#6b7280] hover:bg-[#181c26] hover:text-[#e8eaf0]'
              )}
            >
              <Icon size={20} />
              {active && (
                <span className="absolute -bottom-[14px] left-1/2 -translate-x-1/2 w-5 h-0.5 rounded-full bg-[#00d4b4]" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Right actions */}
      <div className="flex items-center gap-1.5 ml-auto">
        {/* Notifications */}
        <div ref={notifRef} className="relative">
          <button
            onClick={() => { setShowNotifs(v => !v); if (!showNotifs) fetchNotifs(); }}
            className={cx(
              'relative w-9 h-9 flex items-center justify-center rounded-xl transition-colors',
              showNotifs ? 'bg-[rgba(0,212,180,0.1)] text-[#00d4b4]' : 'text-[#6b7280] hover:bg-[#181c26] hover:text-[#e8eaf0]'
            )}
          >
            <Bell size={19} />
            <Badge count={unread} />
          </button>
          {showNotifs && (
            <div className="absolute right-0 top-full mt-2 bg-[#13161e] border border-[#2e3347] rounded-2xl shadow-2xl w-80 max-h-96 overflow-y-auto z-50 animate-fade-in">
              <div className="flex items-center justify-between px-4 py-3 border-b border-[#232736] sticky top-0 bg-[#13161e]">
                <span className="font-bold text-[#f4f6fc] font-[var(--font-display)] text-sm">Notifications</span>
                {unread > 0 && (
                  <button
                    onClick={() => api.put('/notifications/read-all').then(fetchNotifs)}
                    className="text-xs text-[#00d4b4] hover:text-[#00b89c] flex items-center gap-1"
                  >
                    <Check size={11} /> Mark all read
                  </button>
                )}
              </div>
              {notifs.length === 0 ? (
                <p className="text-sm text-[#6b7280] text-center py-10">No notifications yet</p>
              ) : notifs.map(n => (
                <div
                  key={n._id}
                  className={cx(
                    'flex items-start gap-3 px-4 py-3 border-b border-[#1e2230] hover:bg-[#181c26] transition-colors cursor-pointer',
                    !n.isRead && 'bg-[rgba(0,212,180,0.04)]'
                  )}
                  onClick={() => api.put(`/notifications/${n._id}/read`).then(fetchNotifs)}
                >
                  <img
                    src={getAvatar(n.sender, 72)}
                    alt=""
                    className="w-9 h-9 rounded-full object-cover shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[#e8eaf0] leading-snug">{notifText(n)}</p>
                    <p className="text-xs text-[#00d4b4] mt-0.5">{timeAgo(n.createdAt)}</p>
                  </div>
                  {!n.isRead && <span className="w-2 h-2 rounded-full bg-[#00d4b4] shrink-0 mt-1.5" />}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Profile menu */}
        <div ref={menuRef} className="relative">
          <button
            onClick={() => setShowMenu(v => !v)}
            className="flex items-center gap-1.5 px-2 py-1.5 rounded-xl hover:bg-[#181c26] transition-colors"
          >
            <Avatar user={user} size={28} />
            <ChevronDown size={13} className="text-[#6b7280]" />
          </button>
          {showMenu && (
            <div className="absolute right-0 top-full mt-2 bg-[#13161e] border border-[#2e3347] rounded-2xl shadow-2xl w-56 py-2 z-50 animate-fade-in">
              <div
                className="flex items-center gap-3 px-4 py-3 border-b border-[#232736] mb-1 cursor-pointer hover:bg-[#181c26] transition-colors"
                onClick={() => { nav(`/profile/${user?._id}`); setShowMenu(false); }}
              >
                <Avatar user={user} size={36} />
                <div>
                  <p className="text-sm font-semibold text-[#f4f6fc]">{user?.firstName} {user?.lastName}</p>
                  <p className="text-xs text-[#6b7280]">View profile</p>
                </div>
              </div>
              {[
                { icon: UserIcon,  label: 'Profile',  action: () => { nav(`/profile/${user?._id}`); setShowMenu(false); } },
                { icon: Settings,  label: 'Settings', action: () => setShowMenu(false) },
                { icon: LogOut,    label: 'Log Out',  action: async () => { await logout(); nav('/auth'); toast.success('Signed out'); } },
              ].map(item => (
                <button
                  key={item.label}
                  onClick={item.action}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#9ca3af] hover:text-[#e8eaf0] hover:bg-[#181c26] transition-colors"
                >
                  <span className="w-7 h-7 flex items-center justify-center rounded-lg bg-[#232736]">
                    <item.icon size={14} />
                  </span>
                  {item.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
