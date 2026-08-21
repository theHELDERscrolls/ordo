import { describe, it, expect } from 'vitest';
import { createProductSchema, updateProductSchema } from '@ordo/shared';
import { parseCsv, spanishCsv, toCsv } from '../../lib/csv.js';
import { PRODUCT_CSV_COLUMNS, readProductRow } from './product.csv.js';

describe('readProductRow', () => {
  it('reads a full row, numbers as numbers', () => {
    const [row] = parseCsv(
      'sku,name,category,supplier,unit,stock,minStock,costPrice,salePrice,description\n' +
        'FIL-001,Filtro,Filtros,Bosch,unidad,12,4,3.5,7.25,Un filtro\n',
    );
    expect(readProductRow(row!)).toEqual({
      sku: 'FIL-001',
      name: 'Filtro',
      category: 'Filtros',
      supplier: 'Bosch',
      unit: 'unidad',
      stock: 12,
      minStock: 4,
      costPrice: 3.5,
      salePrice: 7.25,
      description: 'Un filtro',
    });
  });

  // The alternative is an update that quietly zeroes every price the file did not
  // mention, which is exactly the bug the partial update schema already had once.
  it('leaves out the columns the file did not fill', () => {
    const [row] = parseCsv('sku,name,stock\nFIL-001,Filtro,\n');
    expect(readProductRow(row!)).toEqual({ sku: 'FIL-001', name: 'Filtro' });
    expect(updateProductSchema.parse(readProductRow(row!))).toEqual({
      sku: 'FIL-001',
      name: 'Filtro',
    });
  });

  it('ignores columns the catalogue knows nothing about', () => {
    const [row] = parseCsv('sku,name,unit,proveedorPreferido\nFIL-001,Filtro,unidad,Bosch\n');
    expect(readProductRow(row!)).toEqual({ sku: 'FIL-001', name: 'Filtro', unit: 'unidad' });
  });

  // A number typed as words has to fail validation with its line, not silently
  // land as a zero or crash the whole file.
  it('lets an unparseable number reach validation as NaN', () => {
    const [row] = parseCsv('sku,name,unit,stock\nFIL-001,Filtro,unidad,doce\n');
    expect(createProductSchema.safeParse(readProductRow(row!)).success).toBe(false);
  });

  // A Spanish Excel writes `22,8` where an English one writes `22.8`, and the file
  // has to land the same either way or half the prices arrive as NaN.
  it('reads a decimal written with a comma', () => {
    const [row] = parseCsv('sku;name;unit;costPrice;stock\nFIL-001;Filtro;unidad;22,8;12\n');
    expect(readProductRow(row!)).toEqual({
      sku: 'FIL-001',
      name: 'Filtro',
      unit: 'unidad',
      costPrice: 22.8,
      stock: 12,
    });
  });

  // 1.234,56 or 1,234.56: which mark is the decimal depends on a locale the file
  // does not carry, so it is reported rather than guessed at.
  it('refuses a number carrying both marks instead of guessing the locale', () => {
    const [row] = parseCsv('sku;name;unit;costPrice\nFIL-001;Filtro;unidad;"1.234,56"\n');
    expect(createProductSchema.safeParse(readProductRow(row!)).success).toBe(false);
  });

  it('round-trips an export back into the same input, in both conventions', () => {
    const product = {
      sku: 'FIL-001',
      name: 'Filtro, de aire; con todo',
      category: 'Filtros',
      supplier: 'Bosch',
      unit: 'unidad',
      stock: 12,
      minStock: 4,
      costPrice: 3.5,
      salePrice: 7.25,
      description: 'Con "comillas"',
    };
    for (const format of [{}, spanishCsv]) {
      const [row] = parseCsv(toCsv([product], [...PRODUCT_CSV_COLUMNS], format));
      expect(readProductRow(row!)).toEqual(product);
    }
  });
});
