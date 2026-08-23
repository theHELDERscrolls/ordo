# CSV

The path in and out of the catalogue as a spreadsheet, and the development seed
built on the same reader.

## The parser

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

## The catalogue's own file shape

It lives in `product.csv.ts`: the column list the export writes, and
`readProductRow`, which maps a row onto product input. It carries only the cells the
file actually filled, so a column that is missing or empty leaves that field alone
instead of overwriting it with a zero — the same class of bug the partial update
schema already had once. Nothing is coerced defensively: a `stock` of "doce" arrives
as `NaN` and is rejected by validation with its line number, which is the report the
user needs.

`GET /products/export.csv` and `GET /products` share `buildProductFilter` and
`buildProductSort`, so the export is exactly what the list is showing, minus the
pagination. `POST /products/import` upserts on `(businessId, sku)` — the pair the
unique index already enforces — reading the file's SKUs in a single query and
matching the rows in memory. A row that fails validation is reported with its line
and skipped without aborting the file, and two rows for one SKU are refused: the
second would be computed from a stock the first has already moved, which is exactly
how the ledger and the catalogue would end up disagreeing. `dryRun` (the default)
runs the whole loop and reports what it would do, with the writes skipped.

## On the client

Both ends of that path are in the inventory's header: "Exportar CSV" for any role,
"Importar CSV" for `admin` alone, the same split the rest of the catalogue keeps. On a
phone they shrink to their icon, because three labelled buttons do not fit beside the
title.

The export goes through `fetch` and a `Blob` rather than a link to the URL: a plain
`<a href>` cannot carry the Bearer token, so `apiDownload` requests the file, names it
from the `Content-Disposition` the API sends, and clicks a link it then throws away.
That header is not exposed to cross-origin JavaScript by default, which is why the
backend's `cors()` now lists it — otherwise the browser hides it and the file has to
be named by the client, in a second place that can drift from the first. The export
sends the filters that are on screen, minus the pagination, through the same
`toQuery` the list uses.

`ImportDialog` never writes on its own. Picking a file reads it with the native
`file.text()` and asks the API what it *would* do; changing between "Reemplazar" and
"Sumar" asks again; only "Importar" repeats the request with `dryRun=false`. It is one
mutation for both steps rather than two, because it is one request — the result
carries the flag back, so the dialog knows which of the two it is showing. The report
is rendered from a `useDeferredValue` copy with its figures in a `useMemo`, so a
hundred-row error list paints in the background instead of locking the dialog, and the
table dims while the deferred value catches up. The errors keep the wording the API
sends, naming the column that failed: they are read against the spreadsheet, where
that is the only name that helps. Only the refusals about the file as a whole are
translated.

A real import invalidates more than a movement does: the list, every product sheet,
the facets — an import can introduce a category the filters must offer at once — the
ledger, and the panel's figures.

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

The endpoints are in [api/products.md](../api/products.md); the full design is in
[spec 001](../specs/001-stock-movements-and-csv.md).
