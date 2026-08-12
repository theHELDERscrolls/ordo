import type { StockStatus } from '@ordo/shared';

// A restrained stock indicator: a small dot plus a short label. "in" renders
// nothing — the silent default, so only items needing attention draw the eye.
// "out" uses the accent (the most urgent, actionable state); "low" uses amber, the
// one deliberate exception to the monochrome palette, justified because telling low
// from out at a glance is the whole job of the screen.
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
