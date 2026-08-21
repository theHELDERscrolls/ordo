import { describe, it, expect } from 'vitest';
import { parseCsv, spanishCsv, toCsv } from './csv.js';

describe('parseCsv', () => {
  it('keys each row by the header and trims the values', () => {
    expect(parseCsv('sku, name\nA-1, Aceite 5W-30 ')).toEqual([
      { sku: 'A-1', name: 'Aceite 5W-30' },
    ]);
  });

  it('keeps a comma that lives inside a quoted field', () => {
    expect(parseCsv('sku,name\nA-1,"Aceite, 5L"')).toEqual([
      { sku: 'A-1', name: 'Aceite, 5L' },
    ]);
  });

  it('reads "" as one escaped quote', () => {
    expect(parseCsv('sku,name\nA-1,"Llanta 17"" deportiva"')).toEqual([
      { sku: 'A-1', name: 'Llanta 17" deportiva' },
    ]);
  });

  it('keeps a newline that lives inside a quoted field', () => {
    expect(parseCsv('sku,description\nA-1,"Primera línea\nSegunda línea"')).toEqual([
      { sku: 'A-1', description: 'Primera línea\nSegunda línea' },
    ]);
  });

  it('accepts CRLF line endings', () => {
    expect(parseCsv('sku,name\r\nA-1,Aceite\r\nA-2,Filtro')).toEqual([
      { sku: 'A-1', name: 'Aceite' },
      { sku: 'A-2', name: 'Filtro' },
    ]);
  });

  it('strips the BOM Excel writes, so the first column is still addressable', () => {
    expect(parseCsv('﻿sku,name\nA-1,Aceite')[0].sku).toBe('A-1');
  });

  it('ignores blank lines, wherever they are', () => {
    expect(parseCsv('sku\nA-1\n\nA-2\n\n')).toEqual([{ sku: 'A-1' }, { sku: 'A-2' }]);
  });

  it('reads a missing trailing column as empty rather than undefined', () => {
    expect(parseCsv('sku,name,category\nA-1,Aceite')).toEqual([
      { sku: 'A-1', name: 'Aceite', category: '' },
    ]);
  });

  it('returns nothing for an empty file', () => {
    expect(parseCsv('')).toEqual([]);
  });

  // A Spanish Excel writes the semicolon, because the comma is busy holding the
  // decimals. Assuming one convention would read the whole file as a single column.
  it('detects a semicolon-separated file', () => {
    expect(parseCsv('sku;name;costPrice\nA-1;Aceite 5W-30;22,8')).toEqual([
      { sku: 'A-1', name: 'Aceite 5W-30', costPrice: '22,8' },
    ]);
  });

  it('keeps a comma as data when the delimiter is a semicolon', () => {
    expect(parseCsv('sku;name\nA-1;Aceite, 5L')).toEqual([{ sku: 'A-1', name: 'Aceite, 5L' }]);
  });

  it('still quotes fields in a semicolon file', () => {
    expect(parseCsv('sku;name\nA-1;"Aceite; 5L"')).toEqual([{ sku: 'A-1', name: 'Aceite; 5L' }]);
  });

  it('decides on the header alone, so a semicolon in the data changes nothing', () => {
    expect(parseCsv('sku,description\nA-1,Corto; y con punto y coma')).toEqual([
      { sku: 'A-1', description: 'Corto; y con punto y coma' },
    ]);
  });
});

describe('toCsv', () => {
  it('emits the header even with no rows', () => {
    expect(toCsv([], ['sku', 'name'])).toBe('sku,name\n');
  });

  it('quotes only what would break the row apart, and writes empty for a missing value', () => {
    expect(toCsv([{ sku: 'A-1', name: 'Aceite, 5L' }], ['sku', 'name', 'category'])).toBe(
      'sku,name,category\nA-1,"Aceite, 5L",\n',
    );
  });

  it('writes the Spanish convention, quoting on the delimiter it is actually using', () => {
    expect(
      toCsv(
        [{ sku: 'A-1', name: 'Aceite, 5L', costPrice: 22.8, stock: 67 }],
        ['sku', 'name', 'costPrice', 'stock'],
        spanishCsv,
      ),
    ).toBe('sku;name;costPrice;stock\nA-1;Aceite, 5L;22,8;67\n');
  });

  it('quotes a semicolon that lives inside a value', () => {
    expect(toCsv([{ name: 'Aceite; 5L' }], ['name'], spanishCsv)).toBe('name\n"Aceite; 5L"\n');
  });
});

describe('round trip', () => {
  it('survives the fields that break parsers', () => {
    const csv =
      'sku,name,description\n' +
      'A-1,"Aceite, 5L","Primera línea\nSegunda línea"\n' +
      'A-2,"Llanta 17"" deportiva",\n';
    expect(toCsv(parseCsv(csv), ['sku', 'name', 'description'])).toBe(csv);
  });

  it('survives them in the Spanish convention too', () => {
    const csv =
      'sku;name;description\n' +
      'A-1;"Aceite; 5L";"Primera línea\nSegunda línea"\n' +
      'A-2;"Llanta 17"" deportiva";\n';
    expect(toCsv(parseCsv(csv), ['sku', 'name', 'description'], spanishCsv)).toBe(csv);
  });
});
