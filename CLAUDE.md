# Ordo

Configurable inventory & restocking platform for small businesses (Master's thesis / TFM). Not an ERP.

## Stack
- Monorepo: `backend/` (Node + Express + TypeScript, MongoDB + Mongoose), `frontend/` (React + TypeScript + Vite, Tailwind with custom components), `docs/`.
- Files/storage: AWS S3. Bot: Telegram. Deploy: Render + MongoDB Atlas.

## Architecture
- Both `frontend/` and `backend/` are organized by domain (DDD-inspired). Grow the structure only when needed — do not scaffold ahead.

## Conventions
- All repository files in English (code, comments, docs).
- Commits follow Conventional Commits and are a single line.

## Git workflow
- `main` and `develop` are protected.
- Branch from `develop`, PR back into `develop`. `develop` → `main` is a release.
- Branch names: `<type>/<issue>-<slug>`, where `<type>` matches the Conventional Commit types (`feat`, `fix`, `refactor`, `docs`, `chore`, `test`, `ci`, `perf`, `style`, `build`). Hotfixes branch from `main` as `hotfix/<slug>`.
- ALWAYS ask the user to confirm before running ANY git command — especially branch create/delete, `add`, `commit`, `push`. The user runs these.

## After each implementation
- Review the docs for what changed, update them, then bump the version accordingly (CHANGELOG + package version).

## Build & test
- Not set up yet. Added per package once dependencies are installed.
```
