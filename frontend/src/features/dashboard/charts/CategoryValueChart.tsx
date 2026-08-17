import type { CategoryValue } from '@ordo/shared';
import { Bar, BarChart, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { ChartCard } from './ChartCard';
import { axisTick, tooltipCursor, tooltipStyle } from './chart-theme';
import { money, moneyCompact } from '@/shared/format';

// Past this many the ranking stops being readable and the tail stops mattering, so
// the remainder folds into one bar rather than being dropped.
const MAX_BARS = 8;
const ROW_HEIGHT = 36;
const UNCATEGORISED = 'Sin categoría';

type Bucket = { category: string; value: number; productCount: number };

function toBuckets(byCategory: CategoryValue[]): Bucket[] {
  const named = byCategory
    .filter((c) => c.value > 0)
    .map((c) => ({ ...c, category: c.category || UNCATEGORISED }));
  if (named.length <= MAX_BARS) return named;

  const tail = named.slice(MAX_BARS - 1);
  return [
    ...named.slice(0, MAX_BARS - 1),
    {
      category: `Otras (${tail.length})`,
      value: tail.reduce((sum, c) => sum + c.value, 0),
      productCount: tail.reduce((sum, c) => sum + c.productCount, 0),
    },
  ];
}

function CategoryTooltip({ active, payload }: { active?: boolean; payload?: { payload: Bucket }[] }) {
  if (!active || !payload?.length) return null;
  const bucket = payload[0].payload;
  return (
    <div style={tooltipStyle}>
      <p className="font-medium">{bucket.category}</p>
      <p className="mt-0.5 text-fg-muted">
        {money(bucket.value)} · {bucket.productCount} referencias
      </p>
    </div>
  );
}

/**
 * Where the money is parked. Horizontal because category names are words that need
 * room, and ranked because the ranking is the point. Not a pie: comparing slice
 * areas fails exactly where this chart has to work, between the second and third
 * biggest ranges. Every bar carries its value at the tip, so it reads without
 * hovering and needs no gridlines behind it.
 */
export function CategoryValueChart({ byCategory }: { byCategory: CategoryValue[] }) {
  const buckets = toBuckets(byCategory);
  if (buckets.length === 0) return null;

  const top = buckets[0];

  return (
    <ChartCard
      title="Capital por categoría"
      takeaway={
        <>
          <span className="text-fg">{top.category}</span> es donde más dinero tienes
          parado: {money(top.value)} en {top.productCount} referencias.
        </>
      }
    >
      <ResponsiveContainer width="100%" height={buckets.length * ROW_HEIGHT + 8}>
        <BarChart
          data={buckets}
          layout="vertical"
          margin={{ top: 0, right: 50, bottom: 0, left: -25 }}
          accessibilityLayer
        >
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="category"
            width={96}
            tickLine={false}
            axisLine={false}
            tick={axisTick}
            tickFormatter={(name: string) => (name.length > 16 ? `${name.slice(0, 15)}…` : name)}
          />
          <Tooltip cursor={tooltipCursor} content={<CategoryTooltip />} />
          <Bar dataKey="value" fill="var(--fg)" barSize={16} radius={[0, 4, 4, 0]}>
            <LabelList
              dataKey="value"
              position="right"
              offset={8}
              formatter={(value: unknown) => moneyCompact(Number(value))}
              style={{ fill: 'var(--fg-muted)', fontSize: 11 }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
