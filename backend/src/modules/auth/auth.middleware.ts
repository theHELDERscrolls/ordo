import type { Request, Response, NextFunction } from 'express';
import type { UserRole } from '@ordo/shared';
import { verifyAccessToken } from './token.js';
import { User } from '../user/user.model.js';

/**
 * Requires a valid Bearer access token and attaches the authenticated user id to
 * the request for the handlers downstream.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.header('authorization');
  const token = header?.startsWith('Bearer ') ? header.slice(7) : undefined;
  if (!token) {
    res.status(401).json({ error: 'Missing authentication token' });
    return;
  }
  try {
    req.userId = verifyAccessToken(token);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/**
 * Loads the authenticated user and attaches the fields routes need for tenant
 * scoping and role checks, in a single lookup. Run after {@link requireAuth}.
 */
export async function loadUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  const user = await User.findById(req.userId);
  if (!user) {
    res.status(401).json({ error: 'User not found' });
    return;
  }
  req.user = {
    id: user.id,
    businessId: String(user.businessId),
    role: user.role as UserRole,
  };
  next();
}

/** Restricts a route to admins. Run after {@link loadUser}. */
export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (req.user?.role !== 'admin') {
    res.status(403).json({ error: 'Admin role required' });
    return;
  }
  next();
}
