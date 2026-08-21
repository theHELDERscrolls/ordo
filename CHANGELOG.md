# Changelog

All notable changes to Ordo are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and the project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- npm workspaces monorepo (`shared`, `backend`, `frontend`) with a single root lockfile.
- `@ordo/shared` contract package (Zod) consumed by `backend` and `frontend`, wired with TypeScript project references so a contract change breaks compilation on both sides.
- Backend foundation: Express, Mongoose, CORS, Zod; compiled build (`tsc` to `dist`, `node dist`), `tsx` dev runner, ESLint flat config, `.env.example`, and a `/health` endpoint.
- Frontend foundation: Tailwind v4 (Vite plugin), React Router, React Query, React Hook Form, lucide-react.
- Shared tooling: root Prettier config (with Tailwind class sorting), Vitest per package.
- CI jobs (install, lint, typecheck, build, test) and a consolidated root Dependabot npm entry.
- Authentication: `POST /auth/login` issuing a JWT, Bearer-guarded routes with a sample `GET /auth/me`, and a development bootstrap seed.
- Domain data layer: Mongoose models for `Business` (with embedded branding) and `User`, mirroring the shared Zod contracts.
- Login UI: login page (React Hook Form + Zod), session context (`useReducer`/`useContext`), protected routing, and per-tenant white-label theming with a persistent light/dark toggle.
- Domain-oriented layout: backend `modules/`, frontend `core`/`features`/`shared`, and a `@` path alias on the frontend.
- Project documentation: a living `docs/` (index, architecture guide, and an `api/` reference with request/response JSON per endpoint) and a Getting started section in the root README.
- Inventory backend: `Product` domain (Zod contract, Mongoose model with a per-business unique SKU and a derived `stockStatus`), role-aware CRUD API with search/filter/sort/pagination, and a `GET /dashboard/stats` snapshot. `employee` is read-only; `admin` manages.
- Developer tooling: a `ship-pr` skill (`/ship-pr`) that automates the git-flow — logical commit split, CHANGELOG/version check, and a PR from the template.
- Inventory & settings UI: the inventory screen (debounced search, faceted category/supplier filters, stock-status chips, sortable columns with direction, pagination), a product create/edit form with a custom confirmation dialog, a read-only view for `employee`, a Settings section (theme, language, business, log out), the navigation shell, and reusable UI (`Button`, `Select`, `ConfirmDialog`, `RowLink`, `StockBadge`). Space Grotesk display font via CSS.
- Inventory facets endpoint (`GET /products/facets`) for filter values, plus a wider auto-parts seed with an `employee` user.
- Dashboard panel: four stat cards (product count, inventory value, low stock, out of stock) reading `GET /dashboard/stats`, with the stock cards deep-linking into the inventory pre-filtered by that status. The inventory's stock filter now lives in the URL (`?stockStatus=low|out`) so it can be linked to.
- Inventory value breakdown endpoint (`GET /dashboard/inventory-breakdown`): value and product count per category, plus the products ranked by value, all from a single `$facet` aggregation.
- Two panel charts built on Recharts: capital by category (ranked horizontal bars, tail folded into "Otras") and capital concentration (running share of value across the ranked products, on one axis, with the 80% ABC reference line). Both are single-series and monochrome, coloured from the theme tokens so they follow the light/dark toggle. Recharts is isolated in a lazily loaded chunk so it stays out of the entry bundle.
- Reusable `StatCard`: a container-query card whose figure scales with the card's own width, so the same component fits two columns on a phone and four on a tablet.
- Product detail dialog: a row now opens the product's read-only sheet — stock as the headline figure, prices, reorder point, category, supplier and description — with Edit and Delete for `admin` only. The open product lives in the URL (`?product=<id>`), so a sheet is linkable and the phone's back button closes it.
- `Modal`, the app's base modal, built on the native `<dialog>`: `showModal()` supplies the focus trap, Escape, the top layer and an inert, unscrollable background, so the component only adds the shape — a sheet rising from the bottom edge on a phone, a centred panel from `sm` up — and an entrance that slides in on `translate` alone. Closing is immediate.

- Design specs live in `docs/specs/`, written before the work starts. The first one covers the stock movement ledger and the CSV import/export path.
- Stock movement ledger: a `StockMovement` model (`in`/`out`/`adjust`, an unsigned quantity, the `resultingStock` it left behind, the reason, and who did it), indexed for the business history and for a product's own sheet. Append-only, so it has a creation date and no update date. The API and the UI come in the next phases.
- CSV read/write in `backend/src/lib/csv.ts` with no dependency: quoted fields, `""` escapes, commas and newlines inside quotes, `CRLF`, the BOM Excel writes, and blank lines, plus tests for each of those and a round trip.

### Changed
- Product images are out of scope: `imageUrl` is gone from the contract, the model and the detail dialog, and the Cloudinary/S3 mentions with it. Storage was optional and the app has no use for it that justifies the surface. The Telegram bot is dropped for the same reason: the inventory's own filters already answer what it would have answered.
- Tapping a product no longer jumps into the edit form: it opens the detail dialog, and it does so for `employee` too, which until now had no way to see a product's detail at all. Deleting moved out of the product form's header and into that dialog, leaving a single place to delete from, `ConfirmDialog` is rebuilt on `Modal`, and `RowLink` goes with its last caller. Saving the product form now returns to that product's sheet rather than to the bare list, so a change lands in view; a create ends on the product it just made.
- Root README now reflects the real state: current project status and the actual monorepo layout. Replaced the default Vite boilerplate in `frontend/README.md` with a real one.
- Aligned the versioning policy in `CLAUDE.md` (no version bump on `develop`; bump, seal and tag only at release).
- ESLint configs set `tsconfigRootDir` to disambiguate the monorepo TSConfig root; `PATCH /products` uses `returnDocument: 'after'` (Mongoose 9 deprecation).
- Documentation pass over the whole codebase: prose comments condensed and rewritten as TSDoc on the exported symbols (contracts, hooks, components, middleware, routes), leaving inline comments only where they explain a decision that has no exported symbol to hang from.
- The dashboard's charting layer moved into `features/dashboard/charts/`, so the folder boundary matches the lazily loaded Recharts chunk boundary.
- The reorder threshold now lives only in `product.status.ts`, as a predicate for loaded documents and a matching MongoDB expression for queries. The model's `stockStatus` virtual, the inventory's stock filter and the panel's low/out counts all read it instead of restating it, and a test evaluates the two encodings against each other so they cannot drift.
- The backend's `npm test` no longer runs the compiled copies of the tests in `dist/`. After a build every test was being executed twice, once against JavaScript that a later edit could leave stale, which reported 38 tests where there are 19. The test files are still typechecked, since they stay in the build.
- The Node version is declared once, as `engines.node` in the three manifests, and CI reads it from there (`node-version-file`) instead of pinning its own copy. Render and Vercel honour the same field, so the runtime cannot drift from the one the pipeline tests on.
- The seed no longer holds the catalogue as TypeScript literals: it reads `backend/seed/*.csv` with `node:fs` and resolves the natural keys (`slug`, `email`, `sku`) to ObjectIds. The demo data grew with it, from 45 products to 132 plus 218 movements, and each product's stock is now the result of replaying its own ledger from an opening balance rather than a number typed into the file.
