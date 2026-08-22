# Stock movement endpoints

All routes require `Authorization: Bearer <token>` and are scoped to the caller's
business. Both reading and recording are open to `admin` and `employee`, which is
the one place the app's usual split does not apply: the person behind the counter is
the one who moves the stock, and a shop where every sale waits for the owner is a
shop that stops recording sales. The catalogue itself — prices, the reorder point,
creating and deleting products, importing a CSV — stays `admin`.

The ledger is append-only: there is no `PATCH` and no `DELETE`. A mistake is
corrected by recording the opposing movement, which is the whole point of having an
audit trail. A product's movements are removed only when the product itself is
deleted.

## GET `/movements`

The business's history, newest first, paginated.

Query params: `productId` (one product's own history), `type` (`in`|`out`|`adjust`),
`from` and `to` (ISO dates, both inclusive — a bare `YYYY-MM-DD` in `to` covers that
whole day), `page`, `limit` (max 100).

The product's name and SKU and the author's name are resolved server-side, so a
history table needs a single request.

Response `200`:

```json
{
  "items": [
    {
      "id": "6a75cad0a9c822a914445c31",
      "businessId": "6a75cacd86aa7270ac74f959",
      "productId": "6a75cacea9c822a914445b60",
      "productName": "Filtro de aceite",
      "productSku": "FIL-001",
      "type": "out",
      "quantity": 4,
      "resultingStock": 96,
      "reason": "Venta en mostrador",
      "userId": "6a75cacd86aa7270ac74f95c",
      "userName": "Administrador",
      "createdAt": "2026-08-19T09:14:02.118Z"
    }
  ],
  "total": 219,
  "page": 1,
  "limit": 20
}
```

`400` if `productId` is not a valid id: answering with the whole history to someone
who asked for one product would be worse than refusing.

## POST `/movements`

Record an entry or an exit (any role). The stock and the ledger move together, in
one request.

Only `in` and `out` are accepted. An `adjust` is written by the system when a
correction arrives through another path (editing the stock in the product form, or a
CSV import), so it can never be declared by a client.

Request body:

```json
{
  "productId": "6a75cacea9c822a914445b60",
  "type": "out",
  "quantity": 4,
  "reason": "Venta en mostrador"
}
```

`quantity` is always positive; the sign is carried by `type`. `reason` is optional
and capped at 120 characters.

Response `201`: the recorded movement, in the shape above.

| Code | Meaning |
|------|---------|
| `400` | Invalid body — unknown `type`, `quantity` not positive |
| `404` | The product is not in the caller's business |
| `409` | `{ "error": "Insufficient stock" }` — the exit exceeds what is available |

An `out` that exceeds the stock leaves the stock untouched: the availability check
and the decrement are a single atomic update, so two concurrent exits cannot both
pass the check and drive the stock negative.

## Movements written by other endpoints

Every path that changes `Product.stock` records its own movement, in the same
request, so the ledger explains every number the catalogue shows:

| Trigger | Movement | Reason |
|---|---|---|
| `POST /products` with `stock > 0` | `in` | "Stock inicial" |
| `PATCH /products/:id` that changes `stock` | `adjust`, quantity `abs(new - old)` | "Ajuste manual" |
| `DELETE /products/:id` | none — the product's movements are deleted with it | |
