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

### Changed
- Root README now reflects the real state: Cloudinary (not S3) for storage, current project status, and the actual monorepo layout. Replaced the default Vite boilerplate in `frontend/README.md` with a real one.
