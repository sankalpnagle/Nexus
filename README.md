# Nexus — Full-Stack Social Platform v2

A modern Facebook-inspired social network built with the MERN stack, Tailwind CSS v4, and TypeScript.

## ✨ Features

- **News Feed** — Create posts, like, comment, share · classic dual-sidebar Facebook layout
- **Friends** — Requests, suggestions, and all friends tabs · friend system with accept/decline
- **Messages** — Real-time chat with typing indicators, group chats, media sharing
- **Groups** — Browse, join, and create groups by category · public & private groups
- **Profiles** — Cover photos, avatars, posts/about/friends/photos tabs · edit profile
- **Notifications** — Real-time bell with friend requests, likes, comments
- **Auth** — JWT-secured with bcrypt 12 rounds · Row-Level Security on all queries
- **Media** — Cloudinary v2 for images + videos (100MB limit)
- **Socket.io** — Online presence, live messaging, typing indicators

## 🛠 Tech Stack

| Layer     | Tech                                       |
|-----------|-------------------------------------------|
| Frontend  | React 19, Vite 6, Tailwind CSS v4, Zustand 5 |
| Backend   | Express 4, TypeScript 5.7, tsx 4          |
| Database  | MongoDB 8 + Mongoose 8                   |
| Real-time | Socket.io 4                              |
| Auth      | JWT + bcrypt                             |
| Storage   | Cloudinary v2 (multer v2 memoryStorage)  |
| Fonts     | Sora + DM Sans (Google Fonts)            |

## 🚀 Quick Start

```bash
# 1. Extract and install
tar -xzf nexus.tar.gz && cd nexus
npm install            # installs concurrently
npm run install:all    # installs server + client deps

# 2. Configure environment
cp server/.env.example server/.env
# Fill in: MONGODB_URI, JWT_SECRET, CLOUDINARY_*

# 3. Start dev servers
npm run dev

# Frontend → http://localhost:5173
# Backend  → http://localhost:5000
# Health   → http://localhost:5000/health
```

## 📋 Environment Variables

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/nexus
JWT_SECRET=your_super_secret_key_min_32_chars
JWT_EXPIRE=7d
CLOUDINARY_CLOUD_NAME=your_name
CLOUDINARY_API_KEY=your_key
CLOUDINARY_API_SECRET=your_secret
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

## 🗄 Database Schema

| Collection    | Key Fields                                                              |
|---------------|-------------------------------------------------------------------------|
| Users         | firstName, lastName, email, password, avatar, friends, friendRequests  |
| Posts         | author, content, media[], likes[], comments[], privacy, group          |
| Groups        | name, admin, members[], privacy, category                              |
| Messages      | conversation, sender, content, media, readBy[]                         |
| Conversations | participants[], isGroup, lastMessage                                    |
| Notifications | recipient, sender, type, post, isRead                                  |

All queries use compound indexes to enforce Row-Level Security (RLS) semantics.

## 📡 API Routes

```
POST /api/auth/register|login        GET  /api/auth/me
GET  /api/users/search|suggestions   GET  /api/users/:id
PUT  /api/users/profile             POST /api/users/:id/friend-request
GET  /api/posts/feed                POST /api/posts
POST /api/posts/:id/like|comment|share
GET  /api/groups                    POST /api/groups
POST /api/groups/:id/join|leave
GET  /api/conversations             POST /api/conversations/group
GET  /api/conversations/:id/messages
GET  /api/notifications             PUT  /api/notifications/read-all
```

## 🔌 Socket Events

| Event             | Direction | Description               |
|-------------------|-----------|---------------------------|
| user:online       | → server  | Register online status    |
| user:status       | ← server  | Broadcast online/offline  |
| conversation:join | → server  | Join chat room            |
| message:send      | → server  | Send message to room      |
| message:receive   | ← server  | Receive new message       |
| typing:start/stop | ↔ both    | Typing indicators         |
| notification:send | → server  | Send notification         |
| notification:receive | ← server | Receive notification   |
