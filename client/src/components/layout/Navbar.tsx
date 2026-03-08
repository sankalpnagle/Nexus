import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Home,
  Users,
  MessageCircle,
  Grid3x3,
  Bell,
  Search,
  LogOut,
  User as UserIcon,
  Settings,
  ChevronDown,
  X,
  Check,
  UserPlus,
  Sun,
  Moon,
} from "lucide-react";
import { useAuth } from "../../store/authStore";
import { useTheme } from "../../store/themeStore";
import { useSocket } from "../../context/SocketContext";
import { Avatar, Badge, Spinner } from "../ui";
import { cx, timeAgo, getAvatar } from "../../utils/helpers";
import { Notification, User } from "../../types";
import api from "../../utils/api";
import toast from "react-hot-toast";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { socket } = useSocket();
  const { theme, toggle: toggleTheme } = useTheme();
  const [themeAnim, setThemeAnim] = useState(false);

  const handleThemeToggle = () => {
    setThemeAnim(true);
    toggleTheme();
    setTimeout(() => setThemeAnim(false), 400);
  };
  const loc = useLocation();
  const nav = useNavigate();
  const [q, setQ] = useState("");
  const [results, setResults] = useState<User[]>([]);
  const [searching, setSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [notifBump, setNotifBump] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchNotifs();
  }, []);

  // Real-time notification injection
  useEffect(() => {
    if (!socket) return;
    const handle = (notif: Notification) => {
      setNotifs((prev) => [notif, ...prev.filter((n) => n._id !== notif._id)]);
      setNotifBump(true);
      setTimeout(() => setNotifBump(false), 600);
    };
    socket.on("notification:receive", handle);
    return () => {
      socket.off("notification:receive", handle);
    };
  }, [socket]);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (!searchRef.current?.contains(e.target as Node)) setShowSearch(false);
      if (!notifRef.current?.contains(e.target as Node)) setShowNotifs(false);
      if (!menuRef.current?.contains(e.target as Node)) setShowMenu(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  useEffect(() => {
    const t = setTimeout(async () => {
      if (!q.trim()) {
        setResults([]);
        setShowSearch(false);
        return;
      }
      setSearching(true);
      try {
        const r = await api.get(`/users/search?q=${q}`);
        setResults(r.data.users);
        setShowSearch(true);
      } finally {
        setSearching(false);
      }
    }, 350);
    return () => clearTimeout(t);
  }, [q]);

  const fetchNotifs = async () => {
    try {
      const r = await api.get("/notifications");
      setNotifs(r.data.notifications);
    } catch {}
  };

  const unread = notifs.filter((n) => !n.isRead).length;

  const navLinks = [
    { to: "/", icon: Home, label: "Home" },
    { to: "/friends", icon: Users, label: "Friends" },
    { to: "/messages", icon: MessageCircle, label: "Messages" },
    { to: "/groups", icon: Grid3x3, label: "Groups" },
  ];

  const notifText = (n: Notification) => {
    const name = n.sender
      ? `${n.sender.firstName} ${n.sender.lastName}`
      : "Someone";
    if (n.type === "friend_request") return `${name} sent you a friend request`;
    if (n.type === "friend_accepted") return `${name} accepted your request`;
    if (n.type === "post_like") return `${name} liked your post`;
    if (n.type === "post_comment") return `${name} commented on your post`;
    if (n.type === "group_join") return `${name} joined your group`;
    return `${name} interacted with you`;
  };

  const A = "#7c6ff7";
  const S = "var(--nx-surface)";
  const B = "var(--nx-border)";
  const T = "var(--nx-heading)";
  const M = "var(--nx-muted)";

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 h-14 flex items-center px-4 gap-3"
      style={{
        background: "var(--nx-navbar)",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid var(--nx-border)",
      }}
    >
      {/* Logo */}
      <Link to="/" className="flex items-center gap-2 shrink-0">
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{
            background: `linear-gradient(135deg, ${A}, #a78bfa)`,
            boxShadow: `0 0 18px rgba(124,111,247,0.4)`,
          }}
        >
          <span
            className="text-white font-black text-base leading-none"
            style={{ fontFamily: "var(--font-display)" }}
          >
            N
          </span>
        </div>
        <span
          className="text-lg font-black hidden sm:block tracking-tight"
          style={{ color: T, fontFamily: "var(--font-display)" }}
        >
          Nexus
        </span>
      </Link>

      {/* Search */}
      <div ref={searchRef} className="relative ml-1">
        <div
          className="flex items-center rounded-full px-3 py-2 gap-2 w-48 transition-all"
          style={{ background: "var(--nx-card)", border: `1px solid ${B}` }}
          onFocus={() => {}}
        >
          {searching ? (
            <Spinner size={14} />
          ) : (
            <Search size={13} style={{ color: M }} className="shrink-0" />
          )}
          <input
            type="text"
            placeholder="Search…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onFocus={() => q && setShowSearch(true)}
            className="bg-transparent border-none outline-none text-sm w-full"
            style={{ color: "var(--nx-text)" }}
          />
          {q && (
            <button
              onClick={() => {
                setQ("");
                setShowSearch(false);
              }}
              style={{ color: M }}
            >
              <X size={13} />
            </button>
          )}
        </div>
        {showSearch && results.length > 0 && (
          <div
            className="absolute top-full left-0 mt-2 rounded-2xl shadow-2xl w-72 z-50 py-2 overflow-hidden animate-fade-in"
            style={{
              background: "var(--nx-surface)",
              border: `1px solid ${B}`,
            }}
          >
            {results.map((u) => (
              <div
                key={u._id}
                onClick={() => {
                  nav(`/profile/${u._id}`);
                  setShowSearch(false);
                  setQ("");
                }}
                className="flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors"
                style={{ ":hover": { background: "var(--nx-card)" } }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "var(--nx-card)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "transparent")
                }
              >
                <Avatar user={u} size={36} />
                <div>
                  <p className="text-sm font-semibold" style={{ color: T }}>
                    {u.firstName} {u.lastName}
                  </p>
                  <p className="text-xs" style={{ color: M }}>
                    {(u.friends as string[]).length} friends
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Nav tabs — center */}
      <nav className="flex-1 flex items-center justify-center gap-x-4 gap-y-1">
        {navLinks.map(({ to, icon: Icon, label }) => {
          const active =
            to === "/" ? loc.pathname === "/" : loc.pathname.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              title={label}
              className="relative flex items-center justify-center w-11 h-9 rounded-xl transition-all"
              style={{
                background: active ? "rgba(124,111,247,0.12)" : "transparent",
                color: active ? A : M,
              }}
              onMouseEnter={(e) =>
                !active &&
                (((e.currentTarget as HTMLElement).style.background =
                  "var(--nx-card)"),
                ((e.currentTarget as HTMLElement).style.color =
                  "var(--nx-text)"))
              }
              onMouseLeave={(e) =>
                !active &&
                (((e.currentTarget as HTMLElement).style.background =
                  "transparent"),
                ((e.currentTarget as HTMLElement).style.color = M))
              }
            >
              <Icon size={20} />
              {active && (
                <span
                  className="absolute -bottom-[14px] left-1/2 -translate-x-1/2 w-5 h-0.5 rounded-full"
                  style={{ background: A }}
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Right actions */}
      <div className="flex items-center gap-1.5 ml-auto">
        {/* Theme toggle */}
        <button
          onClick={handleThemeToggle}
          className="w-9 h-9 flex items-center justify-center rounded-xl transition-colors"
          style={{ color: "var(--nx-muted)" }}
          title={
            theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
          }
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--nx-card)";
            e.currentTarget.style.color = "var(--nx-text)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "var(--nx-muted)";
          }}
        >
          <span
            className={themeAnim ? "theme-flip" : ""}
            style={{ display: "flex" }}
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </span>
        </button>

        {/* Notifications */}
        <div ref={notifRef} className="relative">
          <button
            onClick={() => {
              setShowNotifs((v) => !v);
              if (!showNotifs) fetchNotifs();
            }}
            className="relative w-9 h-9 flex items-center justify-center rounded-xl transition-colors"
            style={{
              background: showNotifs ? "rgba(124,111,247,0.12)" : "transparent",
              color: showNotifs ? A : M,
            }}
          >
            <Bell size={19} />
            {unread > 0 && (
              <span
                key={unread}
                className={cx(
                  "absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full text-white text-[10px] font-bold",
                  notifBump && "badge-pop",
                )}
                style={{ background: "#fb4570" }}
              >
                {unread > 99 ? "99+" : unread}
              </span>
            )}
          </button>
          {showNotifs && (
            <div
              className="absolute right-0 top-full mt-2 rounded-2xl shadow-2xl w-80 max-h-96 overflow-y-auto z-50 animate-fade-in"
              style={{
                background: "var(--nx-surface)",
                border: `1px solid ${B}`,
              }}
            >
              <div
                className="flex items-center justify-between px-4 py-3 sticky top-0"
                style={{
                  background: "var(--nx-surface)",
                  borderBottom: "1px solid var(--nx-border)",
                }}
              >
                <span
                  className="font-bold text-sm"
                  style={{ color: T, fontFamily: "var(--font-display)" }}
                >
                  Notifications
                </span>
                {unread > 0 && (
                  <button
                    onClick={() =>
                      api.put("/notifications/read-all").then(fetchNotifs)
                    }
                    className="text-xs flex items-center gap-1"
                    style={{ color: A }}
                  >
                    <Check size={11} /> Mark all read
                  </button>
                )}
              </div>
              {notifs.length === 0 ? (
                <p className="text-sm text-center py-10" style={{ color: M }}>
                  No notifications yet
                </p>
              ) : (
                notifs.map((n) => (
                  <div
                    key={n._id}
                    className="flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors"
                    style={{
                      borderBottom: `1px solid rgba(30,34,53,0.6)`,
                      background: !n.isRead
                        ? "rgba(124,111,247,0.04)"
                        : "transparent",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "var(--nx-card)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = !n.isRead
                        ? "rgba(124,111,247,0.04)"
                        : "transparent")
                    }
                    onClick={() =>
                      api.put(`/notifications/${n._id}/read`).then(fetchNotifs)
                    }
                  >
                    <img
                      src={n.sender ? getAvatar(n.sender, 72) : ""}
                      alt=""
                      className="w-9 h-9 rounded-full object-cover shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-sm leading-snug"
                        style={{ color: "var(--nx-text)" }}
                      >
                        {notifText(n)}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: A }}>
                        {timeAgo(n.createdAt)}
                      </p>
                    </div>
                    {!n.isRead && (
                      <span
                        className="w-2 h-2 rounded-full shrink-0 mt-1.5"
                        style={{ background: A }}
                      />
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Profile menu */}
        <div ref={menuRef} className="relative">
          <button
            onClick={() => setShowMenu((v) => !v)}
            className="flex items-center gap-1.5 px-2 py-1.5 rounded-xl transition-colors"
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "var(--nx-card)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "transparent")
            }
          >
            <Avatar user={user} size={28} />
            <ChevronDown size={13} style={{ color: M }} />
          </button>
          {showMenu && (
            <div
              className="absolute right-0 top-full mt-2 rounded-2xl shadow-2xl w-56 py-2 z-50 animate-fade-in"
              style={{
                background: "var(--nx-surface)",
                border: `1px solid ${B}`,
              }}
            >
              <div
                className="flex items-center gap-3 px-4 py-3 mb-1 cursor-pointer transition-colors"
                style={{ borderBottom: "1px solid var(--nx-border)" }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "var(--nx-card)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "transparent")
                }
                onClick={() => {
                  nav(`/profile/${user?._id}`);
                  setShowMenu(false);
                }}
              >
                <Avatar user={user} size={36} />
                <div>
                  <p className="text-sm font-semibold" style={{ color: T }}>
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs" style={{ color: M }}>
                    View profile
                  </p>
                </div>
              </div>
              {[
                {
                  icon: UserIcon,
                  label: "Profile",
                  action: () => {
                    nav(`/profile/${user?._id}`);
                    setShowMenu(false);
                  },
                },
                {
                  icon: Settings,
                  label: "Settings",
                  action: () => setShowMenu(false),
                },
                {
                  icon: LogOut,
                  label: "Log Out",
                  action: async () => {
                    await logout();
                    nav("/auth");
                    toast.success("Signed out");
                  },
                },
              ].map((item) => (
                <button
                  key={item.label}
                  onClick={item.action}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors"
                  style={{ color: "var(--nx-subtle)" }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "var(--nx-card)";
                    e.currentTarget.style.color = "var(--nx-text)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = "var(--nx-subtle)";
                  }}
                >
                  <span
                    className="w-7 h-7 flex items-center justify-center rounded-lg"
                    style={{ background: "var(--nx-border)" }}
                  >
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
