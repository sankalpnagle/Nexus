import mongoose, { Schema } from 'mongoose';
import { IMessage, IConversation } from '../types/index.js';

const MessageSchema = new Schema<IMessage>({
  conversation: { type: Schema.Types.ObjectId, ref: 'Conversation', required: true, index: true },
  sender:       { type: Schema.Types.ObjectId, ref: 'User', required: true },
  content:      { type: String, default: '' },
  media: {
    url: String,
    type: { type: String },
    publicId: String,
    name: String,
  },
  readBy:    [{ type: Schema.Types.ObjectId, ref: 'User' }],
  reactions: [{
    user:  { type: Schema.Types.ObjectId, ref: 'User' },
    emoji: { type: String },
  }],
}, { timestamps: true });

MessageSchema.index({ conversation: 1, createdAt: -1 });

const ConversationSchema = new Schema<IConversation>({
  participants:    [{ type: Schema.Types.ObjectId, ref: 'User', required: true }],
  isGroup:         { type: Boolean, default: false },
  groupName:       { type: String, trim: true },
  groupAvatar:     { type: String },
  groupAdmin:      { type: Schema.Types.ObjectId, ref: 'User' },
  lastMessage:     { type: Schema.Types.ObjectId, ref: 'Message' },
  pinnedMessages:  [{ type: Schema.Types.ObjectId, ref: 'Message' }],
}, { timestamps: true });

ConversationSchema.index({ participants: 1, updatedAt: -1 });

export const Message      = mongoose.model<IMessage>('Message', MessageSchema);
export const Conversation = mongoose.model<IConversation>('Conversation', ConversationSchema);
