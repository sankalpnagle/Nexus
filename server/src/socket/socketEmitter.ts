import { Server } from "socket.io";

let _io: Server | null = null;
const onlineMap: Record<string, string> = {}; // userId → socketId (kept in sync by socket/index.ts)

export const registerIOForEmitter = (io: Server): void => {
  _io = io;
};

export const registerUserSocket = (userId: string, socketId: string): void => {
  onlineMap[userId] = socketId;
};

export const unregisterUserSocket = (userId: string): void => {
  delete onlineMap[userId];
};

/**
 * Broadcast an event to all connected clients, or just one user.
 *
 * @param event         Socket event name
 * @param data          Payload
 * @param targetUserId  If provided, sends only to that user (if online)
 */
export const emitEvent = (
  event: string,
  data: unknown,
  targetUserId?: string,
): void => {
  if (!_io) {
    console.warn("[socketEmitter] IO not registered yet");
    return;
  }

  if (targetUserId) {
    const sid = onlineMap[targetUserId];
    if (sid) {
      _io.to(sid).emit(event, data);
    }
  } else {
    _io.emit(event, data);
  }
};
