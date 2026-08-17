import type { ReactNode } from 'react';

/**
 * The card every chart sits in. The heading stays outside the plot, so the chart
 * carries no text chrome of its own, and `takeaway` states its single reading in
 * words — what a user should leave with even if they never hover.
 */
export function ChartCard({
  title,
  takeaway,
  children,
}: {
  title: string;
  takeaway: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-lg border border-border bg-surface p-2 transition-colors sm:p-5">
      <h2 className="font-display text-sm font-semibold tracking-tight">{title}</h2>
      <p className="mt-1 text-xs leading-4 text-fg-muted">{takeaway}</p>
      <div className="mt-4">{children}</div>
    </section>
  );
}
