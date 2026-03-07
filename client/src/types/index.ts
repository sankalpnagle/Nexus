export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar: string;
  coverPhoto: string;
  bio: string;
  location: string;
  website: string;
  birthday?: string;
  occupation?: string;
  education?: string;
  friends: (User | string)[];
  friendRequests: { _id: string; from: User; createdAt: string }[];
  sentFriendRequests: string[];
  groups: string[];
  isOnline: boolean;
  lastSeen: string;
  createdAt: string;
}

export interface PostMedia {
  url: string;
  type: 'image' | 'video';
  publicId: string;
}

export interface Comment {
  _id: string;
  author: User;
  content: string;
  likes: string[];
  createdAt: string;
}

export interface Post {
  _id: string;
  author: User;
  content: string;
  media: PostMedia[];
  likes: string[];
  comments: Comment[];
  shares: string[];
  privacy: 'public' | 'friends' | 'private';
  sharedFrom?: Post;
  group?: string;
  feeling?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Group {
  _id: string;
  name: string;
  description: string;
  cover: string;
  avatar: string;
  admin: User;
  members: (User | string)[];
  pendingMembers: string[];
  privacy: 'public' | 'private';
  category: string;
  rules?: string;
  createdAt: string;
}

export interface Message {
  _id: string;
  conversation: string;
  sender: User;
  content: string;
  media?: { url: string; type: string; publicId: string; name?: string };
  readBy: string[];
  createdAt: string;
}

export interface Conversation {
  _id: string;
  participants: User[];
  isGroup: boolean;
  groupName?: string;
  groupAvatar?: string;
  groupAdmin?: string;
  lastMessage?: Message;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  _id: string;
  recipient: string;
  sender: User;
  type: 'friend_request' | 'friend_accepted' | 'post_like' | 'post_comment' | 'post_share' | 'group_join' | 'group_invite' | 'mention';
  post?: Post;
  group?: Group;
  isRead: boolean;
  createdAt: string;
}
