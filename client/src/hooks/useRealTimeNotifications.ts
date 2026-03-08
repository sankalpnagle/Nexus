import { useEffect } from "react";
import { useSocket } from "../context/SocketContext";
import { Notification } from "../types";

interface Options {
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
  setUnreadCount: React.Dispatch<React.SetStateAction<number>>;
}

export const useRealTimeNotifications = ({
  setNotifications,
  setUnreadCount,
}: Options) => {
  const { socket } = useSocket();

  // New notification
  useEffect(() => {
    if (!socket) return;
    const handle = (n: Notification) => {
      setNotifications((prev) => [n, ...prev]);
      setUnreadCount((c) => c + 1);
    };
    socket.on("notification:receive", handle);
    return () => {
      socket.off("notification:receive", handle);
    };
  }, [socket, setNotifications, setUnreadCount]);

  // Single read
  useEffect(() => {
    if (!socket) return;
    const handle = ({ notificationId }: { notificationId: string }) => {
      setNotifications((prev) =>
        prev.map((n) =>
          n._id === notificationId ? { ...n, isRead: true } : n,
        ),
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    };
    socket.on("notification:read", handle);
    return () => {
      socket.off("notification:read", handle);
    };
  }, [socket, setNotifications, setUnreadCount]);

  // Bulk read
  useEffect(() => {
    if (!socket) return;
    const handle = () => {
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    };
    socket.on("notification:read_all", handle);
    return () => {
      socket.off("notification:read_all", handle);
    };
  }, [socket, setNotifications, setUnreadCount]);
};
