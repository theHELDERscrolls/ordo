import type { MovementType } from '@ordo/shared';
import { ArrowDownLeft, ArrowUpRight, Diff } from 'lucide-react';

/**
 * One hue per type, at a tenth of its opacity for the fill and a quarter for the
 * border, so the pill reads as a tint rather than as a block of colour. The text
 * takes the darker step in light mode and the lighter one in dark, which is what
 * keeps 12px legible on a tinted background.
 *
 * The tenant accent is not used here: it is already the inventory's "agotado", and a
 * business whose accent is green would turn every exit into an entry. Amber is spoken
 * for by "stock bajo" for the same reason. These three are fixed, like the red of a
 * destructive action.
 */
const types = {
  in: {
    label: 'Entrada',
    icon: ArrowDownLeft,
    tone: 'border-emerald-600/25 bg-emerald-600/10 text-emerald-700 dark:border-emerald-400/25 dark:bg-emerald-400/10 dark:text-emerald-400',
  },
  out: {
    label: 'Salida',
    icon: ArrowUpRight,
    tone: 'border-red-600/25 bg-red-600/10 text-red-700 dark:border-red-400/25 dark:bg-red-400/10 dark:text-red-400',
  },
  adjust: {
    label: 'Ajuste',
    icon: Diff,
    tone: 'border-sky-600/25 bg-sky-600/10 text-sky-700 dark:border-sky-400/25 dark:bg-sky-400/10 dark:text-sky-400',
  },
} satisfies Record<MovementType, unknown>;

type MovementBadgeProps = {
  type: MovementType;
  /**
   * Drops the label to the icon alone below `sm`, for a row that has no width to
   * spare there. The word stays in the accessibility tree and comes back from `sm`.
   */
  compact?: boolean;
};

/**
 * The movement's type as a quiet pill: an icon, a word and a tint. The direction of
 * a movement is what the ledger is scanned for — a column of entries and exits is
 * read down, not word by word — so the three types are the one place in the app
 * besides the stock badge where colour is doing work rather than decorating.
 */
export function MovementBadge({ type, compact = false }: MovementBadgeProps) {
  const { label, icon: Icon, tone } = types[type];
  return (
    <span
      title={compact ? label : undefined}
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs ${tone}`}
    >
      <Icon size={12} strokeWidth={2} />
      {/* `sr-only` and not `hidden`: the type is what the row is about, so it is
          still read out where it is not drawn. Out of flow, it takes no gap either. */}
      <span className={compact ? 'sr-only sm:not-sr-only' : undefined}>{label}</span>
    </span>
  );
}
