import type { MovementType } from '@ordo/shared';
import { ArrowDownLeft, ArrowUpRight, Diff } from 'lucide-react';

const types = {
  in: { label: 'Entrada', icon: ArrowDownLeft },
  out: { label: 'Salida', icon: ArrowUpRight },
  adjust: { label: 'Ajuste', icon: Diff },
} satisfies Record<MovementType, unknown>;

/**
 * The movement's type as a quiet pill. Monochrome on purpose: the accent and the
 * amber are already spoken for by the stock badge, where telling two states apart at
 * a glance is the screen's job, so here the icon and the label carry it.
 */
export function MovementBadge({ type }: { type: MovementType }) {
  const { label, icon: Icon } = types[type];
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border px-2 py-0.5 text-xs text-fg-muted">
      <Icon size={12} strokeWidth={2} />
      {label}
    </span>
  );
}
