import type { UserRole } from '@ordo/shared';

/**
 * The single answer to "which businesses may this user touch?". A user belongs to
 * exactly one business today, so a future membership model (or a platform admin
 * who sees every tenant) changes this function alone, not every scoped query.
 */
export function getAccessibleBusinessIds(user: {
  businessId: string;
  role: UserRole;
}): string[] {
  return [user.businessId];
}
