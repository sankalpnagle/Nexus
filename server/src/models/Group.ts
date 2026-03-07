import mongoose, { Schema } from 'mongoose';
import { IGroup } from '../types/index.js';

const GroupSchema = new Schema<IGroup>({
  name:           { type: String, required: true, trim: true, maxlength: 100, index: true },
  description:    { type: String, default: '', maxlength: 2000 },
  cover:          { type: String, default: '' },
  avatar:         { type: String, default: '' },
  admin:          { type: Schema.Types.ObjectId, ref: 'User', required: true },
  moderators:     [{ type: Schema.Types.ObjectId, ref: 'User' }],
  members:        [{ type: Schema.Types.ObjectId, ref: 'User', index: true }],
  pendingMembers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  privacy:        { type: String, enum: ['public', 'private'], default: 'public', index: true },
  category:       { type: String, default: 'General', index: true },
  rules:          { type: String, default: '' },
}, { timestamps: true });

GroupSchema.index({ privacy: 1, category: 1 });
GroupSchema.index({ members: 1 });

export default mongoose.model<IGroup>('Group', GroupSchema);
