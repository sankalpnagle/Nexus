import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { AuthRequest } from '../types/index.js';

const sign = (id: string) =>
  jwt.sign({ id }, process.env.JWT_SECRET || 'secret', {
    expiresIn: (process.env.JWT_EXPIRE || '7d') as string,
  } as jwt.SignOptions);

const sanitize = (u: InstanceType<typeof User>) => ({
  _id: u._id, firstName: u.firstName, lastName: u.lastName,
  email: u.email, avatar: u.avatar, coverPhoto: u.coverPhoto,
  bio: u.bio, location: u.location, website: u.website,
  occupation: u.occupation, education: u.education,
  friends: u.friends, friendRequests: u.friendRequests,
  sentFriendRequests: u.sentFriendRequests, groups: u.groups,
  isOnline: u.isOnline, lastSeen: u.lastSeen, createdAt: u.createdAt,
});

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { firstName, lastName, email, password, birthday } = req.body;
    if (await User.findOne({ email })) {
      res.status(400).json({ success: false, message: 'Email already registered' });
      return;
    }
    const user = await User.create({ firstName, lastName, email, password, birthday });
    res.status(201).json({ success: true, token: sign(user._id.toString()), user: sanitize(user) });
  } catch (e) { res.status(500).json({ success: false, error: String(e) }); }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
      return;
    }
    user.isOnline = true;
    await user.save();
    res.json({ success: true, token: sign(user._id.toString()), user: sanitize(user) });
  } catch (e) { res.status(500).json({ success: false, error: String(e) }); }
};

export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user?._id)
      .populate('friends', 'firstName lastName avatar isOnline lastSeen')
      .populate('friendRequests.from', 'firstName lastName avatar bio');
    res.json({ success: true, user });
  } catch (e) { res.status(500).json({ success: false, error: String(e) }); }
};

export const logout = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await User.findByIdAndUpdate(req.user?._id, { isOnline: false, lastSeen: new Date() });
    res.json({ success: true, message: 'Logged out' });
  } catch (e) { res.status(500).json({ success: false, error: String(e) }); }
};
