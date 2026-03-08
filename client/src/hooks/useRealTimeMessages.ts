import { useEffect, useState } from "react";
import { useSocket } from "../context/SocketContext";
import { Message } from "../types";

interface TypingUser {
  userId: string;
  name: string;
}

interface Options {
  conversationId: string;
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  currentUserId: string;
}

export const useRealTimeMessages = ({
  conversationId,
  messages,
  setMessages,
  currentUserId,
}: Options) => {
  const { socket, joinConversation, leaveConversation, markMessageRead } =
    useSocket();
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);

  // Join / leave room on mount / unmount
  useEffect(() => {
    if (!conversationId) return;
    joinConversation(conversationId);
    return () => leaveConversation(conversationId);
  }, [conversationId, joinConversation, leaveConversation]);

  // Incoming message
  useEffect(() => {
    if (!socket) return;

    const handleReceive = (msg: Message) => {
      setMessages((prev) => {
        if (prev.some((m) => m._id === msg._id)) return prev;
        return [...prev, msg];
      });

      // Auto-mark as read if this is the active conversation
      if ((msg.sender as unknown as string) !== currentUserId) {
        markMessageRead(conversationId, [msg._id]);
      }
    };

    socket.on("message:receive", handleReceive);
    return () => {
      socket.off("message:receive", handleReceive);
    };
  }, [socket, conversationId, currentUserId, markMessageRead, setMessages]);

  // Message deleted
  useEffect(() => {
    if (!socket) return;

    const handle = ({ messageId }: { messageId: string }) => {
      setMessages((prev) => prev.filter((m) => m._id !== messageId));
    };

    socket.on("message:deleted", handle);
    return () => {
      socket.off("message:deleted", handle);
    };
  }, [socket, setMessages]);

  // Read receipts
  useEffect(() => {
    if (!socket) return;

    const handle = ({
      messageIds,
      userId,
    }: {
      messageIds: string[];
      userId: string;
    }) => {
      setMessages((prev) =>
        prev.map((m) =>
          messageIds.includes(m._id)
            ? { ...m, readBy: [...(m.readBy ?? []), userId] }
            : m,
        ),
      );
    };

    socket.on("message:read", handle);
    return () => {
      socket.off("message:read", handle);
    };
  }, [socket, setMessages]);

  // Typing indicators
  useEffect(() => {
    if (!socket) return;

    const handleStart = ({
      userId,
      name,
    }: {
      userId: string;
      name: string;
    }) => {
      if (userId === currentUserId) return;
      setTypingUsers((prev) =>
        prev.some((t) => t.userId === userId)
          ? prev
          : [...prev, { userId, name }],
      );
    };

    const handleStop = ({ userId }: { userId: string }) => {
      setTypingUsers((prev) => prev.filter((t) => t.userId !== userId));
    };

    socket.on("typing:start", handleStart);
    socket.on("typing:stop", handleStop);
    return () => {
      socket.off("typing:start", handleStart);
      socket.off("typing:stop", handleStop);
    };
  }, [socket, currentUserId]);

  return { typingUsers };
};
