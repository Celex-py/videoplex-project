import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';

export interface AuthRequest extends Request {
  user?: { userId: string; role: string };
}

export const authenticate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
      role: string;
    };
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

export const requireRole = (...roles: string[]) =>
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user?.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    try {
      // Read the current role from the database rather than trusting the role
      // embedded in a long-lived JWT. This keeps permission changes effective
      // without requiring users to wait for their token to expire.
      const currentUser = await prisma.user.findUnique({
        where: { id: req.user.userId },
        select: { role: true },
      });

      if (!currentUser) {
        return res.status(401).json({ error: 'User account not found' });
      }
      if (!roles.includes(currentUser.role)) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      req.user.role = currentUser.role;
      next();
    } catch (error) {
      console.error('Role verification failed:', error);
      return res.status(500).json({ error: 'Could not verify account permissions' });
    }
  };
