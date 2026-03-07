import { Response } from 'express';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { AuthRequest } from '../types/index.js';
import { uploadToCloud } from '../middleware/upload.js';

// RLS: users can only see profiles based on friendship level
export const getProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.params.userId)
      .populate('friends', 'firstName lastName avatar isOnline lastSeen')
      .select('-password -friendRequests -sentFriendRequests');
    if (!user) { res.status(404).json({ success: false, message: 'User not found' }); return; }
    res.json({ success: true, user });
  } catch (e) { res.status(500).json({ success: false, error: String(e) }); }
};

export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const allowed = ['firstName','lastName','bio','location','website','birthday','occupation','education'];
    const update: Record<string, unknown> = {};
    allowed.forEach(f => { if (req.body[f] !== undefined) update[f] = req.body[f]; });
    const files = req.files as Record<string, Express.Multer.File[]> | undefined;
    if (files?.avatar?.[0])     update.avatar     = (await uploadToCloud(files.avatar[0].buffer, 'avatars')).url;
    if (files?.coverPhoto?.[0]) update.coverPhoto = (await uploadToCloud(files.coverPhoto[0].buffer, 'covers')).url;
    const user = await User.findByIdAndUpdate(req.user?._id, update, { new: true, runValidators: true });
    res.json({ success: true, user });
  } catch (e) { res.status(500).json({ success: false, error: String(e) }); }
};

export const searchUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { q } = req.query;
    if (!q) { res.json({ success: true, users: [] }); return; }
    const users = await User.find({
      $or: [
        { firstName: { $regex: q, $options: 'i' } },
        { lastName:  { $regex: q, $options: 'i' } },
      ],
      _id: { $ne: req.user?._id },
    }).select('firstName lastName avatar bio friends isOnline').limit(20);
    res.json({ success: true, users });
  } catch (e) { res.status(500).json({ success: false, error: String(e) }); }
};

export const getSuggestions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const me = req.user!;
    const excluded = [me._id, ...me.friends, ...me.sentFriendRequests];
    const users = await User.find({ _id: { $nin: excluded } })
      .select('firstName lastName avatar bio friends').limit(12);
    res.json({ success: true, users });
  } catch (e) { res.status(500).json({ success: false, error: String(e) }); }
};

export const sendFriendRequest = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { userId } = req.params; const me = req.user!;
    if (userId === me._id.toString()) { res.status(400).json({ success: false, message: 'Cannot add yourself' }); return; }
    if (me.friends.some(id => id.toString() === userId)) { res.status(400).json({ success: false, message: 'Already friends' }); return; }
    if (me.sentFriendRequests.some(id => id.toString() === userId)) { res.status(400).json({ success: false, message: 'Request already sent' }); return; }
    await User.findByIdAndUpdate(me._id, { $addToSet: { sentFriendRequests: userId } });
    await User.findByIdAndUpdate(userId, { $push: { friendRequests: { from: me._id, createdAt: new Date() } } });
    await Notification.create({ recipient: userId, sender: me._id, type: 'friend_request' });
    res.json({ success: true, message: 'Friend request sent' });
  } catch (e) { res.status(500).json({ success: false, error: String(e) }); }
};

export const respondFriendRequest = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { userId } = req.params; const { action } = req.body; const me = req.user!;
    if (action === 'accept') {
      await User.findByIdAndUpdate(me._id, { $pull: { friendRequests: { from: userId } }, $addToSet: { friends: userId } });
      await User.findByIdAndUpdate(userId, { $pull: { sentFriendRequests: me._id }, $addToSet: { friends: me._id } });
      await Notification.create({ recipient: userId, sender: me._id, type: 'friend_accepted' });
    } else {
      await User.findByIdAndUpdate(me._id, { $pull: { friendRequests: { from: userId } } });
      await User.findByIdAndUpdate(userId, { $pull: { sentFriendRequests: me._id } });
    }
    res.json({ success: true, message: `Request ${action}ed` });
  } catch (e) { res.status(500).json({ success: false, error: String(e) }); }
};

export const unfriend = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await User.findByIdAndUpdate(req.user?._id, { $pull: { friends: req.params.userId } });
    await User.findByIdAndUpdate(req.params.userId, { $pull: { friends: req.user?._id } });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ success: false, error: String(e) }); }
};
