import type { UserRole } from '@ordo/shared';

/**
 * Lets protected handlers read the authenticated id (set by `requireAuth`) and the
 * loaded user context (set by `loadUser`) off the request.
 */
declare global {
  namespace Express {
    interface Request {
      userId?: string;
      user?: { id: string; businessId: string; role: UserRole };
    }
  }
}

export {};
