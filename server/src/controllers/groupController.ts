import { Response } from 'express';
import Group from '../models/Group.js';
import Post from '../models/Post.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { AuthRequest } from '../types/index.js';
import { uploadToCloud } from '../middleware/upload.js';

export const getGroups = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { category, search, page = 1 } = req.query;
    const filter: Record<string, unknown> = { privacy: 'public' };
    if (category && category !== 'All') filter.category = category;
    if (search) filter.name = { $regex: search, $options: 'i' };
    const groups = await Group.find(filter)
      .populate('admin', 'firstName lastName avatar')
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * 20)
      .limit(20);
    const total = await Group.countDocuments(filter);
    res.json({ success: true, groups, total });
  } catch (e) { res.status(500).json({ success: false, error: String(e) }); }
};

export const getMyGroups = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const groups = await Group.find({ members: req.user?._id })
      .populate('admin', 'firstName lastName avatar');
    res.json({ success: true, groups });
  } catch (e) { res.status(500).json({ success: false, error: String(e) }); }
};

export const getGroup = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const group = await Group.findById(req.params.groupId)
      .populate('admin', 'firstName lastName avatar')
      .populate('members', 'firstName lastName avatar isOnline');
    if (!group) { res.status(404).json({ success: false, message: 'Group not found' }); return; }
    // RLS: private groups only visible to members
    if (group.privacy === 'private' && !group.members.some((m: { _id: { toString(): string } }) => m._id.toString() === req.user?._id.toString())) {
      res.status(403).json({ success: false, message: 'This is a private group' }); return;
    }
    res.json({ success: true, group });
  } catch (e) { res.status(500).json({ success: false, error: String(e) }); }
};

export const createGroup = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, description, privacy, category, rules } = req.body;
    const me = req.user!;
    const files = req.files as Record<string, Express.Multer.File[]> | undefined;
    const data: Record<string, unknown> = {
      name, description, privacy: privacy || 'public',
      category: category || 'General', rules,
      admin: me._id, members: [me._id],
    };
    if (files?.cover?.[0])  data.cover  = (await uploadToCloud(files.cover[0].buffer, 'groups')).url;
    if (files?.avatar?.[0]) data.avatar = (await uploadToCloud(files.avatar[0].buffer, 'groups')).url;
    const group = await Group.create(data);
    await User.findByIdAndUpdate(me._id, { $addToSet: { groups: group._id } });
    res.status(201).json({ success: true, group });
  } catch (e) { res.status(500).json({ success: false, error: String(e) }); }
};

export const joinGroup = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { groupId } = req.params; const me = req.user!;
    const group = await Group.findById(groupId);
    if (!group) { res.status(404).json({ success: false }); return; }
    if (group.members.some(id => id.toString() === me._id.toString())) {
      res.status(400).json({ success: false, message: 'Already a member' }); return;
    }
    if (group.privacy === 'public') {
      await Group.findByIdAndUpdate(groupId, { $addToSet: { members: me._id } });
      await User.findByIdAndUpdate(me._id, { $addToSet: { groups: groupId } });
      await Notification.create({ recipient: group.admin, sender: me._id, type: 'group_join', group: groupId });
      res.json({ success: true, message: 'Joined successfully', joined: true });
    } else {
      await Group.findByIdAndUpdate(groupId, { $addToSet: { pendingMembers: me._id } });
      res.json({ success: true, message: 'Request sent', pending: true });
    }
  } catch (e) { res.status(500).json({ success: false, error: String(e) }); }
};

export const leaveGroup = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await Group.findByIdAndUpdate(req.params.groupId, { $pull: { members: req.user?._id } });
    await User.findByIdAndUpdate(req.user?._id, { $pull: { groups: req.params.groupId } });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ success: false, error: String(e) }); }
};

export const getGroupPosts = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const posts = await Post.find({ group: req.params.groupId })
      .sort({ createdAt: -1 }).limit(20)
      .populate('author', 'firstName lastName avatar')
      .populate('comments.author', 'firstName lastName avatar');
    res.json({ success: true, posts });
  } catch (e) { res.status(500).json({ success: false, error: String(e) }); }
};
