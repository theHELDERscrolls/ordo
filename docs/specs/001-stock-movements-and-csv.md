# Spec 001 — Stock movements and CSV import/export

Status: proposed
Supersedes: the product image upload (Cloudinary), dropped as optional and not worth
the surface it added.

## Context

Ordo can already describe what a business *has*: a product catalogue with search,
filters and a dashboard that values the stock. What it cannot do is explain how that
stock got there or how it changes. Every quantity is typed by hand into the product
form, so there is no history behind a number, and the seed data lives hardcoded in
TypeScript rather than coming from a real dataset.

This spec closes both gaps with one domain: a **stock movement ledger**, plus the
**CSV path** in and out of the catalogue. A movement (`in`, `out`, `adjust`) is the
only thing that changes a product's stock, which makes the inventory auditable, gives
the app a third related collection, and provides enough realistic seed data to
exercise the list, the filters and the panel at a believable scale.

## Goals

1. Every change to `Product.stock` is recorded as a `StockMovement`, including the
   ones made from the product form and from a CSV import.
2. The database is generated from CSV files read with `node:fs`, not from literals in
   the seed script.
3. An admin can bulk-load the catalogue from a CSV exported from Excel, previewing the
   result before it is applied.
4. Anyone can export the current (filtered) inventory as a CSV.
5. A "Movements" section shows the history, filterable, and each product's sheet shows
   its own recent movements.

## Non-goals

- No supplier or expense entity: `supplier` stays a string on the product.
- No editing or deleting a movement. A ledger is append-only; a mistake is corrected
  with an opposing movement, which is also the audit trail's whole point.
- No CSV import for users or businesses: those are seeded, not managed in the UI.
- No Telegram bot, no file/image storage. Both are dropped from the project.
- No ABC analysis or turnover metrics on top of the ledger (a later spec could).

## Data model

```
Business 1---N Product 1---N StockMovement N---1 User
```

`StockMovement` (`backend/src/modules/movement/movement.model.ts`):

| Field | Type | Notes |
|---|---|---|
| `businessId` | ObjectId → Business | Tenant scope, like every other collection |
| `productId` | ObjectId → Product | The product whose stock changed |
| `type` | `'in' \| 'out' \| 'adjust'` | See rules below |
| `quantity` | Number > 0 | Always positive; `type` carries the sign |
| `resultingStock` | Number >= 0 | The product's stock after this movement |
| `reason` | String, optional | Free text ("Recuento", "Rotura", "Importación CSV") |
| `userId` | ObjectId → User | Who did it, from the session, never from the body |
| `createdAt` | Date | From `timestamps`, and the ledger's sort key |

Indexes: `{ businessId: 1, createdAt: -1 }` for the history, `{ productId: 1, createdAt: -1 }`
for a product's own sheet.

`resultingStock` is denormalised on purpose: without it the history cannot say what a
movement left behind without replaying the whole ledger on every read.

`Product.stock` stays as it is — a plain number on the product. Deriving it from the
ledger on every read would mean an aggregation per product in the list, the filters and
the dashboard, all of which query `stock` directly today. The ledger explains the
number; it does not replace it.

## Rules that keep stock and ledger in agreement

Every write that touches `stock` also writes a movement, in the same request:

| Trigger | Movement | Stock update |
|---|---|---|
| `POST /movements` with `type: 'in'` | `in` | `$inc: +quantity` |
| `POST /movements` with `type: 'out'` | `out` | `$inc: -quantity`, guarded by `stock: { $gte: quantity }` |
| `POST /products` with `stock > 0` | `in`, reason "Stock inicial" | Already set by the create |
| `PATCH /products/:id` that changes `stock` | `adjust`, quantity `abs(new - old)` | Set by the patch |
| CSV import that changes `stock` | `adjust` (mode `set`) or `in` (mode `add`), reason "Importación CSV" | Per row |
| `DELETE /products/:id` | none — the product's movements are deleted with it | n/a |

The `out` guard is what makes a sale-like movement safe: the filter and the `$inc` are
one atomic `findOneAndUpdate`, so two concurrent requests cannot both pass a check and
drive the stock negative. No document matched plus an existing product means
insufficient stock, which is a `409`.

`adjust` is never accepted from `POST /movements`. It exists so that a correction made
in the product form still shows up in the history, and its `quantity` is the size of the
correction, not the new stock.

## Shared contract (`shared/src/index.ts`)

```ts
export const movementTypes = ['in', 'out', 'adjust'] as const;
export const movementTypeSchema = z.enum(movementTypes);

export const movementSchema = z.object({
  id: z.string(),
  businessId: z.string(),
  productId: z.string(),
  productName: z.string(),      // resolved server-side, so the list needs no second call
  productSku: z.string(),
  type: movementTypeSchema,
  quantity: z.number().positive(),
  resultingStock: z.number().nonnegative(),
  reason: z.string().optional(),
  userId: z.string(),
  userName: z.string(),
  createdAt: z.string(),
});

// Only `in` and `out` are user-creatable; `adjust` is system-generated.
export const createMovementSchema = z.object({
  productId: z.string().min(1),
  type: z.enum(['in', 'out']),
  quantity: z.number().positive(),
  reason: z.string().max(120).optional(),
});

export const movementListResponseSchema = z.object({
  items: z.array(movementSchema), total, page, limit
});

export const importModes = ['set', 'add'] as const;   // what a CSV `stock` column means
export const importResultSchema = z.object({
  dryRun: z.boolean(),
  total: z.number().int().nonnegative(),
  created: z.number().int().nonnegative(),
  updated: z.number().int().nonnegative(),
  skipped: z.number().int().nonnegative(),
  errors: z.array(z.object({ row: z.number().int().positive(), sku: z.string().optional(), message: z.string() })),
});
```

## API

All routes keep the existing middleware chain: `requireAuth, loadUser` for reads and
`requireAdmin` on top for writes, scoped by `getAccessibleBusinessIds(req.user)`.

### `GET /movements`

Query: `productId`, `type`, `from`, `to` (ISO dates), `page`, `limit` (max 100).
Sorted newest first. Product name/SKU and user name are resolved with `populate` and
flattened in the response, so the table needs one request.

### `POST /movements` (admin)

Body `createMovementSchema`. Returns `201` with the movement.
`404` if the product is not in the caller's business, `409` `{ "error": "Insufficient stock" }`
when an `out` exceeds the available stock.

### `GET /products/export.csv`

Returns `text/csv; charset=utf-8` with `Content-Disposition: attachment; filename="ordo-inventario-<date>.csv"`.
Honours the same query parameters as `GET /products` (search, stockStatus, category,
supplier, sort, order) and ignores pagination: you export what you are looking at.
The filter builder currently inlined in `GET /products` (`product.routes.ts:57-70`) is
extracted to `buildProductFilter(req)` and shared by both handlers.

Columns: `sku,name,category,supplier,unit,stock,minStock,costPrice,salePrice,description`.

### `POST /products/import` (admin)

Body: raw CSV, `Content-Type: text/csv`, parsed with `express.text({ type: 'text/csv', limit: '1mb' })`.
Query: `dryRun=true|false` (default `true`), `quantityMode=set|add` (default `set`).

- Identity is `(businessId, sku)` — the same pair the unique index already enforces.
  A known SKU updates, an unknown one creates.
- `quantityMode=set` writes the `stock` column as the new stock; `add` adds it to the
  current stock. Everything else is always overwritten by the file.
- Rows are validated one by one against `createProductSchema`. An invalid row is
  reported with its line number and skipped; it never aborts the rest of the file.
- `dryRun=true` runs the whole validation and reports what *would* happen without
  writing anything, which is what the UI shows before asking for confirmation.
- Returns `importResultSchema`. `400` if the CSV has no header or no recognisable
  `sku`/`name` columns, `413` if it exceeds the limit.

## CSV handling (`backend/src/lib/csv.ts`)

Two functions, no dependency:

- `parseCsv(text: string): Record<string, string>[]` — RFC 4180 enough for real files
  out of Excel: quoted fields, `""` as an escaped quote, commas and newlines inside
  quotes, `CRLF` or `LF`, a leading BOM, and trailing blank lines. The first row is the
  header; unknown columns are kept but ignored by callers; values are trimmed.
- `toCsv(rows, columns): string` — quotes any value containing a comma, a quote or a
  newline, and always emits the header.

`csv.test.ts` covers the cases that actually break parsers: a field with a comma, an
escaped quote, a newline inside a quoted field, CRLF line endings, a BOM, and a
`toCsv(parseCsv(x)) === x` round trip. This is the one piece of non-trivial logic in the
spec, so it is the one that gets tests.

## Seed (`backend/seed/*.csv` + `backend/src/seed.ts`)

Four files, read with `node:fs`, related by natural keys rather than ids:

| File | Columns | Rows |
|---|---|---|
| `businesses.csv` | `slug,name,accentColor` | 1 |
| `users.csv` | `businessSlug,email,name,role,password` | 2 |
| `products.csv` | `businessSlug,sku,name,category,supplier,unit,stock,minStock,costPrice,salePrice,description` | 100+ |
| `movements.csv` | `businessSlug,sku,userEmail,type,quantity,reason,daysAgo` | 150+ |

The seed resolves `businessSlug` → `Business._id`, `sku` → `Product._id` and
`userEmail` → `User._id` in memory after inserting each collection, so the CSVs stay
readable and editable in Excel.

`daysAgo` is a relative offset instead of an absolute date, so a seeded database always
looks recently active whenever it is run. Movements are applied oldest first: the
product's `stock` column in `products.csv` is its *opening* stock (recorded as an `in`
with reason "Stock inicial"), each movement then updates the running stock and stores it
as `resultingStock`, and the final running value is what the product is saved with. An
`out` larger than the stock available at that point is skipped with a warning rather
than silently producing a negative stock.

The existing 45-product catalogue is the starting point and is extended past 100 in the
same style (a real car-parts shop). Keep the source spreadsheet in Drive and export it
over these files; the CSVs in the repo are the source of truth for the seed.

## Frontend

### New section: Movements (`features/movements/`)

- `MovementsPage.tsx` at `/movements` — the history, newest first: product, type badge,
  quantity signed by type, resulting stock, reason, user, relative date. Filters for
  product, type and date range in the URL, like the inventory's already are.
- `MovementFormDialog.tsx` — admin only, opened from the page header: product, type
  (`in`/`out`), quantity, optional reason. Built on the existing `Modal`.
- `useMovements.ts` / `useCreateMovement.ts` — React Query, invalidating `products`,
  `product`, `movements`, `dashboard-stats` and `inventory-breakdown` on success, the
  same set `useSaveProduct` already invalidates.
- Navigation: a fourth entry in `AppLayout`'s `primaryNav` (`ArrowLeftRight` icon),
  which the mobile bottom bar picks up automatically.

### Inventory additions

- `ProductDetailDialog` gains a "Últimos movimientos" block: the last five for that
  product, and a link into `/movements?productId=<id>` for the rest.
- Header buttons: "Exportar CSV" (any role) and "Importar CSV" (admin only).
- `ImportDialog.tsx` — file picker (`<input type="file" accept=".csv">`, read with the
  native `file.text()`), a `set`/`add` selector, then the dry-run summary: counts of
  created/updated/skipped and the row-level errors in a scrollable table. Only after
  that does "Importar" fire the real request.
  The preview table is where `useDeferredValue` earns its place: a 100-row report keeps
  the dialog responsive while it renders, and `useMemo` holds its totals.
- Export is a fetch with the Bearer token, then a `Blob` and a programmatic download —
  a plain `<a href>` cannot carry the token.

## Phases

Each phase is one issue and one PR, branched from `develop`.

**Phase 1 — CSV parser, movement model and seed from CSV.**
`lib/csv.ts` with its test, `StockMovement` model, the four CSV files (100+ products,
150+ movements) and the rewritten `seed.ts`.
Done when: `npm run seed -w @ordo/backend` fills the database from the files, the
running stock matches the ledger, and the app shows the seeded catalogue unchanged in
behaviour.

**Phase 2 — Movements API.**
`GET /movements`, `POST /movements`, and the automatic movements from product create,
patch and delete.
Done when: an `out` beyond the available stock returns `409` and leaves the stock
untouched, editing stock in the product form leaves an `adjust` in the ledger, and
deleting a product removes its movements.

**Phase 3 — CSV export and import.**
`buildProductFilter` extraction, `GET /products/export.csv`, `POST /products/import`
with dry run and both quantity modes.
Done when: exporting a filtered inventory and re-importing that file is a no-op, an
invalid row is reported by line number without stopping the rest, and an import that
changes stock leaves movements behind.

**Phase 4 — Movements UI.**
The page, the dialog, the nav entry, and the recent-movements block in the product
sheet.
Done when: an `employee` can browse the history but sees no "Registrar movimiento"
button, and registering a movement updates the inventory and the dashboard without a
reload.

**Phase 5 — Import/export UI.**
The two header buttons and `ImportDialog` with its preview.
Done when: a CSV with a deliberately broken row shows the error against its line and
imports the rest only after confirmation.

**Phase 6 — Polish and deployment.**
Spacing and radius tokens in `@theme` replacing the repeated page paddings, docs
(`architecture.md`, `api/movements.md`, `api/products.md`, `openapi.yaml`, Postman
collection), a README pass, and the deployment to Render and Vercel.

## Verification

Per phase: a clean rebuild from the repo root (`npm run build` after clearing `dist`),
`npm run lint`, `npm run test`, and then the real behaviour exercised in the running app
by the author — a build passing is not evidence that a movement adjusted the stock.

The specific paths to exercise are listed as the "Done when" of each phase above.

## Risks

- **Deployment.** Render's free tier sleeps; a cold start takes a few seconds on the
  first request. Worth stating in the README rather than fighting.
- **Import size.** The 1 MB body limit is around 8000 product rows, well past any
  realistic spreadsheet for this domain. A file beyond that needs streaming, which is
  a different design and not worth pre-empting.
