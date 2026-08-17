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
