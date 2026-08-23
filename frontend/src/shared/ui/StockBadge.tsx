import type { StockStatus } from '@ordo/shared';

/**
 * A dot and a short label. `in` renders nothing, so only the items needing
 * attention draw the eye. `out` takes the accent as the most actionable state;
 * `low` takes amber, the one deliberate exception to the monochrome palette,
 * earned because telling the two apart at a glance is the screen's whole job.
 */
export function StockBadge({ status }: { status: StockStatus }) {
  if (status === 'in') return null;
  const isOut = status === 'out';
  return (
    <span
      className="inline-flex items-center gap-1.5 text-xs"
      aria-label={isOut ? 'Agotado' : 'Stock bajo'}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${isOut ? 'bg-accent' : 'bg-amber-500'}`} />
      <span className={isOut ? 'text-fg' : 'text-fg-muted'}>{isOut ? 'Agotado' : 'Bajo'}</span>
    </span>
  );
}
