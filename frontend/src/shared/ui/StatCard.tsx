import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

/**
 * The status a figure carries, in the same language as `StockBadge`. `clear` is the
 * resolved state: the dot fades into the border and the figure dims, so only the
 * numbers asking for action draw the eye.
 */
type Status = 'low' | 'out' | 'clear';

const dotColor: Record<Status, string> = {
  low: 'bg-amber-500',
  out: 'bg-accent',
  clear: 'bg-border',
};

type StatCardProps = {
  label: string;
  /** The formatted figure, or null while it is unknown (loading or failed). */
  value: string | null;
  hint: string;
  /** Turns the card into a link to the filtered view behind the figure. */
  to?: string;
  status?: Status;
  loading?: boolean;
};

/**
 * One figure, in three fixed rows: label, figure, hint. The label row always
 * reserves its two lines and the figure row takes the rest, so a label that wraps
 * in one card never lifts its figure off the baseline its siblings sit on. The dot
 * and the chevron keep the right slot, where wrapping text cannot push them around.
 *
 * The card is a container query, so the figure scales with the card's own width
 * rather than the viewport: two columns on a phone and four on a tablet feed the
 * same clamp. Below roughly 100px of usable width a six-digit currency figure still
 * bottoms out at the 1rem floor, and is clipped rather than allowed to break the grid.
 */
export function StatCard({ label, value, hint, to, status, loading }: StatCardProps) {
  const body = (
    <>
      <div className="flex items-start gap-2 overflow-hidden">
        <span className="flex-1 text-xs uppercase leading-4 tracking-wide text-fg-muted">
          {label}
        </span>
        <span
          className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${
            status ? dotColor[status] : 'bg-transparent'
          }`}
        />
        <ChevronRight
          size={14}
          strokeWidth={1.75}
          className={`shrink-0 text-fg-muted ${to ? '' : 'invisible'}`}
        />
      </div>

      <div className="flex items-center overflow-hidden">
        <p
          className={`font-display text-[clamp(1rem,13cqi,2rem)] font-bold leading-none tabular-nums whitespace-nowrap ${
            status === 'clear' ? 'text-fg-muted' : ''
          } ${loading ? 'animate-pulse' : ''}`}
        >
          {value ?? '—'}
        </p>
      </div>

      <p className="text-xs leading-4 text-fg-muted">{hint}</p>
    </>
  );

  const shell =
    '@container grid h-full grid-rows-[2rem_1fr_auto] gap-2 overflow-hidden rounded-lg border border-border bg-surface p-2 text-left transition-colors';

  return to ? (
    <Link to={to} className={`${shell} hover:border-fg`}>
      {body}
    </Link>
  ) : (
    <div className={shell}>{body}</div>
  );
}
