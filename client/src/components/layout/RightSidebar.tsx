import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { UserPlus, Sparkles, Check, X } from "lucide-react";
import api from "../../utils/api";
import { User } from "../../types";
import { getAvatar } from "../../utils/helpers";
import toast from "react-hot-toast";
import { useSocket } from "../../context/SocketContext";
import { useAuth } from "../../store/authStore";

const A = "#7c6ff7";
const M = "var(--nx-muted)";

interface FriendRequest {
  senderId: string;
  senderData: User;
}

export default function RightSidebar() {
  const [suggestions, setSuggestions] = useState<User[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());
  const nav = useNavigate();
  const { user } = useAuth();
  const {
    socket,
    emitFriendRequestSent,
    emitFriendRequestAccepted,
    emitFriendRequestDeclined,
  } = useSocket();

  // Fetch suggestions
  useEffect(() => {
    api
      .get("/users/suggestions")
      .then((r) => setSuggestions(r.data.users.slice(0, 6)))
      .catch(() => {});
  }, []);

  // Fetch pending incoming requests
  useEffect(() => {
    api
      .get("/users/friend-requests/pending")
      .then((r) => {
        const reqs = (r.data.requests ?? []).map((req: { sender: User }) => ({
          senderId: req.sender._id,
          senderData: req.sender,
        }));
        setPendingRequests(reqs);
      })
      .catch(() => {});
  }, []);

  // ── Real-time: incoming friend request ────────────────────────────────────
  useEffect(() => {
    if (!socket) return;

    const handle = ({ senderId, senderData }: FriendRequest) => {
      setPendingRequests((prev) =>
        prev.some((r) => r.senderId === senderId)
          ? prev
          : [{ senderId, senderData }, ...prev],
      );
      setSuggestions((prev) => prev.filter((u) => u._id !== senderId));
    };

    socket.on("friend:request_received", handle);
    return () => {
      socket.off("friend:request_received", handle);
    };
  }, [socket]);

  // ── Send friend request ───────────────────────────────────────────────────
  const sendRequest = async (uid: string) => {
    try {
      await api.post(`/users/${uid}/friend-request`);
      setSuggestions((prev) => prev.filter((u) => u._id !== uid));
      setSentIds((prev) => new Set([...prev, uid]));

      const myData = {
        _id: user?._id,
        firstName: user?.firstName,
        lastName: user?.lastName,
        avatar: user?.avatar,
        friends: user?.friends,
      };
      emitFriendRequestSent(uid, myData);
      toast.success("Friend request sent!");
    } catch {
      toast.error("Failed to send request");
    }
  };

  // ── Accept friend request ─────────────────────────────────────────────────
  const acceptRequest = async (senderId: string) => {
    try {
      await api.put(`/users/${senderId}/friend-request`, { action: "accept" });
      setPendingRequests((prev) => prev.filter((r) => r.senderId !== senderId));

      const myData = {
        _id: user?._id,
        firstName: user?.firstName,
        lastName: user?.lastName,
        avatar: user?.avatar,
      };
      emitFriendRequestAccepted(senderId, myData);
      toast.success("Friend request accepted!");
    } catch {
      toast.error("Failed to accept request");
    }
  };

  // ── Decline friend request ────────────────────────────────────────────────
  const declineRequest = async (senderId: string) => {
    try {
      await api.put(`/users/${senderId}/friend-request`, { action: "decline" });
      setPendingRequests((prev) => prev.filter((r) => r.senderId !== senderId));
      emitFriendRequestDeclined(senderId);
      toast("Request declined");
    } catch {
      toast.error("Failed to decline request");
    }
  };

  const hasPendingRequests = pendingRequests.length > 0;
  const hasSuggestions = suggestions.length > 0;

  if (!hasPendingRequests && !hasSuggestions) return null;

  return (
    <aside className="w-64 shrink-0 sticky top-14 h-[calc(100vh-56px)] overflow-y-auto py-4 px-2 hidden xl:block">
      {/* ── Pending Requests ───────────────────────────────────────────── */}
      {hasPendingRequests && (
        <div className="mb-5">
          <div className="flex items-center gap-2 px-2 mb-3">
            <span
              className="w-4 h-4 flex items-center justify-center rounded-full text-[9px] font-bold text-white"
              style={{ background: A }}
            >
              {pendingRequests.length}
            </span>
            <p
              className="text-[10px] font-bold uppercase tracking-wider"
              style={{ color: M }}
            >
              Friend Requests
            </p>
          </div>

          <div className="space-y-1">
            {pendingRequests.map((req) => (
              <div
                key={req.senderId}
                className="flex items-center gap-2.5 px-2 py-2.5 rounded-xl"
                style={{ background: "var(--nx-card)" }}
              >
                <img
                  src={getAvatar(req.senderData, 72)}
                  alt=""
                  className="w-9 h-9 rounded-full object-cover shrink-0 cursor-pointer"
                  onClick={() => nav(`/profile/${req.senderId}`)}
                />
                <div
                  className="flex-1 min-w-0 cursor-pointer"
                  onClick={() => nav(`/profile/${req.senderId}`)}
                >
                  <p
                    className="text-sm font-semibold truncate"
                    style={{ color: "var(--nx-text)" }}
                  >
                    {req.senderData.firstName} {req.senderData.lastName}
                  </p>
                  <p className="text-xs" style={{ color: M }}>
                    Wants to connect
                  </p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => acceptRequest(req.senderId)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-white"
                    style={{ background: A }}
                    title="Accept"
                  >
                    <Check size={12} />
                  </button>
                  <button
                    onClick={() => declineRequest(req.senderId)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg"
                    style={{ background: "var(--nx-border)", color: M }}
                    title="Decline"
                  >
                    <X size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Suggestions ────────────────────────────────────────────────── */}
      {hasSuggestions && (
        <div>
          <div className="flex items-center gap-2 px-2 mb-3">
            <Sparkles size={13} style={{ color: A }} />
            <p
              className="text-[10px] font-bold uppercase tracking-wider"
              style={{ color: M }}
            >
              People You May Know
            </p>
          </div>

          <div className="space-y-1">
            {suggestions.map((u) => (
              <div
                key={u._id}
                className="flex items-center gap-2.5 px-2 py-2.5 rounded-xl transition-colors group"
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "var(--nx-card)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "transparent")
                }
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
                  <p
                    className="text-sm font-semibold truncate"
                    style={{ color: "var(--nx-text)" }}
                  >
                    {u.firstName} {u.lastName}
                  </p>
                  <p className="text-xs" style={{ color: M }}>
                    {(u.friends as string[]).length} mutual
                  </p>
                </div>
                <button
                  onClick={() => sendRequest(u._id)}
                  disabled={sentIds.has(u._id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity w-7 h-7 flex items-center justify-center rounded-lg disabled:opacity-50"
                  style={{ background: "rgba(124,111,247,0.12)", color: A }}
                  onMouseEnter={(e) => {
                    if (!sentIds.has(u._id)) {
                      e.currentTarget.style.background = A;
                      e.currentTarget.style.color = "#fff";
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(124,111,247,0.12)";
                    e.currentTarget.style.color = A;
                  }}
                  title={
                    sentIds.has(u._id) ? "Request sent" : "Send friend request"
                  }
                >
                  {sentIds.has(u._id) ? (
                    <Check size={13} />
                  ) : (
                    <UserPlus size={13} />
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}
