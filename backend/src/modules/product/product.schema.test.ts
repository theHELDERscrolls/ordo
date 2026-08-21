import { describe, it, expect } from 'vitest';
import { createProductSchema, updateProductSchema } from '@ordo/shared';

// The contract lives in @ordo/shared, but the API is what breaks when it slips, so
// the guard sits with the routes that parse with it.
describe('createProductSchema', () => {
  it('defaults the numbers, so a product needs only a name, a SKU and a unit', () => {
    expect(createProductSchema.parse({ name: 'Filtro', sku: 'FIL-001', unit: 'unidad' })).toEqual({
      name: 'Filtro',
      sku: 'FIL-001',
      unit: 'unidad',
      stock: 0,
      minStock: 0,
      costPrice: 0,
      salePrice: 0,
    });
  });
});

describe('updateProductSchema', () => {
  // Zod carries a `.default()` through `.partial()`, so building the update schema
  // from the creation one made every patch arrive with `stock: 0`, `minStock: 0`
  // and `costPrice: 0` and wipe three fields the caller never mentioned.
  it('returns only what the caller sent', () => {
    expect(updateProductSchema.parse({ salePrice: 9 })).toEqual({ salePrice: 9 });
  });

  it('accepts an explicit zero, which is a value like any other', () => {
    expect(updateProductSchema.parse({ stock: 0 })).toEqual({ stock: 0 });
  });

  it('still validates the fields it does carry', () => {
    expect(updateProductSchema.safeParse({ stock: -1 }).success).toBe(false);
    expect(updateProductSchema.safeParse({ name: '' }).success).toBe(false);
  });
});
