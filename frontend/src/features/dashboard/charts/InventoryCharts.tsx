import type { InventoryBreakdown } from '@ordo/shared';

import { CategoryValueChart } from './CategoryValueChart';
import { ValueConcentrationChart } from './ValueConcentrationChart';

/**
 * Both charts behind one default export, and the only module that imports Recharts.
 * The panel loads it lazily, so the ~110 kB the library weighs gzipped builds into
 * its own chunk: the four figures, the reason someone opens the panel, paint without
 * waiting for a library that only draws what comes after them.
 */
export default function InventoryCharts({ breakdown }: { breakdown: InventoryBreakdown }) {
  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <CategoryValueChart byCategory={breakdown.byCategory} />
      <ValueConcentrationChart
        topProducts={breakdown.topProducts}
        totalValue={breakdown.totalValue}
        productCount={breakdown.productCount}
      />
    </div>
  );
}
