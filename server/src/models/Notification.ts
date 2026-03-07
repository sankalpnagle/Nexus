import mongoose, { Schema } from 'mongoose';
import { INotification } from '../types/index.js';

const NotificationSchema = new Schema<INotification>({
  recipient: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  sender:    { type: Schema.Types.ObjectId, ref: 'User', required: true },
  type: {
    type: String,
    enum: ['friend_request','friend_accepted','post_like','post_comment','post_share','group_join','group_invite','mention'],
    required: true,
  },
  post:    { type: Schema.Types.ObjectId, ref: 'Post' },
  group:   { type: Schema.Types.ObjectId, ref: 'Group' },
  message: { type: String },
  isRead:  { type: Boolean, default: false, index: true },
}, { timestamps: true });

NotificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

export default mongoose.model<INotification>('Notification', NotificationSchema);
