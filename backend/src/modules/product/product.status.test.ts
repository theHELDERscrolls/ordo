import { describe, it, expect } from 'vitest';
import { stockStatuses } from '@ordo/shared';
import { stockStatusOf, stockStatusExpr } from './product.status.js';

type Doc = { stock: number; minStock: number };

function operand(value: unknown, doc: Doc): number {
  if (value === '$stock') return doc.stock;
  if (value === '$minStock') return doc.minStock;
  if (typeof value === 'number') return value;
  throw new Error(`Unsupported operand: ${String(value)}`);
}

// Just enough of MongoDB's expression language to evaluate stockStatusExpr in
// process. It throws on anything it does not know, so widening the expressions
// without widening this fails loudly instead of silently passing.
function matches(expr: Record<string, unknown>, doc: Doc): boolean {
  const [op, args] = Object.entries(expr)[0];
  if (op === '$and') {
    return (args as Record<string, unknown>[]).every((sub) => matches(sub, doc));
  }
  const [left, right] = args as [unknown, unknown];
  const a = operand(left, doc);
  const b = operand(right, doc);
  if (op === '$eq') return a === b;
  if (op === '$gt') return a > b;
  if (op === '$lte') return a <= b;
  throw new Error(`Unsupported operator: ${op}`);
}

describe('stockStatusOf', () => {
  it('is "out" when stock is 0, whatever the minimum', () => {
    expect(stockStatusOf(0, 0)).toBe('out');
    expect(stockStatusOf(0, 5)).toBe('out');
  });

  it('is "low" at or below the minimum, but above 0', () => {
    expect(stockStatusOf(3, 5)).toBe('low');
    expect(stockStatusOf(5, 5)).toBe('low');
  });

  it('is "in" above the minimum', () => {
    expect(stockStatusOf(6, 5)).toBe('in');
  });
});

describe('stockStatusExpr', () => {
  // The reason the helper exists: the predicate and the aggregation expressions
  // encode one rule twice, so this fails the moment they drift apart.
  it('agrees with stockStatusOf, and the buckets stay exclusive and exhaustive', () => {
    for (let stock = 0; stock <= 4; stock++) {
      for (let minStock = 0; minStock <= 4; minStock++) {
        const expected = stockStatusOf(stock, minStock);
        for (const status of stockStatuses) {
          expect(
            matches(stockStatusExpr[status], { stock, minStock }),
            `${status} at stock=${stock} minStock=${minStock}`,
          ).toBe(status === expected);
        }
      }
    }
  });
});
