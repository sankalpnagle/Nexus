import { useEffect } from "react";
import { useSocket } from "../context/SocketContext";
import { User } from "../types";

interface FriendRequest {
  senderId: string;
  senderData: User;
  createdAt: Date;
}

interface Options {
  setPendingRequests?: React.Dispatch<React.SetStateAction<FriendRequest[]>>;
  setFriends?: React.Dispatch<React.SetStateAction<User[]>>;
  onFriendsListUpdated?: () => void;
}

export const useRealTimeFriends = ({
  setPendingRequests,
  setFriends,
  onFriendsListUpdated,
}: Options) => {
  const { socket } = useSocket();

  // Incoming friend request
  useEffect(() => {
    if (!socket || !setPendingRequests) return;

    const handle = (req: FriendRequest) => {
      setPendingRequests((prev) => {
        if (prev.some((r) => r.senderId === req.senderId)) return prev;
        return [req, ...prev];
      });
    };

    socket.on("friend:request_received", handle);
    return () => {
      socket.off("friend:request_received", handle);
    };
  }, [socket, setPendingRequests]);

  // Request accepted
  useEffect(() => {
    if (!socket) return;

    const handle = ({
      acceptorId,
      acceptorData,
    }: {
      acceptorId: string;
      acceptorData: User;
    }) => {
      setPendingRequests?.((prev) =>
        prev.filter((r) => r.senderId !== acceptorId),
      );
      setFriends?.((prev) => {
        if (prev.some((f) => f._id === acceptorId)) return prev;
        return [...prev, acceptorData];
      });
    };

    socket.on("friend:request_accepted", handle);
    return () => {
      socket.off("friend:request_accepted", handle);
    };
  }, [socket, setPendingRequests, setFriends]);

  // Request declined
  useEffect(() => {
    if (!socket || !setPendingRequests) return;

    const handle = ({ declinerId }: { declinerId: string }) => {
      setPendingRequests((prev) =>
        prev.filter((r) => r.senderId !== declinerId),
      );
    };

    socket.on("friend:request_declined", handle);
    return () => {
      socket.off("friend:request_declined", handle);
    };
  }, [socket, setPendingRequests]);

  // Friend removed
  useEffect(() => {
    if (!socket || !setFriends) return;

    const handle = ({ removerId }: { removerId: string }) => {
      setFriends((prev) => prev.filter((f) => f._id !== removerId));
    };

    socket.on("friend:removed", handle);
    return () => {
      socket.off("friend:removed", handle);
    };
  }, [socket, setFriends]);

  // Generic "go fetch again" signal
  useEffect(() => {
    if (!socket || !onFriendsListUpdated) return;

    socket.on("friends:list_updated", onFriendsListUpdated);
    return () => {
      socket.off("friends:list_updated", onFriendsListUpdated);
    };
  }, [socket, onFriendsListUpdated]);
};
