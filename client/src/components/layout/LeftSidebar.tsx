import React, { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  Home,
  Users,
  MessageCircle,
  Grid3x3,
  Bookmark,
  Clock,
  ChevronRight,
  Zap,
  MessageSquare,
} from "lucide-react";
import { useAuth } from "../../store/authStore";
import { useSocket } from "../../context/SocketContext";
import { Avatar } from "../ui";
import { cx } from "../../utils/helpers";
import api from "../../utils/api";
import toast from "react-hot-toast";

const navItems = [
  { to: "/", icon: Home, label: "Home Feed" },
  { to: "/friends", icon: Users, label: "Friends" },
  { to: "/messages", icon: MessageCircle, label: "Messages" },
  { to: "/groups", icon: Grid3x3, label: "Groups" },
  { to: "/saved", icon: Bookmark, label: "Saved" },
  { to: "/memories", icon: Clock, label: "Memories" },
];

const A = "#7c6ff7";
const B = "var(--nx-border)";
const T = "var(--nx-heading)";
const M = "var(--nx-muted)";
const ST = "var(--nx-subtle)";

export default function LeftSidebar() {
  const { user, refreshUser } = useAuth();
  const { onlineUsers } = useSocket();
  const nav = useNavigate();
  const [startingChat, setStartingChat] = useState<string | null>(null);

  // Refresh user data to get populated friends list
  useEffect(() => {
    refreshUser?.();
  }, []);

  const friends =
    (user?.friends as {
      _id: string;
      firstName: string;
      lastName: string;
      avatar: string;
      isOnline: boolean;
    }[]) || [];
  // Include friend if socket says online OR friend's own isOnline flag
  const onlineFriends = friends.filter(
    (f) => typeof f === "object" && (onlineUsers.has(f._id) || f.isOnline),
  );

  const handleStartChat = async (friendId: string) => {
    setStartingChat(friendId);
    try {
      nav("/messages", { state: { openDm: friendId } });
    } catch {
      toast.error("Could not open chat");
    } finally {
      setStartingChat(null);
    }
  };

  return (
    <aside className="w-64 shrink-0 sticky top-14 h-[calc(100vh-56px)] overflow-y-auto py-4 px-2 hidden lg:flex flex-col gap-1">
      {/* Profile link */}
      <button
        onClick={() => nav(`/profile/${user?._id}`)}
        className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors group mb-1 w-full text-left"
        onMouseEnter={(e) =>
          (e.currentTarget.style.background = "var(--nx-card)")
        }
        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
      >
        <Avatar user={user} size={36} />
        <div>
          <p
            className="text-sm font-semibold transition-colors"
            style={{ color: "var(--nx-text)" }}
          >
            {user?.firstName} {user?.lastName}
          </p>
          <p className="text-xs" style={{ color: M }}>
            View profile
          </p>
        </div>
      </button>

      {/* Nav items */}
      <nav className="space-y-0.5">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              cx(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group",
                isActive ? "" : "",
              )
            }
            style={({ isActive }) => ({
              background: isActive ? "rgba(124,111,247,0.1)" : "transparent",
              color: isActive ? A : ST,
            })}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLElement;
              if (!el.classList.contains("active")) {
                el.style.background = "var(--nx-card)";
                el.style.color = "var(--nx-text)";
              }
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLElement;
              if (!el.getAttribute("aria-current")) {
                el.style.background = "";
                el.style.color = "";
              }
            }}
          >
            {({ isActive }) => (
              <>
                <span
                  className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors"
                  style={{
                    background: isActive ? A : "var(--nx-border)",
                    color: isActive ? "#fff" : ST,
                  }}
                >
                  <Icon size={16} />
                </span>
                <span className="flex-1">{label}</span>
                {isActive && (
                  <ChevronRight size={13} style={{ opacity: 0.4 }} />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Separator */}
      <div className="my-2" style={{ borderTop: `1px solid ${B}` }} />

      {/* Online Friends */}
      <div>
        <div className="flex items-center gap-2 px-3 mb-2">
          <Zap size={12} style={{ color: "#22d3ee" }} />
          <p
            className="text-[10px] font-bold uppercase tracking-wider"
            style={{ color: M }}
          >
            Online Friends
            {onlineFriends.length > 0 && (
              <span
                className="ml-1.5 px-1.5 py-0.5 rounded-full text-[9px]"
                style={{
                  background: "rgba(34,211,238,0.12)",
                  color: "#22d3ee",
                }}
              >
                {onlineFriends.length}
              </span>
            )}
          </p>
        </div>

        {onlineFriends.length === 0 ? (
          <p className="px-3 text-xs" style={{ color: M }}>
            No friends online right now
          </p>
        ) : (
          onlineFriends.slice(0, 10).map((f) => (
            <div
              key={f._id}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-colors group relative"
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "var(--nx-card)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "transparent")
              }
            >
              {/* Avatar — click to profile */}
              <button
                onClick={() => nav(`/profile/${f._id}`)}
                className="shrink-0"
              >
                <Avatar user={f as never} size={30} online />
              </button>

              {/* Name — click to profile */}
              <button
                onClick={() => nav(`/profile/${f._id}`)}
                className="flex-1 text-left text-sm truncate transition-colors"
                style={{ color: ST }}
              >
                {f.firstName} {f.lastName}
              </button>

              {/* Message button — appears on hover */}
              <button
                onClick={() => handleStartChat(f._id)}
                disabled={startingChat === f._id}
                className="opacity-0 group-hover:opacity-100 transition-all w-7 h-7 flex items-center justify-center rounded-lg shrink-0"
                style={{ background: "rgba(124,111,247,0.15)", color: A }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = A;
                  e.currentTarget.style.color = "#fff";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(124,111,247,0.15)";
                  e.currentTarget.style.color = A;
                }}
                title={`Message ${f.firstName}`}
              >
                {startingChat === f._id ? (
                  <span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <MessageSquare size={13} />
                )}
              </button>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="mt-auto pt-4" style={{ borderTop: `1px solid ${B}` }}>
        <p className="text-[10px] px-3 leading-relaxed" style={{ color: M }}>
          Nexus © 2025 · Privacy · Terms
        </p>
      </div>
    </aside>
  );
}
