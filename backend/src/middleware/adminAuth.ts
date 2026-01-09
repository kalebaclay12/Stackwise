import { Request, Response, NextFunction } from 'express';

// Simple admin authentication middleware
// For production, this should be replaced with proper role-based auth
export const requireAdminSecret = (req: Request, res: Response, next: NextFunction) => {
  try {
    const adminSecret = req.headers['x-admin-secret'];
    const expectedSecret = process.env.ADMIN_SECRET || 'test-admin-secret-change-in-production';

    if (!adminSecret) {
      return res.status(401).json({ message: 'Admin secret required in X-Admin-Secret header' });
    }

    if (adminSecret !== expectedSecret) {
      return res.status(403).json({ message: 'Invalid admin secret' });
    }

    next();
  } catch (error) {
    return res.status(500).json({ message: 'Admin authentication error' });
  }
};
