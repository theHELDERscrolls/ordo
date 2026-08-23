import { Link } from 'react-router-dom';

import { MovementBadge } from './MovementBadge';
import { signedQuantity } from './movement-format';
import { useMovements } from './useMovements';
import { dateTime, relativeTime } from '@/shared/format';

const RECENT = 5;

/**
 * The tail of one product's ledger, for its sheet: enough to see what has been
 * happening without leaving the dialog, and a link into the full history for the
 * rest. Renders nothing at all when the product has none, rather than an empty
 * heading over a blank list.
 */
export function RecentMovements({ productId }: { productId: string }) {
  const { data } = useMovements({ productId, limit: RECENT });
  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  if (items.length === 0) return null;

  return (
    <div className="mt-6">
      <div className="flex items-baseline justify-between gap-4">
        <h3 className="text-sm font-medium">Últimos movimientos</h3>
        {total > items.length && (
          <Link
            to={`/movements?productId=${productId}`}
            className="text-sm text-fg-muted underline transition-colors hover:text-fg"
          >
            Ver los {total}
          </Link>
        )}
      </div>
      <ul className="mt-2 divide-y divide-border">
        {items.map((m) => (
          <li key={m.id} className="flex items-center justify-between gap-3 py-2.5">
            <span className="flex min-w-0 items-center gap-2">
              <MovementBadge type={m.type} compact />
              <span className="truncate text-sm text-fg-muted">{m.reason}</span>
            </span>
            <span className="flex shrink-0 items-baseline gap-3 text-sm tabular-nums">
              <span className="font-medium">{signedQuantity(m.type, m.quantity)}</span>
              <span className="text-fg-muted" title={dateTime(m.createdAt)}>
                {relativeTime(m.createdAt)}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
