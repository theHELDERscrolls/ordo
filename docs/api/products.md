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
