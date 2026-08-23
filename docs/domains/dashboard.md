# Dashboard panel

Four figures (product count, inventory value, low stock, out of stock) from
`GET /dashboard/stats`, and two charts from `GET /dashboard/inventory-breakdown`.
The stock cards link into the inventory pre-filtered by that status: the filter is
read from the URL (`?stockStatus=low|out`) rather than component state, so the panel
can deep-link into it and a hand-edited value falls back to "all" instead of
reaching the API.

Both charts derive from the same snapshot, because there is no stock history yet —
nothing in the data model records movement over time, so only the composition of
the present can be charted, never a trend.

- **Capital by category** — horizontal bars, ranked. Answers where the money is
  parked. Horizontal because category names are words that need room, and bars
  rather than a pie because comparing areas fails exactly where the chart has to
  work, between the second and third biggest ranges. Past eight categories the tail
  folds into one "Otras" bar. Each bar carries its value at the tip, so the chart is
  readable without hovering.
- **Capital concentration** — the running share of inventory value across the
  products ranked by value. Answers which references hold the capital and must
  never run out. Deliberately *not* the classic Pareto's two y-axes (currency left,
  percent right): two scales aligned arbitrarily invent a relationship the data does
  not have, so both measures are expressed as a share of the same total on one axis.
  An `80%` reference line marks the usual ABC boundary.

Both are single-series and monochrome. With one series there is no identity to
encode, so bar length and curve height carry the meaning and colour carries none;
amber and the accent stay reserved for stock status, and the ledger's three tints for
the movement type, where they already mean something. Chart colours are the raw theme
tokens (`--fg`, `--border`, `--surface`) passed as SVG attributes, so the light/dark
toggle repaints the charts with no second palette to maintain.

Recharts weighs about 110 kB gzipped, more than the rest of the app's runtime put
together, so the whole charting layer lives in `features/dashboard/charts/` and
`InventoryCharts` is the one module that imports it. The panel pulls that module in
with `React.lazy`, so it builds into its own chunk and the four figures — the reason
to open the panel — paint without waiting for it. The folder boundary and the chunk
boundary are the same line, which is why the charts are grouped rather than sitting
flat beside the page.

The endpoints are in [api/dashboard.md](../api/dashboard.md).
