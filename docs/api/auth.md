# Auth endpoints

## POST `/auth/login`

Authenticate and open a session. Public — no token required.

Request body:

```json
{ "email": "admin@tallerrodri.com", "password": "ordo1234!" }
```

Response `200`:

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "6a75cacd86aa7270ac74f95b",
    "businessId": "6a75cacd86aa7270ac74f959",
    "email": "admin@tallerrodri.com",
    "name": "Administrador",
    "role": "admin"
  },
  "business": {
    "id": "6a75cacd86aa7270ac74f959",
    "name": "Taller Rodri",
    "slug": "taller-rodri",
    "branding": { "accentColor": "#d62828" }
  }
}
```

Errors: `400` invalid body · `401` invalid email or password.

## GET `/auth/me`

Return the current user and business. Requires `Authorization: Bearer <token>`.

Response `200`:

```json
{
  "user": {
    "id": "6a75cacd86aa7270ac74f95b",
    "businessId": "6a75cacd86aa7270ac74f959",
    "email": "admin@tallerrodri.com",
    "name": "Administrador",
    "role": "admin"
  },
  "business": {
    "id": "6a75cacd86aa7270ac74f959",
    "name": "Taller Rodri",
    "slug": "taller-rodri",
    "branding": { "accentColor": "#d62828" }
  }
}
```

Errors: `401` missing or invalid token · `404` user not found.
