import { Response } from 'express';
import Post from '../models/Post.js';
import Notification from '../models/Notification.js';
import { AuthRequest } from '../types/index.js';
import { uploadToCloud } from '../middleware/upload.js';

const populatePost = (q: ReturnType<typeof Post.findById>) =>
  q?.populate('author', 'firstName lastName avatar')
   .populate('comments.author', 'firstName lastName avatar')
   .populate({ path: 'sharedFrom', populate: { path: 'author', select: 'firstName lastName avatar' } });

export const createPost = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { content, privacy, groupId, feeling } = req.body;
    const files = req.files as Express.Multer.File[] | undefined;
    const media: { url: string; type: 'image' | 'video'; publicId: string }[] = [];
    for (const f of files ?? []) {
      const rt = f.mimetype.startsWith('video/') ? 'video' : 'image';
      const { url, publicId } = await uploadToCloud(f.buffer, 'posts', rt);
      media.push({ url, type: rt, publicId });
    }
    const post = await Post.create({
      author: req.user?._id, content, media,
      privacy: privacy || 'public', group: groupId || undefined, feeling,
    });
    const populated = await populatePost(Post.findById(post._id));
    res.status(201).json({ success: true, post: populated });
  } catch (e) { res.status(500).json({ success: false, error: String(e) }); }
};

// RLS-style: only show posts the user is allowed to see
export const getFeed = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = 10;
    const me = req.user!;

    const filter = {
      group: { $exists: false },
      $or: [
        { author: me._id },
        { author: { $in: me.friends }, privacy: { $in: ['public', 'friends'] } },
        { privacy: 'public' },
      ],
    };

    const [posts, total] = await Promise.all([
      Post.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('author', 'firstName lastName avatar')
        .populate('comments.author', 'firstName lastName avatar')
        .populate({ path: 'sharedFrom', populate: { path: 'author', select: 'firstName lastName avatar' } }),
      Post.countDocuments(filter),
    ]);

    res.json({ success: true, posts, total, pages: Math.ceil(total / limit), currentPage: page });
  } catch (e) { res.status(500).json({ success: false, error: String(e) }); }
};

export const getUserPosts = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const me = req.user!;
    const { userId } = req.params;
    const isSelf = me._id.toString() === userId;
    const isFriend = me.friends.some(id => id.toString() === userId);
    const privacyFilter = isSelf ? {} : isFriend ? { privacy: { $in: ['public', 'friends'] } } : { privacy: 'public' };

    const posts = await Post.find({ author: userId, group: { $exists: false }, ...privacyFilter })
      .sort({ createdAt: -1 })
      .limit(20)
      .populate('author', 'firstName lastName avatar')
      .populate('comments.author', 'firstName lastName avatar');

    res.json({ success: true, posts });
  } catch (e) { res.status(500).json({ success: false, error: String(e) }); }
};

export const toggleLike = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { postId } = req.params; const me = req.user!;
    const post = await Post.findById(postId);
    if (!post) { res.status(404).json({ success: false }); return; }
    const liked = post.likes.some(id => id.toString() === me._id.toString());
    if (liked) {
      await Post.findByIdAndUpdate(postId, { $pull: { likes: me._id } });
    } else {
      await Post.findByIdAndUpdate(postId, { $addToSet: { likes: me._id } });
      if (post.author.toString() !== me._id.toString())
        await Notification.create({ recipient: post.author, sender: me._id, type: 'post_like', post: postId });
    }
    const updated = await Post.findById(postId);
    res.json({ success: true, likes: updated?.likes, liked: !liked });
  } catch (e) { res.status(500).json({ success: false, error: String(e) }); }
};

export const addComment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { postId } = req.params; const me = req.user!;
    const post = await Post.findByIdAndUpdate(
      postId,
      { $push: { comments: { author: me._id, content: req.body.content, createdAt: new Date() } } },
      { new: true }
    ).populate('author', 'firstName lastName avatar').populate('comments.author', 'firstName lastName avatar');
    if (!post) { res.status(404).json({ success: false }); return; }
    if (post.author._id.toString() !== me._id.toString())
      await Notification.create({ recipient: post.author._id, sender: me._id, type: 'post_comment', post: postId });
    res.json({ success: true, post });
  } catch (e) { res.status(500).json({ success: false, error: String(e) }); }
};

export const deletePost = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) { res.status(404).json({ success: false }); return; }
    // RLS: only author can delete
    if (post.author.toString() !== req.user?._id.toString()) {
      res.status(403).json({ success: false, message: 'Forbidden' }); return;
    }
    await post.deleteOne();
    res.json({ success: true });
  } catch (e) { res.status(500).json({ success: false, error: String(e) }); }
};

export const sharePost = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { postId } = req.params; const me = req.user!;
    await Post.findByIdAndUpdate(postId, { $addToSet: { shares: me._id } });
    const shared = await Post.create({
      author: me._id, content: req.body.content || '',
      sharedFrom: postId, privacy: 'public',
    });
    const populated = await populatePost(Post.findById(shared._id));
    res.status(201).json({ success: true, post: populated });
  } catch (e) { res.status(500).json({ success: false, error: String(e) }); }
};
