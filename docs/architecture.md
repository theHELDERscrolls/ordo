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
│   ├── auth/       login, JWT, Bearer + role middleware, password hashing
│   ├── business/   Business Mongoose model (embedded branding)
│   ├── user/       User model (bcrypt, businessId) + getAccessibleBusinessIds
│   ├── product/    Product model + inventory CRUD and list API
│   └── dashboard/  inventory stats endpoint
├── types/      Express request augmentation (req.userId, req.user)
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
│   ├── auth/       session context, RequireAuth, useToken
│   ├── hooks/      generic hooks (useDebounce)
│   └── theme/      light/dark theme hook
├── features/   screens grouped by domain
│   ├── auth/       LoginPage
│   ├── dashboard/  DashboardPage
│   ├── inventory/  list, product form, and product query/mutation hooks
│   └── settings/   theme, language, business, log out
└── shared/ui/  AppLayout (the nav shell) + reusable components (Button, Select,
                ConfirmDialog, RowLink, StockBadge, TextField, ThemeToggle)
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

## Inventory

The Product domain is the app's core. A `Product` belongs to a business
(`businessId`) and is identified within it by `sku` (compound unique index
`businessId + sku`), which is the identity a future CSV import will upsert on. Key
fields: `name`, `sku`, `category`, `supplier`, `unit`, `stock`, `minStock`
(reorder point), `costPrice`, `salePrice`, `imageUrl`.

`stockStatus` is derived, never stored: `out` when stock is 0, `low` when
`0 < stock <= minStock`, otherwise `in`. It is a Mongoose virtual, so the reorder
threshold lives in one place and drives both the list badge and the dashboard
counts.

Access is role-aware and tenant-scoped. Every query is filtered by
`getAccessibleBusinessIds(user)` (today the user's own business), so one tenant
never sees another's products. Writes (`POST`/`PATCH`/`DELETE`) require the
`admin` role; reads are open to `admin` and `employee`. The `loadUser` middleware
attaches the user (id, businessId, role) after `requireAuth`.

The list is paginated and filterable (search, stock status, category, supplier,
sort with direction); a `GET /products/facets` endpoint returns the distinct
categories and suppliers so the UI fills its filters independently of the current
page.

## HTTP API reference

The REST API has its own home under [`api/`](./api/README.md): base URL,
authentication, common error codes, and every endpoint with request/response JSON
examples.
