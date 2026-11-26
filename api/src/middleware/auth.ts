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
      const databaseRole = String(currentUser.role || '').trim().toUpperCase();
      const tokenRole = String(req.user.role || '').trim().toUpperCase();

      // Database role is authoritative. Accept a signed privileged claim only
      // as a compatibility fallback for accounts whose role was promoted after
      // their current session was issued; the next login will issue a fresh claim.
      // Do not let an unprivileged token override a privileged database role.
      const hasDatabasePermission = roles.includes(databaseRole);
      const hasSignedSessionPermission = roles.includes(tokenRole);

      if (!hasDatabasePermission && !hasSignedSessionPermission) {
        console.warn('[auth] role denied', {
          userId: req.user.userId,
          databaseRole: databaseRole || '(empty)',
          tokenRole: tokenRole || '(empty)',
          requiredRoles: roles,
        });
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      req.user.role = hasDatabasePermission ? databaseRole : tokenRole;
      next();
    } catch (error) {
      console.error('Role verification failed:', error);
      return res.status(500).json({ error: 'Could not verify account permissions' });
    }
  };
