import { describe, it, expect } from 'vitest';
import { Product } from './product.model.js';

// stockStatus is the only branching logic in the model. Verify it without a DB by
// instantiating an unsaved document and reading the virtual.
describe('Product stockStatus virtual', () => {
  const status = (stock: number, minStock: number): string =>
    new Product({ name: 'x', sku: 'x', unit: 'unit', stock, minStock }).get('stockStatus');

  it('is "out" when stock is 0', () => {
    expect(status(0, 5)).toBe('out');
  });

  it('is "low" when stock is at or below minStock but above 0', () => {
    expect(status(3, 5)).toBe('low');
    expect(status(5, 5)).toBe('low');
  });

  it('is "in" when stock is above minStock', () => {
    expect(status(6, 5)).toBe('in');
  });
});
