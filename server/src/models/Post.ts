import mongoose, { Schema } from 'mongoose';
import { IPost } from '../types/index.js';

const PostSchema = new Schema<IPost>({
  author:  { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  content: { type: String, default: '', maxlength: 10000 },
  media: [{
    url:      { type: String, required: true },
    type:     { type: String, enum: ['image', 'video'], required: true },
    publicId: { type: String, required: true },
  }],
  likes:    [{ type: Schema.Types.ObjectId, ref: 'User' }],
  comments: [{
    author:    { type: Schema.Types.ObjectId, ref: 'User', required: true },
    content:   { type: String, required: true, maxlength: 2000 },
    likes:     [{ type: Schema.Types.ObjectId, ref: 'User' }],
    createdAt: { type: Date, default: Date.now },
  }],
  shares:     [{ type: Schema.Types.ObjectId, ref: 'User' }],
  privacy:    { type: String, enum: ['public', 'friends', 'private'], default: 'public', index: true },
  sharedFrom: { type: Schema.Types.ObjectId, ref: 'Post' },
  group:      { type: Schema.Types.ObjectId, ref: 'Group', index: true },
  feeling:    { type: String, default: '' },
}, { timestamps: true });

// Compound index for feed queries (RLS-style)
PostSchema.index({ author: 1, createdAt: -1 });
PostSchema.index({ privacy: 1, createdAt: -1 });
PostSchema.index({ group: 1, createdAt: -1 });

export default mongoose.model<IPost>('Post', PostSchema);
