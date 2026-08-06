import type { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from './token.js';

// Guards protected routes: requires a valid Bearer access token, then attaches
// the authenticated user id to the request for downstream handlers.
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
