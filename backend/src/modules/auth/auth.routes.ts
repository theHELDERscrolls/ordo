import express from 'express';
import type { Request, Response } from 'express';
import { loginSchema } from '@ordo/shared';
import { User } from '../user/user.model.js';
import { Business } from '../business/business.model.js';
import { verifyPassword } from './password.js';
import { signAccessToken } from './token.js';
import { requireAuth } from './auth.middleware.js';

/** Login and session introspection. */
export const authRouter = express.Router();

/**
 * `POST /auth/login` — verifies credentials and returns a token plus the resolved
 * tenant context, so the frontend can theme itself without a second request.
 */
authRouter.post('/login', async (req: Request, res: Response) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid request body' });
    return;
  }
  const { email, password } = parsed.data;

  const user = await User.findOne({ email: email.toLowerCase() });
  // One generic response for both an unknown email and a wrong password, so the
  // endpoint cannot be used to probe which addresses exist.
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

/** `GET /auth/me` — the current user and business behind the caller's token. */
authRouter.get('/me', requireAuth, async (req: Request, res: Response) => {
  const user = await User.findById(req.userId);
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  const business = await Business.findById(user.businessId);
  res.json({ user: user.toJSON(), business: business ? business.toJSON() : null });
});
