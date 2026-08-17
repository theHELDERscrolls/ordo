import type { ProductValue } from '@ordo/shared';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { ChartCard } from './ChartCard';
import { axisTick, gridStroke, tooltipStyle } from './chart-theme';
import { money } from '@/shared/format';

// The references making up the first 80% are the ones that must never run out.
const ABC_THRESHOLD = 80;

type Point = { rank: number; cumulative: number; name: string; sku: string; value: number };

function toCurve(topProducts: ProductValue[], totalValue: number): Point[] {
  const points: Point[] = [];
  let running = 0;
  for (const [index, product] of topProducts.entries()) {
    running += product.value;
    points.push({
      rank: index + 1,
      cumulative: (running / totalValue) * 100,
      name: product.name,
      sku: product.sku,
      value: product.value,
    });
  }
  return points;
}

function ConcentrationTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: Point }[];
}) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  return (
    <div style={tooltipStyle}>
      <p className="font-medium">{point.name}</p>
      <p className="mt-0.5 text-fg-muted">{point.sku}</p>
      <p className="mt-1">
        {money(point.value)} · {point.cumulative.toFixed(0)}% acumulado
      </p>
    </div>
  );
}

/**
 * How concentrated the inventory's value is: a steep curve means a handful of
 * references hold the capital, a flat one that it is spread thin.
 *
 * Deliberately not the classic Pareto's two y-axes. Currency on the left and percent
 * on the right are aligned arbitrarily, which invents a relationship the data does
 * not have, so both measures are expressed as a share of the same total on one axis.
 */
export function ValueConcentrationChart({
  topProducts,
  totalValue,
  productCount,
}: {
  topProducts: ProductValue[];
  totalValue: number;
  productCount: number;
}) {
  if (totalValue <= 0 || topProducts.length === 0) return null;

  const points = toCurve(topProducts, totalValue);
  const covered = points[points.length - 1].cumulative;

  return (
    <ChartCard
      title="Concentración del capital"
      takeaway={
        <>
          Las <span className="text-fg">{points.length}</span> referencias con más valor
          de las {productCount} del catálogo concentran el{' '}
          <span className="text-fg">{covered.toFixed(0)}%</span> de tu inversión en stock.
        </>
      }
    >
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={points} margin={{ top: 8, right: 32, bottom: 0, left: -12 }} accessibilityLayer>
          <CartesianGrid vertical={false} stroke={gridStroke} />
          <XAxis
            dataKey="rank"
            tick={axisTick}
            tickLine={false}
            axisLine={{ stroke: gridStroke }}
            interval="preserveStartEnd"
          />
          <YAxis
            domain={[0, 100]}
            ticks={[0, 25, 50, 75, 100]}
            tickFormatter={(value: number) => `${value}%`}
            tick={axisTick}
            tickLine={false}
            axisLine={false}
            width={44}
          />
          <ReferenceLine
            y={ABC_THRESHOLD}
            stroke={gridStroke}
            label={{
              value: `${ABC_THRESHOLD}%`,
              position: 'right',
              fill: 'var(--fg-muted)',
              fontSize: 11,
            }}
          />
          <Tooltip cursor={{ stroke: gridStroke }} content={<ConcentrationTooltip />} />
          <Area
            type="monotone"
            dataKey="cumulative"
            stroke="var(--fg)"
            strokeWidth={2}
            fill="var(--fg)"
            fillOpacity={0.08}
            dot={false}
            activeDot={{ r: 4, fill: 'var(--fg)', stroke: 'var(--surface)', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
      <p className="mt-2 text-xs text-fg-muted">Referencias ordenadas por valor de stock.</p>
    </ChartCard>
  );
}
