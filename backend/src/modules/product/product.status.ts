import type { StockStatus } from '@ordo/shared';

/**
 * The reorder threshold, as a predicate over a loaded document.
 *
 * This rule exists in two encodings because it runs in two places: here in Node,
 * over a document Mongoose has already loaded, and in {@link stockStatusExpr},
 * inside MongoDB, for the queries that must not load one. They have to move
 * together, and `product.status.test.ts` fails if they ever disagree.
 */
export function stockStatusOf(stock: number, minStock: number): StockStatus {
  if (stock === 0) return 'out';
  if (stock <= minStock) return 'low';
  return 'in';
}

/**
 * The same rule as a MongoDB aggregation expression, one per bucket. Usable both
 * as a `$expr` filter and as the condition of a `$cond` inside an aggregation.
 */
export const stockStatusExpr: Record<StockStatus, Record<string, unknown>> = {
  out: { $eq: ['$stock', 0] },
  low: { $and: [{ $gt: ['$stock', 0] }, { $lte: ['$stock', '$minStock'] }] },
  in: { $gt: ['$stock', '$minStock'] },
};
