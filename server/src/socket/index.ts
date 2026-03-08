import { Server, Socket } from "socket.io";
import User from "../models/User.js";
import { registerUserSocket, unregisterUserSocket } from "./socketEmitter.js";

// ─── Online presence map ──────────────────────────────────────────────────────
const onlineMap: Record<string, string> = {}; // userId → socketId

// Helper: get socketId for a user (or undefined if offline)
const getSocket = (userId: string): string | undefined => onlineMap[userId];

// Helper: emit to a specific user if online
const emitToUser = (
  io: Server,
  userId: string,
  event: string,
  data: unknown,
): void => {
  const sid = getSocket(userId);
  if (sid) io.to(sid).emit(event, data);
};

export const initSocket = (io: Server): void => {
  io.on("connection", (socket: Socket) => {
    console.log(`[Socket] connected: ${socket.id}`);

    // ─── 1. PRESENCE ───────────────────────────────────────────────────────────

    socket.on("user:online", async (userId: string) => {
      if (!userId) return;
      onlineMap[userId] = socket.id;
      registerUserSocket(userId, socket.id); // keep emitter map in sync
      socket.data.userId = userId;
      await User.findByIdAndUpdate(userId, { isOnline: true });
      // Broadcast to ALL clients so every user sees status change
      io.emit("user:status", { userId, isOnline: true });
      // Send current online list to the newly connected user
      socket.emit("users:online_list", Object.keys(onlineMap));
    });

    // ─── 2. MESSAGING ──────────────────────────────────────────────────────────

    socket.on("conversation:join", (conversationId: string) => {
      socket.join(`conv:${conversationId}`);
    });

    socket.on("conversation:leave", (conversationId: string) => {
      socket.leave(`conv:${conversationId}`);
    });

    socket.on(
      "message:send",
      (d: {
        conversationId: string;
        message: object;
        recipientId?: string;
      }) => {
        // Deliver to everyone in the conversation room (except sender)
        socket
          .to(`conv:${d.conversationId}`)
          .emit("message:receive", d.message);
        // Also directly deliver to recipient if specified (covers the case they
        // haven't joined the room yet)
        if (d.recipientId) {
          emitToUser(io, d.recipientId, "message:receive", d.message);
        }
      },
    );

    socket.on(
      "message:delete",
      (d: { conversationId: string; messageId: string }) => {
        io.to(`conv:${d.conversationId}`).emit("message:deleted", d);
      },
    );

    socket.on(
      "message:read",
      (d: { conversationId: string; userId: string; messageIds: string[] }) => {
        socket.to(`conv:${d.conversationId}`).emit("message:read", d);
      },
    );

    socket.on(
      "typing:start",
      (d: { conversationId: string; userId: string; name: string }) => {
        socket.to(`conv:${d.conversationId}`).emit("typing:start", d);
      },
    );

    socket.on(
      "typing:stop",
      (d: { conversationId: string; userId: string }) => {
        socket.to(`conv:${d.conversationId}`).emit("typing:stop", d);
      },
    );

    // ─── 3. POSTS ──────────────────────────────────────────────────────────────

    // New post created — broadcast to all users (feed update)
    socket.on("post:created", (d: { post: object }) => {
      socket.broadcast.emit("post:new", d.post);
    });

    // Post deleted
    socket.on("post:deleted", (d: { postId: string }) => {
      io.emit("post:removed", d);
    });

    // Post liked / unliked
    socket.on(
      "post:liked",
      (d: {
        postId: string;
        userId: string;
        likes: string[];
        authorId: string;
      }) => {
        // Update all clients showing this post
        io.emit("post:liked", d);
        // Notify the post author (if they're someone else)
        if (d.authorId && d.authorId !== d.userId) {
          emitToUser(io, d.authorId, "notification:receive", {
            type: "like",
            postId: d.postId,
            fromUserId: d.userId,
            createdAt: new Date(),
          });
        }
      },
    );

    // Post commented
    socket.on(
      "post:commented",
      (d: {
        postId: string;
        comment: object;
        authorId: string;
        commenterId: string;
      }) => {
        io.emit("post:commented", d);
        if (d.authorId && d.authorId !== d.commenterId) {
          emitToUser(io, d.authorId, "notification:receive", {
            type: "comment",
            postId: d.postId,
            fromUserId: d.commenterId,
            comment: d.comment,
            createdAt: new Date(),
          });
        }
      },
    );

    // Comment deleted
    socket.on("comment:deleted", (d: { postId: string; commentId: string }) => {
      io.emit("comment:deleted", d);
    });

    // Comment liked
    socket.on(
      "comment:liked",
      (d: {
        postId: string;
        commentId: string;
        userId: string;
        likes: string[];
      }) => {
        io.emit("comment:liked", d);
      },
    );

    // ─── 4. FRIEND REQUESTS ────────────────────────────────────────────────────

    socket.on(
      "friend:request_sent",
      (d: { senderId: string; recipientId: string; senderData: object }) => {
        emitToUser(io, d.recipientId, "friend:request_received", {
          senderId: d.senderId,
          senderData: d.senderData,
          createdAt: new Date(),
        });
        emitToUser(io, d.recipientId, "notification:receive", {
          type: "friend_request",
          fromUserId: d.senderId,
          fromUserData: d.senderData,
          createdAt: new Date(),
        });
      },
    );

    socket.on(
      "friend:request_accepted",
      (d: {
        acceptorId: string;
        requesterId: string;
        acceptorData: object;
      }) => {
        emitToUser(io, d.requesterId, "friend:request_accepted", {
          acceptorId: d.acceptorId,
          acceptorData: d.acceptorData,
          createdAt: new Date(),
        });
        emitToUser(io, d.requesterId, "notification:receive", {
          type: "friend_accept",
          fromUserId: d.acceptorId,
          fromUserData: d.acceptorData,
          createdAt: new Date(),
        });
        const acceptorSid = getSocket(d.acceptorId);
        if (acceptorSid) io.to(acceptorSid).emit("friends:list_updated");
        emitToUser(io, d.requesterId, "friends:list_updated", {});
      },
    );

    socket.on(
      "friend:request_declined",
      (d: { declinerId: string; requesterId: string }) => {
        emitToUser(io, d.requesterId, "friend:request_declined", {
          declinerId: d.declinerId,
        });
      },
    );

    socket.on(
      "friend:removed",
      (d: { removerId: string; removedId: string }) => {
        emitToUser(io, d.removedId, "friend:removed", {
          removerId: d.removerId,
        });
        emitToUser(io, d.removerId, "friend:removed", {
          removerId: d.removedId,
        });
      },
    );

    // ─── 5. NOTIFICATIONS ──────────────────────────────────────────────────────

    socket.on(
      "notification:send",
      (d: { recipientId: string; notification: object }) => {
        emitToUser(io, d.recipientId, "notification:receive", d.notification);
      },
    );

    socket.on(
      "notification:read",
      (d: { userId: string; notificationId: string }) => {
        const sid = getSocket(d.userId);
        if (sid) io.to(sid).emit("notification:read", d);
      },
    );

    socket.on("notification:read_all", (d: { userId: string }) => {
      const sid = getSocket(d.userId);
      if (sid) io.to(sid).emit("notification:read_all", d);
    });

    // ─── 6. DISCONNECT ─────────────────────────────────────────────────────────

    socket.on("disconnect", async () => {
      const uid = socket.data.userId as string | undefined;
      if (uid) {
        delete onlineMap[uid];
        unregisterUserSocket(uid); // keep emitter map in sync
        const lastSeen = new Date();
        await User.findByIdAndUpdate(uid, { isOnline: false, lastSeen });
        io.emit("user:status", { userId: uid, isOnline: false, lastSeen });
        console.log(`[Socket] user ${uid} went offline`);
      }
      console.log(`[Socket] disconnected: ${socket.id}`);
    });
  });
};
