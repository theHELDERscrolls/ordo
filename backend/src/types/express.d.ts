import type { UserRole } from '@ordo/shared';

// Augment Express's Request so protected handlers can read the authenticated id
// (set by requireAuth) and the loaded user context (set by loadUser).
declare global {
  namespace Express {
    interface Request {
      userId?: string;
      user?: { id: string; businessId: string; role: UserRole };
    }
  }
}

export {};
