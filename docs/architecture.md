# Architecture

How Ordo is put together: the shape of the repository and of each package. What
each domain does and why it does it that way lives in its own document, listed at
the end.

## Monorepo

Ordo is an npm-workspaces monorepo with a single root lockfile:

```text
ordo/
├── .github/    CI, issue and PR templates, Dependabot
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

The Node version is declared once, as `engines.node` in the three manifests. CI
reads it from there (`node-version-file`) and Render and Vercel honour the same
field, so the runtime cannot drift from the one the pipeline tests on.

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
│   ├── movement/   StockMovement model + the stock ledger API
│   └── dashboard/  inventory stats snapshot + value breakdown endpoints
├── lib/        dependency-free helpers shared across modules (CSV read/write)
├── types/      Express request augmentation (req.userId, req.user)
├── seed.ts     dev-only bootstrap, built from backend/seed/*.csv
└── index.ts    app wiring; connects to Mongo before listening
```

Mongoose models mirror the shared Zod contracts. The server connects to MongoDB
before accepting traffic and fails loudly if the database is unreachable.

## Frontend

Organized into cross-cutting core, domain features, and shared UI:

```text
frontend/src/
├── core/       cross-cutting concerns
│   ├── api/        HTTP client (apiFetch, apiDownload, toQuery)
│   ├── auth/       session context, RequireAuth, useToken
│   ├── hooks/      generic hooks (useDebounce, usePage, useUrlParams)
│   └── theme/      light/dark theme hook
├── features/   screens grouped by domain
│   ├── auth/       LoginPage
│   ├── dashboard/  DashboardPage + its data hooks, charts/ for the Recharts layer
│   ├── inventory/  list, detail dialog, product form, CSV import/export, and hooks
│   ├── movements/  the ledger page, its filters, the register dialog and its hooks
│   └── settings/   theme, language, business, log out
└── shared/     what any feature may use
    ├── format.ts   money, dates, relative time
    └── ui/         Page, AppLayout (the nav shell) and the reusable components
```

The `@` path alias resolves to `src/`.

### Styling

Tailwind CSS v4 with semantic tokens defined in `index.css` and mapped through
`@theme`, so they exist as CSS variables and as utilities:

| Tokens | What they cover |
|---|---|
| `--bg`, `--surface`, `--surface-2`, `--fg`, `--fg-muted`, `--border` | the three neutral layers, inverted by the `.dark` class on `<html>` |
| `--accent`, `--accent-fg` | the tenant's own colour, set at runtime after login |
| `--font-display` | Space Grotesk, for headings and the brand |
| `--spacing-page-x`, `--spacing-page-y` | the frame every screen sits in |

The app is mobile-first: each screen is designed for the narrow viewport and
layered up at `sm` and `md`.

A handful of shared pieces exist because the same thing was being written on more
than one screen, never ahead of that: `Page`/`PageHeader` (the only place the page
frame is applied), `FilterChips`, `ListState`, `Pagination`, and the class helpers
`buttonClasses`, `fieldClasses` and `tableHeadClasses`, which let a `<Link>` or a
native `<input>` look exactly like its component counterpart instead of restating
its classes.

Two hooks carry the list behaviour both the inventory and the ledger need:
`useUrlParams` keeps a list's filters in the query string — so a filtered view is
shareable and the phone's back button walks it — and `usePage` returns to the first
page whenever those filters change.

## Domains

- [Tenancy and authentication](./domains/auth.md) — how a request is scoped to one
  business, the login flow, and what each role may do.
- [Inventory](./domains/inventory.md) — the Product model, the derived stock
  status, the list and the catalogue's UI.
- [Stock movements](./domains/movements.md) — the append-only ledger, every path
  that moves stock, and why an employee may write to it.
- [CSV](./domains/csv.md) — the dependency-free parser, the import and export path,
  and the seed built from the same files.
- [Dashboard panel](./domains/dashboard.md) — the four figures and the two charts.

## HTTP API reference

The REST API has its own home under [`api/`](./api/README.md): base URL,
authentication, common error codes, and every endpoint with request/response JSON
examples.
