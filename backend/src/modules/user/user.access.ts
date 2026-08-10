import type { UserRole } from '@ordo/shared';

// The single place that answers "which businesses can this user touch?". Today a
// user belongs to exactly one business, so it is just their own; a future
// membership model (or a PlatformAdmin who sees all) changes only this function,
// not every query that scopes by business.
export function getAccessibleBusinessIds(user: {
  businessId: string;
  role: UserRole;
}): string[] {
  return [user.businessId];
}
