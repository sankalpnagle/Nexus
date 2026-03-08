import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";
import { io, Socket } from "socket.io-client";
import toast from "react-hot-toast";
import { useAuth } from "../store/authStore";
import type { User } from "../types";

// ─── Types ────────────────────────────────────────────────────────────────────

interface UserStatusPayload {
  userId: string;
  isOnline: boolean;
  lastSeen?: Date;
}

interface NotificationPayload {
  type: "like" | "comment" | "friend_request" | "friend_accept" | string;
  fromUserId: string;
  fromUserData?: { firstName: string; lastName: string; avatar?: string };
  postId?: string;
  comment?: object;
  createdAt: Date;
}

interface SocketContextValue {
  socket: Socket | null;
  isConnected: boolean;
  onlineUsers: Set<string>;
  // helpers
  joinConversation: (conversationId: string) => void;
  leaveConversation: (conversationId: string) => void;
  sendMessage: (
    conversationId: string,
    message: object,
    recipientId?: string,
  ) => void;
  sendTypingStart: (conversationId: string, name: string) => void;
  sendTypingStop: (conversationId: string) => void;
  emitPostLiked: (data: {
    postId: string;
    userId: string;
    likes: string[];
    authorId: string;
  }) => void;
  emitPostCommented: (data: {
    postId: string;
    comment: object;
    authorId: string;
    commenterId: string;
  }) => void;
  emitPostCreated: (post: object) => void;
  emitPostDeleted: (postId: string) => void;
  emitFriendRequestSent: (recipientId: string, senderData: object) => void;
  emitFriendRequestAccepted: (
    requesterId: string,
    acceptorData: object,
  ) => void;
  emitFriendRequestDeclined: (requesterId: string) => void;
  emitFriendRemoved: (removedId: string) => void;
  markMessageRead: (conversationId: string, messageIds: string[]) => void;
  deleteMessage: (conversationId: string, messageId: string) => void;
  deleteComment: (postId: string, commentId: string) => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const SocketContext = createContext<SocketContextValue | null>(null);

export const useSocket = (): SocketContextValue => {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error("useSocket must be used inside SocketProvider");
  return ctx;
};

// ─── Provider ─────────────────────────────────────────────────────────────────

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL ?? "http://localhost:5000";

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

  // ── Connect / disconnect ──────────────────────────────────────────────────
  useEffect(() => {
    if (!user?._id) return;

    const socket = io(SOCKET_URL, {
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setIsConnected(true);
      socket.emit("user:online", user._id);
      console.log("[Socket] connected as", user._id);
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
      console.log("[Socket] disconnected");
    });

    socket.on("connect_error", (err) => {
      console.error("[Socket] connection error", err.message);
    });

    // ── Presence ─────────────────────────────────────────────────────────
    socket.on("users:online_list", (ids: string[]) => {
      setOnlineUsers(new Set(ids));
    });

    socket.on("user:status", ({ userId, isOnline }: UserStatusPayload) => {
      setOnlineUsers((prev) => {
        const next = new Set(prev);
        if (isOnline) next.add(userId);
        else next.delete(userId);
        return next;
      });
    });

    // ── Notification toasts ───────────────────────────────────────────────
    socket.on("notification:receive", (n: NotificationPayload) => {
      const name = n.fromUserData
        ? `${n.fromUserData.firstName} ${n.fromUserData.lastName}`
        : "Someone";

      if (n.type === "like") toast(`❤️ ${name} liked your post`);
      else if (n.type === "comment") toast(`💬 ${name} commented on your post`);
      else if (n.type === "friend_request")
        toast(`👋 ${name} sent you a friend request`);
      else if (n.type === "friend_accept")
        toast(`🎉 ${name} accepted your friend request`);
    });

    socket.on(
      "friend:request_received",
      (req: { senderId: string; senderData: User; createdAt: string }) => {
        // Update authStore directly so FriendsPage shows instantly on any tab
        const { user: current, setUser } = useAuth.getState();
        if (!current) return;
        if (current.friendRequests.some((r) => r.from._id === req.senderId))
          return;
        setUser({
          ...current,
          friendRequests: [
            ...current.friendRequests,
            {
              _id: req.senderId,
              from: req.senderData,
              createdAt: req.createdAt,
            },
          ],
        });
      },
    );

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setIsConnected(false);
      setOnlineUsers(new Set());
    };
  }, [user?._id]);

  // ── Helpers ───────────────────────────────────────────────────────────────

  const emit = useCallback((event: string, data?: unknown) => {
    socketRef.current?.emit(event, data);
  }, []);

  const joinConversation = useCallback(
    (id: string) => emit("conversation:join", id),
    [emit],
  );

  const leaveConversation = useCallback(
    (id: string) => emit("conversation:leave", id),
    [emit],
  );

  const sendMessage = useCallback(
    (conversationId: string, message: object, recipientId?: string) =>
      emit("message:send", { conversationId, message, recipientId }),
    [emit],
  );

  const sendTypingStart = useCallback(
    (conversationId: string, name: string) =>
      emit("typing:start", { conversationId, userId: user?._id, name }),
    [emit, user?._id],
  );

  const sendTypingStop = useCallback(
    (conversationId: string) =>
      emit("typing:stop", { conversationId, userId: user?._id }),
    [emit, user?._id],
  );

  const markMessageRead = useCallback(
    (conversationId: string, messageIds: string[]) =>
      emit("message:read", { conversationId, userId: user?._id, messageIds }),
    [emit, user?._id],
  );

  const deleteMessage = useCallback(
    (conversationId: string, messageId: string) =>
      emit("message:delete", { conversationId, messageId }),
    [emit],
  );

  const emitPostLiked = useCallback(
    (data: {
      postId: string;
      userId: string;
      likes: string[];
      authorId: string;
    }) => emit("post:liked", data),
    [emit],
  );

  const emitPostCommented = useCallback(
    (data: {
      postId: string;
      comment: object;
      authorId: string;
      commenterId: string;
    }) => emit("post:commented", data),
    [emit],
  );

  const emitPostCreated = useCallback(
    (post: object) => emit("post:created", { post }),
    [emit],
  );

  const emitPostDeleted = useCallback(
    (postId: string) => emit("post:deleted", { postId }),
    [emit],
  );

  const emitFriendRequestSent = useCallback(
    (recipientId: string, senderData: object) =>
      emit("friend:request_sent", {
        senderId: user?._id,
        recipientId,
        senderData,
      }),
    [emit, user?._id],
  );

  const emitFriendRequestAccepted = useCallback(
    (requesterId: string, acceptorData: object) =>
      emit("friend:request_accepted", {
        acceptorId: user?._id,
        requesterId,
        acceptorData,
      }),
    [emit, user?._id],
  );

  const emitFriendRequestDeclined = useCallback(
    (requesterId: string) =>
      emit("friend:request_declined", {
        declinerId: user?._id,
        requesterId,
      }),
    [emit, user?._id],
  );

  const emitFriendRemoved = useCallback(
    (removedId: string) =>
      emit("friend:removed", { removerId: user?._id, removedId }),
    [emit, user?._id],
  );

  const deleteComment = useCallback(
    (postId: string, commentId: string) =>
      emit("comment:deleted", { postId, commentId }),
    [emit],
  );

  return (
    <SocketContext.Provider
      value={{
        socket: socketRef.current,
        isConnected,
        onlineUsers,
        joinConversation,
        leaveConversation,
        sendMessage,
        sendTypingStart,
        sendTypingStop,
        emitPostLiked,
        emitPostCommented,
        emitPostCreated,
        emitPostDeleted,
        emitFriendRequestSent,
        emitFriendRequestAccepted,
        emitFriendRequestDeclined,
        emitFriendRemoved,
        markMessageRead,
        deleteMessage,
        deleteComment,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};
