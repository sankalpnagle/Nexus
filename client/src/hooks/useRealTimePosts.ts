import { useEffect } from "react";
import { useSocket } from "../context/SocketContext";
import { Post } from "../types";

interface Options {
  posts: Post[];
  setPosts: React.Dispatch<React.SetStateAction<Post[]>>;
  currentUserId: string;
}

export const useRealTimePosts = ({
  posts,
  setPosts,
  currentUserId,
}: Options) => {
  const { socket } = useSocket();

  // ── New post ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!socket) return;

    const handleNewPost = (post: Post) => {
      // Don't duplicate our own posts (already added optimistically)
      if (
        post.author?._id === currentUserId ||
        (post.author as unknown as string) === currentUserId
      )
        return;
      setPosts((prev) => [post, ...prev]);
    };

    socket.on("post:new", handleNewPost);
    return () => {
      socket.off("post:new", handleNewPost);
    };
  }, [socket, setPosts, currentUserId]);

  // ── Post removed ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!socket) return;

    const handleRemoved = ({ postId }: { postId: string }) => {
      setPosts((prev) => prev.filter((p) => p._id !== postId));
    };

    socket.on("post:removed", handleRemoved);
    return () => {
      socket.off("post:removed", handleRemoved);
    };
  }, [socket, setPosts]);

  // ── Like update ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!socket) return;

    const handleLiked = ({
      postId,
      likes,
    }: {
      postId: string;
      likes: string[];
    }) => {
      setPosts((prev) =>
        prev.map((p) => (p._id === postId ? { ...p, likes } : p)),
      );
    };

    socket.on("post:liked", handleLiked);
    return () => {
      socket.off("post:liked", handleLiked);
    };
  }, [socket, setPosts]);

  // ── Comment update ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!socket) return;

    const handleCommented = ({
      postId,
      comment,
    }: {
      postId: string;
      comment: object;
    }) => {
      setPosts((prev) =>
        prev.map((p) =>
          p._id === postId
            ? { ...p, comments: [...(p.comments ?? []), comment as any] }
            : p,
        ),
      );
    };

    socket.on("post:commented", handleCommented);
    return () => {
      socket.off("post:commented", handleCommented);
    };
  }, [socket, setPosts]);

  // ── Comment deleted ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!socket) return;

    const handleCommentDeleted = ({
      postId,
      commentId,
    }: {
      postId: string;
      commentId: string;
    }) => {
      setPosts((prev) =>
        prev.map((p) =>
          p._id === postId
            ? {
                ...p,
                comments: (p.comments ?? []).filter((c) => c._id !== commentId),
              }
            : p,
        ),
      );
    };

    socket.on("comment:deleted", handleCommentDeleted);
    return () => {
      socket.off("comment:deleted", handleCommentDeleted);
    };
  }, [socket, setPosts]);
};
