import { Response } from 'express';
import { Message, Conversation } from '../models/Message.js';
import { AuthRequest } from '../types/index.js';
import { uploadToCloud } from '../middleware/upload.js';

export const getConversations = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const convs = await Conversation.find({ participants: req.user?._id })
      .populate('participants', 'firstName lastName avatar isOnline lastSeen')
      .populate({ path: 'lastMessage', populate: { path: 'sender', select: 'firstName lastName' } })
      .sort({ updatedAt: -1 });
    res.json({ success: true, conversations: convs });
  } catch (e) { res.status(500).json({ success: false, error: String(e) }); }
};

export const getOrCreateDM = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { userId } = req.params; const me = req.user!;
    let conv = await Conversation.findOne({ participants: { $all: [me._id, userId] }, isGroup: false })
      .populate('participants', 'firstName lastName avatar isOnline lastSeen');
    if (!conv) {
      conv = await Conversation.create({ participants: [me._id, userId], isGroup: false });
      conv = await Conversation.findById(conv._id)
        .populate('participants', 'firstName lastName avatar isOnline lastSeen') as typeof conv;
    }
    res.json({ success: true, conversation: conv });
  } catch (e) { res.status(500).json({ success: false, error: String(e) }); }
};

export const createGroupChat = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, participants } = req.body; const me = req.user!;
    const conv = await Conversation.create({
      participants: [me._id, ...participants], isGroup: true,
      groupName: name, groupAdmin: me._id,
    });
    const populated = await Conversation.findById(conv._id)
      .populate('participants', 'firstName lastName avatar isOnline lastSeen');
    res.status(201).json({ success: true, conversation: populated });
  } catch (e) { res.status(500).json({ success: false, error: String(e) }); }
};

export const getMessages = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { conversationId } = req.params;
    const page = Number(req.query.page) || 1;
    const limit = 50;
    const msgs = await Message.find({ conversation: conversationId })
      .populate('sender', 'firstName lastName avatar')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);
    // Mark as read (RLS: only mark for current user)
    await Message.updateMany(
      { conversation: conversationId, readBy: { $ne: req.user?._id } },
      { $addToSet: { readBy: req.user?._id } }
    );
    res.json({ success: true, messages: msgs.reverse() });
  } catch (e) { res.status(500).json({ success: false, error: String(e) }); }
};

export const sendMessage = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { conversationId } = req.params; const me = req.user!;
    let mediaData;
    if (req.file) {
      const rt = req.file.mimetype.startsWith('video/') ? 'video' : 'image';
      const { url, publicId } = await uploadToCloud(req.file.buffer, 'messages', rt);
      mediaData = { url, type: rt, publicId, name: req.file.originalname };
    }
    const msg = await Message.create({
      conversation: conversationId, sender: me._id,
      content: req.body.content || '', media: mediaData, readBy: [me._id],
    });
    await Conversation.findByIdAndUpdate(conversationId, { lastMessage: msg._id, updatedAt: new Date() });
    const populated = await Message.findById(msg._id).populate('sender', 'firstName lastName avatar');
    res.status(201).json({ success: true, message: populated });
  } catch (e) { res.status(500).json({ success: false, error: String(e) }); }
};
