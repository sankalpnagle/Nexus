import { Response } from 'express';
import Notification from '../models/Notification.js';
import { AuthRequest } from '../types/index.js';

export const getNotifications = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const notifs = await Notification.find({ recipient: req.user?._id })
      .populate('sender', 'firstName lastName avatar')
      .populate('post', 'content')
      .populate('group', 'name')
      .sort({ createdAt: -1 })
      .limit(50);
    res.json({ success: true, notifications: notifs });
  } catch (e) { res.status(500).json({ success: false, error: String(e) }); }
};

export const markRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // RLS: can only mark own notifications as read
    await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user?._id },
      { isRead: true }
    );
    res.json({ success: true });
  } catch (e) { res.status(500).json({ success: false, error: String(e) }); }
};

export const markAllRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await Notification.updateMany({ recipient: req.user?._id, isRead: false }, { isRead: true });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ success: false, error: String(e) }); }
};
