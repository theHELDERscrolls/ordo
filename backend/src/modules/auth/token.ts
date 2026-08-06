import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';

const EXPIRES_IN = '2h';

// Signs a short-lived access token carrying the user id as the subject claim.
export function signAccessToken(userId: string): string {
  return jwt.sign({ sub: userId }, env.jwtSecret, { expiresIn: EXPIRES_IN });
}

// Verifies signature and expiry, returning the user id. Throws on any problem.
export function verifyAccessToken(token: string): string {
  const payload = jwt.verify(token, env.jwtSecret);
  if (typeof payload === 'string' || typeof payload.sub !== 'string') {
    throw new Error('Invalid token payload');
  }
  return payload.sub;
}
