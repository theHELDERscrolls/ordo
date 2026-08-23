# API reference

Base URL in development: `http://localhost:3000`.

## Authentication

Every endpoint except `POST /auth/login` and `GET /health` requires a valid access
token in every request:

```
Authorization: Bearer <token>
```

The token is issued by `POST /auth/login`. Inventory endpoints are additionally
scoped to the caller's business: you only ever see or modify your own tenant's data.

## Common error codes

| Code | Meaning |
|------|---------|
| `400` | Validation error or malformed request body |
| `401` | Token missing, invalid or expired — re-authenticate |
| `403` | Authenticated but not allowed (e.g. a write attempted by a non-`admin`) |
| `404` | Resource not found, or it belongs to another business |
| `409` | Conflict — a product with that SKU already exists, or an exit exceeds the stock available |
| `413` | Body too large — a CSV import over 1 MB |
| `415` | Wrong media type — a CSV import not sent as `text/csv` |

## Health

`GET /health` — liveness check, no authentication. Returns `200 { "status": "ok" }`.

## Endpoints by domain

| File | Endpoints |
|------|-----------|
| [auth.md](auth.md) | Login · Current session |
| [products.md](products.md) | List (search/filter/sort) · Facets · CSV export · CSV import · Create · Read · Update · Delete |
| [movements.md](movements.md) | Stock ledger: history (filtered) · Record an entry or an exit |
| [dashboard.md](dashboard.md) | Inventory stats snapshot and value breakdown |

Why each domain behaves the way it does is in its
[domain guide](../domains/); this reference only states the HTTP surface.

## OpenAPI

[`openapi.yaml`](openapi.yaml) is the OpenAPI 3.1 contract — the standard, visual
reference. Open it at [editor.swagger.io](https://editor.swagger.io) (drag the file
in) or any Swagger UI to browse every endpoint, schema and example and try requests
inline. It is maintained by hand, so keep it in sync when the API changes.

## Postman

Import [`ordo-postman-collection.json`](ordo-postman-collection.json) into Postman to
try every endpoint. Run **Auth > Login** first — it stores the JWT in the `token`
collection variable, which the other requests send as a Bearer token.
