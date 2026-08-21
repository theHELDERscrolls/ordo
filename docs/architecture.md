# Architecture

How Ordo is put together. This is a living document: it grows as features land,
and a section is extracted into its own file once it outgrows this one.

## Monorepo

Ordo is an npm-workspaces monorepo with a single root lockfile:

```text
ordo/
├── shared/     @ordo/shared  — Zod contracts shared by backend and frontend
├── backend/    @ordo/backend — REST API (Node + Express + TypeScript)
├── frontend/   @ordo/frontend — web client (React + TypeScript + Vite)
└── docs/        project documentation
```

`shared` holds the Zod schemas that define every data shape (Business, User,
login request/response, roles). Both `backend` and `frontend` depend on it and
are wired through TypeScript project references, so a change to a contract breaks
compilation on both sides instead of drifting silently. Public shapes never
include secrets such as `passwordHash`.

## Backend

Organized by domain (DDD-inspired), grown only as needed:

```text
backend/src/
├── config/     env parsing and the MongoDB connection
├── modules/    one folder per domain
│   ├── auth/       login, JWT, Bearer + role middleware, password hashing
│   ├── business/   Business Mongoose model (embedded branding)
│   ├── user/       User model (bcrypt, businessId) + getAccessibleBusinessIds
│   ├── product/    Product model + inventory CRUD and list API
│   ├── movement/   StockMovement model + the stock ledger API
│   └── dashboard/  inventory stats snapshot + value breakdown endpoints
├── lib/        dependency-free helpers shared across modules (CSV read/write)
├── types/      Express request augmentation (req.userId, req.user)
├── seed.ts     dev-only bootstrap, built from backend/seed/*.csv
└── index.ts    app wiring; connects to Mongo before listening
```

Mongoose models mirror the shared Zod contracts. The server connects to MongoDB
before accepting traffic and fails loudly if the database is unreachable.

## Frontend

Organized into cross-cutting core, domain features, and shared UI:

```text
frontend/src/
├── core/       cross-cutting concerns
│   ├── api/        HTTP client
│   ├── auth/       session context, RequireAuth, useToken
│   ├── hooks/      generic hooks (useDebounce)
│   └── theme/      light/dark theme hook
├── features/   screens grouped by domain
│   ├── auth/       LoginPage
│   ├── dashboard/  DashboardPage + its data hooks, charts/ for the Recharts layer
│   ├── inventory/  list, detail dialog, product form, and its data hooks
│   └── settings/   theme, language, business, log out
└── shared/ui/  AppLayout (the nav shell) + reusable components (Button, Select,
                Modal, ConfirmDialog, StockBadge, TextField, ThemeToggle)
```

The `@` path alias resolves to `src/`. Styling is Tailwind CSS v4 with semantic
tokens defined in `index.css`: three neutral layers plus one accent, mapped via
`@theme` so the light/dark swap and the per-tenant accent both work as CSS
variables. The app is mobile-first.

## Multi-tenant and white-label

One deployment, one database; every tenant-scoped document carries a
`businessId`. The tenant is resolved from the logged-in user's `businessId` (not
from a URL or subdomain): the login page is generic Ordo, and the business brand
(name, accent color, and a muted "by Ordo") is applied after login. There is no
public signup. This keeps a single-business deployment identical to a multi-tenant
one; multi-tenancy is extra credit, not a requirement.

## Authentication flow

1. The client posts credentials to `POST /auth/login`.
2. The backend validates the body with the shared `loginSchema`, looks up the
   user, and verifies the password against the bcrypt hash. Unknown email and
   wrong password return the same generic 401 so emails cannot be probed.
3. On success it signs a JWT for the user id and returns the token plus the
   resolved tenant context (user + business) so the frontend can theme itself.
4. The client stores the token and sends it as a `Bearer` header. The
   `requireAuth` middleware verifies it and populates `req.userId` for protected
   routes such as `GET /auth/me`.

## Inventory

The Product domain is the app's core. A `Product` belongs to a business
(`businessId`) and is identified within it by `sku` (compound unique index
`businessId + sku`), which is the identity the CSV import upserts on. Key
fields: `name`, `sku`, `category`, `supplier`, `unit`, `stock`, `minStock`
(reorder point), `costPrice`, `salePrice`.

`stockStatus` is derived, never stored: `out` when stock is 0, `low` when
`0 < stock <= minStock`, otherwise `in`.

The threshold lives in `product.status.ts` and nowhere else, because it is needed
in two places that cannot share code by default: `stockStatusOf` decides the status
of a document Mongoose has already loaded (the model's virtual, which drives the
list badge), and `stockStatusExpr` is the same rule as a MongoDB expression, used
both as the `$expr` behind the inventory's stock filter and as the `$cond` behind
the panel's low/out counts. Two encodings of one rule is a drift risk, so
`product.status.test.ts` evaluates the expressions in process against the predicate
across a grid of stock/minStock pairs: it fails if the two ever disagree, or if a
bucket stops being mutually exclusive.

Access is role-aware and tenant-scoped. Every query is filtered by
`getAccessibleBusinessIds(user)` (today the user's own business), so one tenant
never sees another's products. Writes (`POST`/`PATCH`/`DELETE`) require the
`admin` role; reads are open to `admin` and `employee`. The `loadUser` middleware
attaches the user (id, businessId, role) after `requireAuth`.

The list is paginated and filterable (search, stock status, category, supplier,
sort with direction); a `GET /products/facets` endpoint returns the distinct
categories and suppliers so the UI fills its filters independently of the current
page.

On the client, a row opens the product's read-only sheet rather than the edit form,
and it does so for any role: an `employee` can inspect a product but sees no write
actions, mirroring the API's split. Editing and deleting hang off that sheet, so
both writes are a deliberate second step. The open product lives in the URL
(`?product=<id>`) next to the stock filter, which makes a sheet linkable and lets
the phone's back button close it. Editing stays a page rather than a second mode
inside the sheet — ten fields in two columns need the room — but saving returns to
the product's sheet instead of the bare list, so a change is seen where it was made.

Modals are built on the native `<dialog>` (`shared/ui/Modal.tsx`). `showModal()`
already gives the focus trap, Escape, the top layer and an inert, unscrollable
background, so `Modal` only adds the shape — a sheet rising from the bottom edge on
a phone, a centred panel from `sm` up — and `ConfirmDialog` composes on top of it.

## Stock movements

A `StockMovement` records one change to a product's stock: `businessId`,
`productId`, `type` (`in`, `out` or `adjust`), a `quantity` that is always
positive, the `resultingStock` it left behind, an optional `reason`, the `userId`
who did it, and `createdAt`. The ledger is append-only, so a movement has a
creation date and no update date, and a mistake is corrected with an opposing
movement rather than an edit.

`quantity` is unsigned because the sign lives in `type`; `resultingStock` is
denormalised because without it the history cannot say what a movement left behind
without replaying the whole ledger on every read. `Product.stock` stays a plain
number on the product for the same reason in reverse: the list, the filters and the
panel all query it directly, and an aggregation per product would pay for that on
every screen. The ledger explains the number, it does not replace it.

Two indexes, `{ businessId, createdAt: -1 }` and `{ productId, createdAt: -1 }`,
cover the two ways it is read: the business's history newest first, and one
product's own sheet.

Every write that touches `stock` records its movement in the same request, so the
two can never drift apart:

| Trigger | Movement | Stock |
|---|---|---|
| `POST /movements` with `type: 'in'` | `in` | `$inc: +quantity` |
| `POST /movements` with `type: 'out'` | `out` | `$inc: -quantity`, guarded by `stock: { $gte: quantity }` |
| `POST /products` with `stock > 0` | `in`, reason "Stock inicial" | set by the create |
| `PATCH /products/:id` that changes `stock` | `adjust`, quantity `abs(new - old)` | set by the patch |
| CSV import, `quantityMode=set` | `adjust`, reason "Importación CSV" | the file's column |
| CSV import, `quantityMode=add` | `in` of the increment, reason "Importación CSV" | current + the column |
| `DELETE /products/:id` | none — the product's movements go with it | n/a |

`recordMovement` in the model is the single place that writes one, and it takes
`resultingStock` from the product as already saved rather than recomputing it.

The exit guard is what makes a sale-like movement safe: the availability check and
the decrement are one atomic `findOneAndUpdate`, so two concurrent exits cannot both
pass the check and drive the stock negative. Nothing matching, when the product does
exist, means insufficient stock — a `409`.

`adjust` is never accepted from `POST /movements`. It exists so that a correction
made in the product form still shows up in the history, and its `quantity` is the
size of the correction, not the new stock. There is no update and no delete on a
movement at all: a mistake is corrected with an opposing entry.

The full design is in [spec 001](./specs/001-stock-movements-and-csv.md). The UI
arrives in a later phase.

## CSV

`backend/src/lib/csv.ts` reads and writes CSV in about sixty lines and no
dependency: `parseCsv` handles quoted fields, `""` as an escaped quote, delimiters
and newlines inside quotes, `CRLF` or `LF`, the BOM Excel writes and blank lines;
`toCsv` quotes only what would otherwise break a row apart. `csv.test.ts` covers
each of those cases plus a `toCsv(parseCsv(x)) === x` round trip, because a parser
that is subtly wrong on quoting corrupts data quietly.

"CSV out of Excel" is not one format: Excel writes the list separator of the
machine's locale, so the same spreadsheet arrives comma-separated in English and
semicolon-separated in Spanish, where the comma is already holding the decimals
(`22,8`). `parseCsv` therefore detects the delimiter from the header rather than
assuming one, and `readProductRow` reads a comma decimal as a point; a number
carrying both marks is ambiguous without a locale the file does not carry, so it is
reported by line instead of guessed at. The export writes the Spanish convention
(`spanishCsv`, plus the UTF-8 BOM without which Excel renders the accents as
mojibake), so its file opens in columns on a double click and still round-trips.

The catalogue's own file shape lives in `product.csv.ts`: the column list the export
writes, and `readProductRow`, which maps a row onto product input. It carries only
the cells the file actually filled, so a column that is missing or empty leaves that
field alone instead of overwriting it with a zero — the same class of bug the
partial update schema already had once. Nothing is coerced defensively: a `stock` of
"doce" arrives as `NaN` and is rejected by validation with its line number, which is
the report the user needs.

`GET /products/export.csv` and `GET /products` share `buildProductFilter` and
`buildProductSort`, so the export is exactly what the list is showing, minus the
pagination. `POST /products/import` upserts on `(businessId, sku)` — the pair the
unique index already enforces — reading the file's SKUs in a single query and
matching the rows in memory. A row that fails validation is reported with its line
and skipped without aborting the file, and two rows for one SKU are refused: the
second would be computed from a stock the first has already moved, which is exactly
how the ledger and the catalogue would end up disagreeing. `dryRun` (the default)
runs the whole loop and reports what it would do, with the writes skipped.

## Seed data

`npm run seed -w @ordo/backend` builds the development database from four CSV files
in `backend/seed/`, read with `node:fs`. They are related by natural keys rather
than ids, so they stay editable in a spreadsheet:

| File | Key columns |
|---|---|
| `businesses.csv` | `slug` |
| `users.csv` | `businessSlug`, `email` |
| `products.csv` | `businessSlug`, `sku` |
| `movements.csv` | `businessSlug`, `sku`, `userEmail` |

The seed wipes the four collections, resolves those keys to ObjectIds in memory,
and then replays the ledger. The `stock` column in `products.csv` is the product's
**opening** stock, recorded as an `in` with reason "Stock inicial"; movements are
applied oldest first, each one updating the running stock and storing it as its
`resultingStock`; and the final running value is what the product is saved with. An
`out` larger than the stock available at that point is skipped with a warning
rather than producing a negative stock.

`movements.csv` dates each row with a relative `daysAgo` instead of an absolute
date, so a database seeded today always looks recently active. Those explicit dates
are why the movements are inserted with Mongoose's automatic timestamps turned off.

## Dashboard panel

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
amber and the accent stay reserved for stock status, where they already mean
something. Chart colours are the raw theme tokens (`--fg`, `--border`, `--surface`)
passed as SVG attributes, so the light/dark toggle repaints the charts with no
second palette to maintain.

Recharts weighs about 110 kB gzipped, more than the rest of the app's runtime put
together, so the whole charting layer lives in `features/dashboard/charts/` and
`InventoryCharts` is the one module that imports it. The panel pulls that module in
with `React.lazy`, so it builds into its own chunk and the four figures — the reason
to open the panel — paint without waiting for it. The folder boundary and the chunk
boundary are the same line, which is why the charts are grouped rather than sitting
flat beside the page.

## HTTP API reference

The REST API has its own home under [`api/`](./api/README.md): base URL,
authentication, common error codes, and every endpoint with request/response JSON
examples.
