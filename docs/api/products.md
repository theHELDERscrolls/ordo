# Product endpoints

All routes require `Authorization: Bearer <token>` and are scoped to the caller's
business. Writes (`POST`/`PATCH`/`DELETE`) require the `admin` role; reads are open
to `admin` and `employee`.

## GET `/products`

List products, filtered, sorted and paginated.

Query params: `search` (name/SKU), `stockStatus` (`in`|`low`|`out`), `category`,
`supplier`, `sort` (`name`|`stock`|`salePrice`|`createdAt`), `order` (`asc`|`desc`),
`page`, `limit`.

Response `200`:

```json
{
  "items": [
    {
      "id": "6a75cacea9c822a914445b60",
      "businessId": "6a75cacd86aa7270ac74f959",
      "name": "Cable USB-C",
      "sku": "A-100",
      "unit": "unit",
      "stock": 3,
      "minStock": 5,
      "costPrice": 10,
      "salePrice": 20,
      "stockStatus": "low",
      "createdAt": "2026-08-07T12:08:46.725Z",
      "updatedAt": "2026-08-07T12:08:46.725Z"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 20
}
```

## GET `/products/facets`

The distinct categories and suppliers across the business, so the UI can fill its
filter dropdowns independently of the paginated list.

Response `200`:

```json
{
  "categories": ["Aceites y lubricantes", "Baterías", "Filtros", "Frenos", "Neumáticos"],
  "suppliers": ["Bosch", "Brembo", "Castrol", "Michelin", "NGK"]
}
```

## GET `/products/export.csv`

The inventory as a spreadsheet. Honours the same query params as `GET /products`
(`search`, `stockStatus`, `category`, `supplier`, `sort`, `order`) and ignores
pagination: you export what you are looking at, not the page you are on.

Response `200`, `Content-Type: text/csv; charset=utf-8`,
`Content-Disposition: attachment; filename="ordo-inventario-2026-08-21.csv"`:

```csv
sku;name;category;supplier;unit;stock;minStock;costPrice;salePrice;description
ACE-001;Aceite motor 5W-30 5L;Aceites y lubricantes;Castrol;unidad;67;10;22,8;38;"Sintético; para gasolina y diésel"
FIL-001;Filtro de aire;Filtros;Bosch;unidad;3;5;5;9;
```

Written the way a Spanish Excel expects it — `;` between fields, `22,8` for the
decimals, and a leading UTF-8 BOM — so the file opens in columns on a double click
instead of through the import wizard. A value containing the delimiter, a quote or
a newline is quoted; a quote inside it is doubled.

The file re-imports as a no-op, so it doubles as the template for
`POST /products/import`, which reads both conventions.

## POST `/products`

Create a product (role `admin`). `businessId` comes from the session, not the body.
A product created with `stock > 0` opens its ledger with an `in` movement, reason
"Stock inicial".

Request body:

```json
{
  "name": "Cable USB-C",
  "sku": "A-100",
  "unit": "unit",
  "stock": 3,
  "minStock": 5,
  "costPrice": 10,
  "salePrice": 20
}
```

`stock`, `minStock`, `costPrice` and `salePrice` default to `0`. `description`,
`category` and `supplier` are optional.

Response `201`:

```json
{
  "id": "6a75cacea9c822a914445b60",
  "businessId": "6a75cacd86aa7270ac74f959",
  "name": "Cable USB-C",
  "sku": "A-100",
  "unit": "unit",
  "stock": 3,
  "minStock": 5,
  "costPrice": 10,
  "salePrice": 20,
  "stockStatus": "low",
  "createdAt": "2026-08-07T12:08:46.725Z",
  "updatedAt": "2026-08-07T12:08:46.725Z"
}
```

Errors: `400` invalid body · `403` not an admin · `409` SKU already exists:

```json
{ "error": "A product with this SKU already exists" }
```

## POST `/products/import`

Bulk load the catalogue from a CSV (role `admin`). The body is the file itself,
sent as `Content-Type: text/csv` (up to 1 MB, around 8000 rows).

Query params:

| Param | Values | Default | Meaning |
|---|---|---|---|
| `dryRun` | `true`\|`false` | `true` | `true` validates and reports without writing anything |
| `quantityMode` | `set`\|`add` | `set` | What the `stock` column means |

Rules:

- The field delimiter is detected from the header, `;` or `,`, because Excel writes
  the one its locale uses. A decimal may be written `22.8` or `22,8`; a number
  carrying both marks (`1.234,56`) is ambiguous and is reported by line rather than
  guessed at. A leading BOM is stripped.
- Identity is `(businessId, sku)`, the pair the unique index enforces: a known SKU
  updates, an unknown one creates.
- Only the columns the file fills are written. A column that is missing or empty
  leaves that field as it is, so a two-column `sku,name` file renames products
  without flattening their prices. A create still needs `name`, `sku` and `unit`.
- `quantityMode=set` writes the `stock` column as the new stock and records an
  `adjust` of the size of the correction; `add` adds it to the current stock and
  records an `in` of the increment. Either way the reason is "Importación CSV".
- A row that fails validation is reported with its line number (the header is line
  1) and skipped; it never aborts the rest of the file. Two rows for the same SKU
  are a mistake in the file: the second is reported, not applied.
- A dry run reports the same counts the real run then produces.

Request body:

```csv
sku;name;category;supplier;unit;stock;minStock;costPrice;salePrice;description
ACE-001;Aceite motor 5W-30 5L;Aceites y lubricantes;Castrol;unidad;25;10;22,8;38;
ROT-001;Rótula de dirección;Dirección;SKF;unidad;7;2;12;25;
BAD-001;Sin unidad;;;;5;1;1;2;
```

Response `200`:

```json
{
  "dryRun": true,
  "total": 3,
  "created": 1,
  "updated": 1,
  "skipped": 1,
  "errors": [
    {
      "row": 4,
      "sku": "BAD-001",
      "message": "unit: Invalid input: expected string, received undefined"
    }
  ]
}
```

Errors: `400` no header, or no `sku` and `name` columns · `403` not an admin ·
`415` the body was not sent as `text/csv` · `413` over 1 MB.

```json
{ "error": "The CSV needs a header with sku and name, and at least one row" }
```

## GET `/products/:id`

Returns one product (same shape as the `POST` response).

Errors: `404` not found, or not in the caller's business.

## PATCH `/products/:id`

Update a subset of fields (role `admin`). Returns the updated product.

Request body (any subset of the creatable fields). Fields that are not sent are
left as they are:

```json
{ "stock": 12, "salePrice": 18 }
```

A body that changes `stock` also records an `adjust` movement in the ledger, whose
quantity is the size of the correction. See [movements.md](movements.md).

Errors: `400` invalid body · `403` not an admin · `404` not found · `409` SKU
already exists.

## DELETE `/products/:id`

Delete a product (role `admin`). Its stock movements are deleted with it: a ledger
against something that no longer exists explains nothing.

Response `204`: no content (empty body).

Errors: `403` not an admin · `404` not found.
