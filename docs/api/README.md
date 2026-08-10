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
| `409` | Conflict — a product with that SKU already exists in the business |

## Health

`GET /health` — liveness check, no authentication. Returns `200 { "status": "ok" }`.

## Endpoints by domain

| File | Endpoints |
|------|-----------|
| [auth.md](auth.md) | Login · Current session |
| [products.md](products.md) | List (search/filter/sort) · Create · Read · Update · Delete |
| [dashboard.md](dashboard.md) | Inventory stats snapshot |
