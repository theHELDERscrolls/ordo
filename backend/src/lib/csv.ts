/**
 * CSV in and out, for the seed files and the inventory import/export.
 *
 * RFC 4180 as far as a spreadsheet actually goes: quoted fields, `""` as an
 * escaped quote, delimiters and newlines inside quotes, `CRLF` or `LF`, a leading
 * BOM and blank lines. That is a character scanner of about forty lines, which
 * is smaller than the argument for adding a dependency.
 *
 * The field delimiter is detected rather than assumed, because Excel writes the
 * one its locale uses: a comma in English, a semicolon in Spanish.
 */

/**
 * How a Spanish Excel writes a CSV: `;` between fields, because the comma is
 * already taken by the decimals it writes as `22,8`. Passed to {@link toCsv} for
 * a file meant to be opened by double-clicking it; reading detects it on its own.
 */
export const spanishCsv = { delimiter: ';', decimal: ',' } as const;

/**
 * Which character separates the fields. Excel writes the list separator of the
 * machine's locale, so the same spreadsheet arrives comma-separated from one
 * computer and semicolon-separated from the next.
 *
 * Decided on the header alone, and without minding quotes: column names are the
 * one row that is reliably plain.
 */
function detectDelimiter(text: string): string {
  const header = text.slice(0, text.search(/[\r\n]/) + 1 || undefined);
  const count = (char: string): number => header.split(char).length - 1;
  return count(';') > count(',') ? ';' : ',';
}

/** Splits the source into raw rows of raw fields, quoting rules included. */
function scan(text: string, delimiter: string): string[][] {
  // Excel writes a UTF-8 BOM; left in place it would become part of the first
  // header name and every lookup for that column would miss.
  const src = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;

  for (let i = 0; i < src.length; i++) {
    const char = src[i];

    if (quoted) {
      if (char !== '"') {
        field += char;
      } else if (src[i + 1] === '"') {
        field += '"';
        i++;
      } else {
        quoted = false;
      }
      continue;
    }

    if (char === '"') {
      quoted = true;
    } else if (char === delimiter) {
      row.push(field);
      field = '';
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && src[i + 1] === '\n') i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += char;
    }
  }
  row.push(field);
  rows.push(row);

  // A blank line is a row of one empty field, which is also what a trailing
  // newline leaves behind. Neither is data.
  return rows.filter((r) => r.some((value) => value.trim() !== ''));
}

/**
 * Parses a CSV into one object per row, keyed by the header. Values are trimmed,
 * a missing trailing column reads as an empty string, and columns the caller does
 * not know about are simply carried along.
 */
export function parseCsv(text: string): Record<string, string>[] {
  const [header, ...rows] = scan(text, detectDelimiter(text));
  if (!header) return [];
  const columns = header.map((name) => name.trim());
  return rows.map((row) =>
    Object.fromEntries(columns.map((name, i) => [name, (row[i] ?? '').trim()])),
  );
}

/** Quotes a value only when it would otherwise break the row apart. */
function escape(value: unknown, delimiter: string, decimal: string): string {
  const text =
    value === undefined || value === null
      ? ''
      : typeof value === 'number'
        ? String(value).replace('.', decimal)
        : String(value);
  return text.includes(delimiter) || /["\r\n]/.test(text)
    ? `"${text.replaceAll('"', '""')}"`
    : text;
}

/**
 * Serialises rows under the given columns, header first. The trailing newline is
 * what a spreadsheet expects at the end of a file.
 *
 * The default is RFC 4180 — a comma and a point. Pass {@link spanishCsv} for a
 * file that a Spanish Excel opens in columns without its import wizard.
 */
export function toCsv(
  rows: Record<string, unknown>[],
  columns: string[],
  { delimiter = ',', decimal = '.' }: { delimiter?: string; decimal?: string } = {},
): string {
  const cell = (value: unknown): string => escape(value, delimiter, decimal);
  const lines = [columns.map(cell).join(delimiter)];
  for (const row of rows) {
    lines.push(columns.map((name) => cell(row[name])).join(delimiter));
  }
  return `${lines.join('\n')}\n`;
}
