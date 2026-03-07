import { Router } from 'express';
import { register, login, getMe, logout } from '../controllers/authController.js';
import { getProfile, updateProfile, searchUsers, getSuggestions, sendFriendRequest, respondFriendRequest, unfriend } from '../controllers/userController.js';
import { createPost, getFeed, getUserPosts, toggleLike, addComment, deletePost, sharePost } from '../controllers/postController.js';
import { getGroups, getMyGroups, getGroup, createGroup, joinGroup, leaveGroup, getGroupPosts } from '../controllers/groupController.js';
import { getConversations, getOrCreateDM, createGroupChat, getMessages, sendMessage } from '../controllers/messageController.js';
import { getNotifications, markRead, markAllRead } from '../controllers/notificationController.js';
import { protect } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const r = Router();

// ── Auth ─────────────────────────────────────────────────────────────────────
r.post('/auth/register', register);
r.post('/auth/login',    login);
r.get ('/auth/me',       protect, getMe);
r.post('/auth/logout',   protect, logout);

// ── Users ─────────────────────────────────────────────────────────────────────
r.get   ('/users/search',      protect, searchUsers);
r.get   ('/users/suggestions', protect, getSuggestions);
r.get   ('/users/:userId',     protect, getProfile);
r.put   ('/users/profile',     protect,
  upload.fields([{ name: 'avatar', maxCount: 1 }, { name: 'coverPhoto', maxCount: 1 }]),
  updateProfile);
r.post  ('/users/:userId/friend-request', protect, sendFriendRequest);
r.put   ('/users/:userId/friend-request', protect, respondFriendRequest);
r.delete('/users/:userId/unfriend',       protect, unfriend);

// ── Posts ─────────────────────────────────────────────────────────────────────
r.get   ('/posts/feed',              protect, getFeed);
r.post  ('/posts',                   protect, upload.array('media', 10), createPost);
r.get   ('/posts/user/:userId',      protect, getUserPosts);
r.post  ('/posts/:postId/like',      protect, toggleLike);
r.post  ('/posts/:postId/comment',   protect, addComment);
r.post  ('/posts/:postId/share',     protect, sharePost);
r.delete('/posts/:postId',           protect, deletePost);

// ── Groups ────────────────────────────────────────────────────────────────────
r.get   ('/groups',                   protect, getGroups);
r.get   ('/groups/mine',              protect, getMyGroups);
r.post  ('/groups',                   protect,
  upload.fields([{ name: 'cover', maxCount: 1 }, { name: 'avatar', maxCount: 1 }]),
  createGroup);
r.get   ('/groups/:groupId',          protect, getGroup);
r.post  ('/groups/:groupId/join',     protect, joinGroup);
r.post  ('/groups/:groupId/leave',    protect, leaveGroup);
r.get   ('/groups/:groupId/posts',    protect, getGroupPosts);

// ── Messages ──────────────────────────────────────────────────────────────────
r.get ('/conversations',                          protect, getConversations);
r.get ('/conversations/dm/:userId',               protect, getOrCreateDM);
r.post('/conversations/group',                    protect, createGroupChat);
r.get ('/conversations/:conversationId/messages', protect, getMessages);
r.post('/conversations/:conversationId/messages', protect, upload.single('media'), sendMessage);

// ── Notifications ─────────────────────────────────────────────────────────────
r.get('/notifications',          protect, getNotifications);
r.put('/notifications/read-all', protect, markAllRead);
r.put('/notifications/:id/read', protect, markRead);

export default r;
