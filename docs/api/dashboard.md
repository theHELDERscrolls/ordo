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
