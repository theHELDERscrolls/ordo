# Stock movements

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

## Every path that moves stock

Every write that touches `stock` records its movement in the same request, so the
two can never drift apart:

| Trigger | Movement | Stock |
|---|---|---|
| `POST /movements` with `type: 'in'` | `in` | `$inc: +quantity` |
| `POST /movements` with `type: 'out'` | `out` | `$inc: -quantity`, guarded by `stock: { $gte: quantity }` |
| `POST /products` with `stock > 0` | `in`, reason "Stock inicial" | set by the create |
| `PATCH /products/:id` that changes `stock` | `adjust`, quantity `abs(new - old)`, reason "Ajuste manual" | set by the patch |
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

## On the client

The ledger is its own section (`/movements`), a third entry in the nav beside the
panel and the inventory. It reads like the inventory does, for the same reasons: the
filters (product, type, date range) live in the URL rather than in component state,
so the product sheet can link straight into one product's history and a filtered view
is shareable; the type is parsed through the shared enum, so a hand-edited value falls
back to "all" instead of reaching the API; and the table becomes a list of cards below
`md`. There is no row to open — a movement has no detail beyond the row, and no edit
behind it.

The product filter is not a dropdown. The catalogue runs past what the list endpoint
returns in one page, so the options cannot be loaded up front: `ProductPicker` is a
search field that queries the API and holds the choice as an id, which is what makes
the filter survive a reload and a shared URL. Registering a movement uses the same
control, so the two places that name a product name it the same way.

`useCreateMovement` invalidates the ledger, the inventory list, the product's own
sheet and the panel's figures, because a movement changes the number all four read.
The facets are left alone: a movement never introduces a category or a supplier.
Only `in` and `out` are offered in the dialog, mirroring the API — an `adjust` is
something the system writes, never something a client declares.

## Why an employee may record one

Registering is the one write open to `employee`, and it is deliberate. Everywhere
else the split holds — the catalogue, its prices and its reorder points are `admin` —
but the person behind the counter is the one who actually moves the stock, and a shop
where every sale waits for the owner to type it is a shop that stops recording sales.
The ledger is safe in more hands than the catalogue precisely because it is
append-only: an employee can add to the trail and cannot rewrite it, every entry
carries who made it, and an exit still cannot drive the stock negative.

## Reading it at a glance

`MovementBadge` is the second place after the stock badge where colour does work
rather than decorate: an entry is green, an exit red and an adjustment blue, as a
tenth-opacity tint with the text a step darker in light mode and a step lighter in
dark. A ledger is scanned down a column for direction, which a word alone makes slow.
The three are fixed hues and not the tenant accent, which is already "agotado" and
which for a business with a green accent would paint every exit as an entry; amber is
spoken for by "stock bajo" for the same reason. In the product sheet's recent list the
label drops to `sr-only` below `sm`, where the row has no width for it.

The dates are relative ("hace 2 días") through `Intl.RelativeTimeFormat`, with the
exact timestamp as the element's `title`: a history is read for how recent an entry
is, not for which Tuesday it landed on, and the native formatter means no phrasing
table and no date library.

The endpoints are in [api/movements.md](../api/movements.md); the full design is in
[spec 001](../specs/001-stock-movements-and-csv.md).
