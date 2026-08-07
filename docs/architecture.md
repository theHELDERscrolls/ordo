# Architecture

How Ordo is put together. This is a living document: it grows as features land,
and a section is extracted into its own file once it outgrows this one.

## Monorepo

Ordo is an npm-workspaces monorepo with a single root lockfile:

```text
ordo/
├── shared/     @ordo/shared  — Zod contracts shared by backend and frontend
├── backend/    @ordo/backend — REST API (Node + Express + TypeScript)
├── frontend/   @ordo/frontend — web client (React + TypeScript + Vite)
└── docs/        project documentation
```

`shared` holds the Zod schemas that define every data shape (Business, User,
login request/response, roles). Both `backend` and `frontend` depend on it and
are wired through TypeScript project references, so a change to a contract breaks
compilation on both sides instead of drifting silently. Public shapes never
include secrets such as `passwordHash`.

## Backend

Organized by domain (DDD-inspired), grown only as needed:

```text
backend/src/
├── config/     env parsing and the MongoDB connection
├── modules/    one folder per domain
│   ├── auth/       login, JWT signing, Bearer middleware, password hashing
│   ├── business/   Business Mongoose model (embedded branding)
│   └── user/       User Mongoose model (bcrypt hash, businessId)
├── types/      Express request augmentation (req.userId)
├── seed.ts     dev-only bootstrap of one Business + admin user
└── index.ts    app wiring; connects to Mongo before listening
```

Mongoose models mirror the shared Zod contracts. The server connects to MongoDB
before accepting traffic and fails loudly if the database is unreachable.

## Frontend

Organized into cross-cutting core, domain features, and shared UI:

```text
frontend/src/
├── core/       cross-cutting concerns
│   ├── api/        HTTP client
│   ├── auth/       session context (useReducer + useContext), RequireAuth
│   └── theme/      light/dark theme hook
├── features/   screens grouped by domain
│   ├── auth/       LoginPage
│   └── dashboard/  DashboardPage (branded shell)
└── shared/ui/  reusable presentational components (TextField, ThemeToggle)
```

The `@` path alias resolves to `src/`. Styling is Tailwind CSS v4 with semantic
tokens defined in `index.css`: three neutral layers plus one accent, mapped via
`@theme` so the light/dark swap and the per-tenant accent both work as CSS
variables. The app is mobile-first.

## Multi-tenant and white-label

One deployment, one database; every tenant-scoped document carries a
`businessId`. The tenant is resolved from the logged-in user's `businessId` (not
from a URL or subdomain): the login page is generic Ordo, and the business brand
(name, accent color, and a muted "by Ordo") is applied after login. There is no
public signup. This keeps a single-business deployment identical to a multi-tenant
one; multi-tenancy is extra credit, not a requirement.

## Authentication flow

1. The client posts credentials to `POST /auth/login`.
2. The backend validates the body with the shared `loginSchema`, looks up the
   user, and verifies the password against the bcrypt hash. Unknown email and
   wrong password return the same generic 401 so emails cannot be probed.
3. On success it signs a JWT for the user id and returns the token plus the
   resolved tenant context (user + business) so the frontend can theme itself.
4. The client stores the token and sends it as a `Bearer` header. The
   `requireAuth` middleware verifies it and populates `req.userId` for protected
   routes such as `GET /auth/me`.

## HTTP API reference

Base URL in development: `http://localhost:3000`.

### `GET /health`

Liveness check. Returns `200 { "status": "ok" }`. No authentication.

### `POST /auth/login`

Authenticate and open a session.

- Body: `{ "email": string, "password": string }`.
- `200`: `{ "token": string, "user": User, "business": Business }`.
- `400`: invalid request body. `401`: invalid email or password.

### `GET /auth/me`

Return the current user and business. Requires `Authorization: Bearer <token>`.

- `200`: `{ "user": User, "business": Business | null }`.
- `401`: missing or invalid token. `404`: user not found.
