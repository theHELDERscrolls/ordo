import type { MovementType } from '@ordo/shared';

/** The sign each type carries. Split from the badge so the fast-refresh boundary holds. */
const signs: Record<MovementType, string> = { in: '+', out: '−', adjust: '±' };

/**
 * The quantity as the ledger reads it. The stored number is always positive — the
 * sign lives in the type — so it is put back on for display, and an `adjust` takes
 * `±` because its quantity is the size of a correction in either direction.
 */
export const signedQuantity = (type: MovementType, quantity: number) =>
  `${signs[type]}${quantity}`;
