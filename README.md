# Ordo

> Configurable inventory and restocking platform for small businesses.

**Ordo** (from Latin *ordo*: order, organization) is a FullStack application that
lets small businesses centrally manage their operational inventory: products,
stock levels, costs, restocking alerts and related documentation.

The system is designed in an abstract way so it can adapt to different sectors
(hardware stores, workshops, computer shops, associations, warehouses...)
without aiming to become a full ERP.

This project is developed as a **Master's Thesis (TFM)**.

## Project status

**In development.** The catalogue works end to end: an npm-workspaces monorepo, a
shared Zod contract, a login flow with JWT-protected routes and a white-label shell,
the product inventory with its search, filters and dashboard, an append-only stock
movement ledger, and the CSV path in and out of the catalogue. Deployment is next.

## Tech stack

| Layer          | Technology                          |
| -------------- | ----------------------------------- |
| Frontend       | React + TypeScript + Vite           |
| Styling        | Tailwind CSS (custom components)    |
| Backend        | Node.js + Express + TypeScript      |
| Database       | MongoDB + Mongoose                  |
| Deployment     | Render (backend) · Vercel (frontend) · MongoDB Atlas |

Several libraries are used deliberately: Zod (shared validation), React Query,
React Hook Form and Tailwind CSS v4.

## Monorepo structure

The project is organized as an npm-workspaces **monorepo** with a single root
lockfile:

```text
ordo/
├── .github/     Templates, CI/CD and Dependabot configuration
├── shared/      @ordo/shared — Zod contracts shared by backend and frontend
├── backend/     @ordo/backend — REST API (Node.js + Express + TypeScript)
├── frontend/    @ordo/frontend — web client (React + TypeScript + Vite)
└── docs/        Project documentation
```

See the [architecture guide](./docs/architecture.md) for how each package is
organized, and [docs/](./docs/README.md) for the domain guides and the API
reference.

## Getting started

### Prerequisites

- Node.js 24.x and npm. The version is declared as `engines.node` in the
  manifests, and CI, Render and Vercel all read it from there.
- A MongoDB instance. For local development you can run one with Docker:

  ```bash
  docker run -d --name ordo-mongo -p 27017:27017 -v ordo-mongo-data:/data/db mongo
  ```

### Setup

```bash
# 1. Install every workspace's dependencies from the repo root
npm install

# 2. Configure environment variables
cp backend/.env.example backend/.env     # set JWT_SECRET to a long random string
cp frontend/.env.example frontend/.env

# 3. Build the shared contracts, which backend and frontend import as a package
npm run build -w @ordo/shared

# 4. Seed the demo data from backend/seed/*.csv (wipes the development database)
npm run seed -w @ordo/backend
```

Step 3 is only needed once per clone (and after changing `shared/`): `@ordo/shared`
is consumed as a built package, and its output is not committed.

The seed reads four CSV files in `backend/seed/` — business, users, products and
stock movements — so the demo catalogue is edited in a spreadsheet, not in code.

### Run

```bash
npm run dev -w @ordo/backend     # API on http://localhost:3000
npm run dev -w @ordo/frontend    # web client on http://localhost:5173
```

Demo credentials created by the seed, both with the password `ordo1234!`:

| User | Role | What it can do |
| ---- | ---- | -------------- |
| `admin@tallerrodri.com` | `admin` | Everything: the catalogue, the CSV import, the ledger |
| `empleado@tallerrodri.com` | `employee` | Browse the catalogue, export a CSV, record movements |

### Workspace scripts

Run from the repo root; append `-w @ordo/<backend|frontend|shared>` to target a
single package.

```bash
npm run typecheck
npm run lint
npm run build
npm run test
```

## Deployment

The API runs on Render, the web client on Vercel and the database on MongoDB
Atlas, all on their free tiers. The [deployment runbook](./docs/deployment.md)
covers how each host is configured and in what order.

One consequence of the free tier is worth knowing before reporting it as a bug:
a Render service spins down after 15 minutes without traffic, so the first
request after a quiet spell wakes it and can take about a minute. Logging in
after that is immediate.

## Git workflow

A simplified *git-flow* is used, with two protected branches:

```text
feat/*     ─PR→  develop  ─PR→  main
fix/*      ─┘               (release)
chore/*    ─┘
```

- **`main`** — stable / release branch.
- **`develop`** — day-to-day integration branch.
- Every change is merged through a *Pull Request* and must pass the CI pipeline.

## Contributing

Please read the [Contributing Guide](./CONTRIBUTING.md) for the branching model,
commit conventions and workflow. This project also has a
[Code of Conduct](./CODE_OF_CONDUCT.md) and a
[Security Policy](./SECURITY.md).

## License

Distributed under the [MIT](./LICENSE) license.

## Author

**Helder Manuel Vieira Ruiz**
