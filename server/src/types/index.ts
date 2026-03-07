import { Request } from 'express';
import { Document, Types } from 'mongoose';

export interface IUser extends Document {
  _id: Types.ObjectId;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  avatar: string;
  coverPhoto: string;
  bio: string;
  location: string;
  website: string;
  birthday?: Date;
  occupation?: string;
  education?: string;
  friends: Types.ObjectId[];
  friendRequests: { from: Types.ObjectId; createdAt: Date }[];
  sentFriendRequests: Types.ObjectId[];
  groups: Types.ObjectId[];
  isOnline: boolean;
  lastSeen: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(pw: string): Promise<boolean>;
}

export interface IPost extends Document {
  _id: Types.ObjectId;
  author: Types.ObjectId;
  content: string;
  media: { url: string; type: 'image' | 'video'; publicId: string }[];
  likes: Types.ObjectId[];
  comments: {
    _id: Types.ObjectId;
    author: Types.ObjectId;
    content: string;
    likes: Types.ObjectId[];
    createdAt: Date;
  }[];
  shares: Types.ObjectId[];
  privacy: 'public' | 'friends' | 'private';
  sharedFrom?: Types.ObjectId;
  group?: Types.ObjectId;
  feeling?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IGroup extends Document {
  _id: Types.ObjectId;
  name: string;
  description: string;
  cover: string;
  avatar: string;
  admin: Types.ObjectId;
  moderators: Types.ObjectId[];
  members: Types.ObjectId[];
  pendingMembers: Types.ObjectId[];
  privacy: 'public' | 'private';
  category: string;
  rules?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IMessage extends Document {
  _id: Types.ObjectId;
  conversation: Types.ObjectId;
  sender: Types.ObjectId;
  content: string;
  media?: { url: string; type: string; publicId: string; name?: string };
  readBy: Types.ObjectId[];
  reactions: { user: Types.ObjectId; emoji: string }[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IConversation extends Document {
  _id: Types.ObjectId;
  participants: Types.ObjectId[];
  isGroup: boolean;
  groupName?: string;
  groupAvatar?: string;
  groupAdmin?: Types.ObjectId;
  lastMessage?: Types.ObjectId;
  pinnedMessages?: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

export interface INotification extends Document {
  _id: Types.ObjectId;
  recipient: Types.ObjectId;
  sender: Types.ObjectId;
  type: 'friend_request' | 'friend_accepted' | 'post_like' | 'post_comment' | 'post_share' | 'group_join' | 'group_invite' | 'mention';
  post?: Types.ObjectId;
  group?: Types.ObjectId;
  message?: string;
  isRead: boolean;
  createdAt: Date;
}

export interface AuthRequest extends Request {
  user?: IUser;
}

export interface JwtPayload {
  id: string;
  iat: number;
  exp: number;
}
