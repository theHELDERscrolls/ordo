# Dashboard endpoints

Requires `Authorization: Bearer <token>` and is scoped to the caller's business.

## GET `/dashboard/stats`

The inventory snapshot for the dashboard panel: figures computable from the current
inventory alone (no historical stock movements yet). `inventoryValue` is the sum of
`stock * costPrice` across the business's products.

Response `200`:

```json
{
  "productCount": 132,
  "lowStockCount": 17,
  "outOfStockCount": 4,
  "inventoryValue": 25177.8
}
```

The examples on this page are the figures the seed data produces, so a fresh
`npm run seed -w @ordo/backend` answers with exactly these.

## GET `/dashboard/inventory-breakdown`

Where the inventory's capital sits, for the panel's two charts. One aggregation
computes the three views over the same `stock * costPrice` figure, so the client gets
both charts in a single round trip and they cannot disagree about the total they are
shares of.

- `byCategory` — every category with its accumulated value and how many products it
  holds, highest value first. Products with no category (absent or empty) share a
  single bucket whose `category` is `""`; the label is the UI's to choose. The seed
  data gives every product a category, so that bucket does not appear below.
- `topProducts` — the products ranked by value, highest first, capped at 20 and
  excluding anything worth nothing. The tail of a value ranking is flat by
  definition, so sending it would only cost payload.
- `productCount` counts the whole catalogue, including products excluded from
  `topProducts`, which is what makes "20 of 132 references" a meaningful reading.

Response `200` (truncated: 20 categories and 20 products come back):

```json
{
  "totalValue": 25177.8,
  "productCount": 132,
  "byCategory": [
    { "category": "Aceites y lubricantes", "value": 3467.4, "productCount": 12 },
    { "category": "Neumáticos", "value": 2886.6, "productCount": 10 },
    { "category": "Encendido", "value": 2373.6, "productCount": 6 },
    { "category": "Filtros", "value": 1455, "productCount": 8 }
  ],
  "topProducts": [
    { "id": "6a75cacea9c822a914445b60", "name": "Aceite motor 5W-30 5L", "sku": "ACE-001", "value": 912 },
    { "id": "6a75cacea9c822a914445b61", "name": "Bujía de iridio", "sku": "ENC-001", "value": 864 },
    { "id": "6a75cacea9c822a914445b62", "name": "Bujía estándar", "sku": "ENC-002", "value": 600 }
  ]
}
```
