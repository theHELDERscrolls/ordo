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
