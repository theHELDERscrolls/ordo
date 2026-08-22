/** A price, written the same way everywhere it appears. */
export const money = (n: number) =>
  n.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' });

/** The same currency without the cents, where room is scarce and cents are noise. */
export const moneyCompact = (n: number) =>
  n.toLocaleString('es-ES', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  });

/** A full timestamp, for the `title` behind a relative date. */
export const dateTime = (iso: string) =>
  new Date(iso).toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' });

const relative = new Intl.RelativeTimeFormat('es-ES', { numeric: 'auto' });
const units = [
  ['year', 31_536_000],
  ['month', 2_592_000],
  ['day', 86_400],
  ['hour', 3_600],
  ['minute', 60],
] as const;

/**
 * "hace 2 días" instead of a date, which is what a history is read for: how recent
 * an entry is, not which Tuesday it landed on. `Intl.RelativeTimeFormat` writes it,
 * so there is no phrasing table and no date library; the exact timestamp stays
 * available as the element's `title`.
 */
export function relativeTime(iso: string): string {
  const seconds = (Date.parse(iso) - Date.now()) / 1000;
  for (const [unit, size] of units) {
    if (Math.abs(seconds) >= size) return relative.format(Math.round(seconds / size), unit);
  }
  return relative.format(Math.round(seconds), 'second');
}
