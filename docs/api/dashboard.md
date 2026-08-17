# Dashboard endpoints

Requires `Authorization: Bearer <token>` and is scoped to the caller's business.

## GET `/dashboard/stats`

The inventory snapshot for the dashboard panel: figures computable from the current
inventory alone (no historical stock movements yet). `inventoryValue` is the sum of
`stock * costPrice` across the business's products.

Response `200`:

```json
{
  "productCount": 2,
  "lowStockCount": 1,
  "outOfStockCount": 1,
  "inventoryValue": 30
}
```

## GET `/dashboard/inventory-breakdown`

Where the inventory's capital sits, for the panel's two charts. One aggregation
computes the three views over the same `stock * costPrice` figure, so the client gets
both charts in a single round trip and they cannot disagree about the total they are
shares of.

- `byCategory` — every category with its accumulated value and how many products it
  holds, highest value first. Products with no category (absent or empty) share a
  single bucket whose `category` is `""`; the label is the UI's to choose.
- `topProducts` — the products ranked by value, highest first, capped at 20 and
  excluding anything worth nothing. The tail of a value ranking is flat by
  definition, so sending it would only cost payload.
- `productCount` counts the whole catalogue, including products excluded from
  `topProducts`, which is what makes "20 of 44 references" a meaningful reading.

Response `200`:

```json
{
  "totalValue": 10272.6,
  "productCount": 44,
  "byCategory": [
    { "category": "Frenos", "value": 4180.5, "productCount": 12 },
    { "category": "Filtros", "value": 2610, "productCount": 9 },
    { "category": "", "value": 318.1, "productCount": 3 }
  ],
  "topProducts": [
    { "id": "66b1f0a2c3d4e5f6a7b8c9d0", "name": "Disco de freno ventilado", "sku": "FR-104", "value": 1240 },
    { "id": "66b1f0a2c3d4e5f6a7b8c9d1", "name": "Pastillas de freno cerámicas", "sku": "FR-221", "value": 980.4 }
  ]
}
```
