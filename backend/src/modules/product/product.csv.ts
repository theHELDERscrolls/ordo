/**
 * The catalogue's CSV shape, shared by the export and the import so a file that
 * comes out of Ordo goes back in unchanged.
 */

/** The file's columns, in the order the export writes them. */
export const PRODUCT_CSV_COLUMNS = [
  'sku',
  'name',
  'category',
  'supplier',
  'unit',
  'stock',
  'minStock',
  'costPrice',
  'salePrice',
  'description',
] as const;

const NUMERIC_COLUMNS = new Set(['stock', 'minStock', 'costPrice', 'salePrice']);

/**
 * Reads a number written in either convention: `22.8`, or the `22,8` a Spanish
 * Excel writes. A lone comma is always the decimal mark here — Excel writes no
 * thousands separator into a CSV — so `22,8` becomes `22.8`, while a value
 * carrying both marks is left alone to fail validation with its line number
 * rather than be guessed at.
 */
function toNumber(value: string): number {
  return Number(value.includes(',') && !value.includes('.') ? value.replace(',', '.') : value);
}

/**
 * Maps one parsed CSV row onto product input, ready for the Zod schemas.
 *
 * Only the cells the file actually filled are carried: a column that is missing
 * or empty leaves that field alone instead of overwriting it with a zero or an
 * empty string, so a two-column `sku,name` file can rename products without
 * flattening their prices.
 *
 * Nothing is coerced defensively — a `stock` of "doce" becomes `NaN` and is
 * rejected by validation with its line number, which is the report the user needs.
 */
export function readProductRow(row: Record<string, string>): Record<string, unknown> {
  const input: Record<string, unknown> = {};
  for (const column of PRODUCT_CSV_COLUMNS) {
    const value = row[column];
    if (value === undefined || value === '') continue;
    input[column] = NUMERIC_COLUMNS.has(column) ? toNumber(value) : value;
  }
  return input;
}
