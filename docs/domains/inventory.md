# Inventory

The Product domain is the app's core. A `Product` belongs to a business
(`businessId`) and is identified within it by `sku` (compound unique index
`businessId + sku`), which is the identity the CSV import upserts on. Key
fields: `name`, `sku`, `category`, `supplier`, `unit`, `stock`, `minStock`
(reorder point), `costPrice`, `salePrice`.

## Stock status

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

## Access and the list

Access is role-aware and tenant-scoped, as described in
[tenancy and authentication](./auth.md): writes (`POST`/`PATCH`/`DELETE`) require
the `admin` role; reads are open to `admin` and `employee`.

The list is paginated and filterable (search, stock status, category, supplier,
sort with direction); a `GET /products/facets` endpoint returns the distinct
categories and suppliers so the UI fills its filters independently of the current
page.

## On the client

A row opens the product's read-only sheet rather than the edit form, and it does so
for any role: an `employee` can inspect a product but sees no write actions,
mirroring the API's split. Editing and deleting hang off that sheet, so both writes
are a deliberate second step. The open product lives in the URL (`?product=<id>`)
next to the stock filter, which makes a sheet linkable and lets the phone's back
button close it. Editing stays a page rather than a second mode inside the sheet —
ten fields in two columns need the room — but saving returns to the product's sheet
instead of the bare list, so a change is seen where it was made. The sheet also ends
in the product's last five movements, with a link into the rest, so the number at the
top of it is explained where it is read.

Modals are built on the native `<dialog>` (`shared/ui/Modal.tsx`). `showModal()`
already gives the focus trap, Escape, the top layer and an inert, unscrollable
background, so `Modal` only adds the shape — a sheet rising from the bottom edge on
a phone, a centred panel from `sm` up — and `ConfirmDialog` composes on top of it.

The endpoints are in [api/products.md](../api/products.md).
