import express from 'express';
import type { Request, Response } from 'express';
import { loginSchema } from '@ordo/shared';
import { User } from '../user/user.model.js';
import { Business } from '../business/business.model.js';
import { verifyPassword } from './password.js';
import { signAccessToken } from './token.js';
import { requireAuth } from './auth.middleware.js';

export const authRouter = express.Router();

// POST /auth/login: validate input, verify credentials, and return a token plus
// the resolved tenant context (user + business) so the frontend can theme itself.
authRouter.post('/login', async (req: Request, res: Response) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid request body' });
    return;
  }
  const { email, password } = parsed.data;

  const user = await User.findOne({ email: email.toLowerCase() });
  // Same generic response whether the email is unknown or the password is wrong,
  // so an attacker cannot probe which emails exist.
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    res.status(401).json({ error: 'Invalid email or password' });
    return;
  }

  const business = await Business.findById(user.businessId);
  if (!business) {
    res.status(500).json({ error: 'Business not found for user' });
    return;
  }

  const token = signAccessToken(user.id);
  res.json({ token, user: user.toJSON(), business: business.toJSON() });
});

// GET /auth/me: sample protected route. Returns the current user and business.
authRouter.get('/me', requireAuth, async (req: Request, res: Response) => {
  const user = await User.findById(req.userId);
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  const business = await Business.findById(user.businessId);
  res.json({ user: user.toJSON(), business: business ? business.toJSON() : null });
});
