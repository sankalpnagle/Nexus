import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { AuthRequest, JwtPayload } from '../types/index.js';

export const protect = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const auth = req.headers.authorization;
    if (!auth?.startsWith('Bearer ')) {
      res.status(401).json({ success: false, message: 'Not authorized — no token' });
      return;
    }
    const token = auth.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as JwtPayload;
    const user = await User.findById(decoded.id);
    if (!user) {
      res.status(401).json({ success: false, message: 'User no longer exists' });
      return;
    }
    // RLS: attach user context to every request
    req.user = user;
    next();
  } catch {
    res.status(401).json({ success: false, message: 'Token invalid or expired' });
  }
};
