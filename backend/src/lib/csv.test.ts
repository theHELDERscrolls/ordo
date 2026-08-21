import { describe, it, expect } from 'vitest';
import { parseCsv, toCsv } from './csv.js';

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
});

describe('round trip', () => {
  it('survives the fields that break parsers', () => {
    const csv =
      'sku,name,description\n' +
      'A-1,"Aceite, 5L","Primera línea\nSegunda línea"\n' +
      'A-2,"Llanta 17"" deportiva",\n';
    expect(toCsv(parseCsv(csv), ['sku', 'name', 'description'])).toBe(csv);
  });
});
