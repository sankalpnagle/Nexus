import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";

import { initSocket } from "./socket/index.js";
import { registerIOForEmitter } from "./socket/socketEmitter.js";
import router from "./routes/index.js";

dotenv.config();

const app = express();
const server = http.createServer(app);

// ── Socket.IO ─────────────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL ?? "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

initSocket(io); // register all event handlers
registerIOForEmitter(io); // allow controllers to emit events

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: process.env.CLIENT_URL ?? "http://localhost:5173",
    credentials: true,
  }),
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// ── Routes ────────────────────────────────────────────────────────────────────
app.use("/api", router);

// ── DB + Start ────────────────────────────────────────────────────────────────
const PORT = process.env.PORT ?? 5000;

mongoose
  .connect(process.env.MONGODB_URI ?? "mongodb://localhost:27017/nexus")
  .then(() => {
    server.listen(PORT, () => console.log(`[Server] running on port ${PORT}`));
  })
  .catch((err) => {
    console.error("[MongoDB] connection failed", err);
    process.exit(1);
  });

export { io };
