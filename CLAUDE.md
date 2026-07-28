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
- Do not use emojis or `---` separator lines in any file. Emojis are allowed only when functionally necessary, never for decoration or headings.

## Agentic workflow
- Logic / backend work: apply the ponytail skill — laziest solution that works, stdlib and native platform features before new dependencies.
- Frontend / UI work: apply the frontend-design skill. Aesthetic is a simple black-and-white web with an invertible theme (light/dark); Tailwind with custom components, no UI component library.

## Git workflow
- `main` and `develop` are protected.
- Branch from `develop`, PR back into `develop`. `develop` → `main` is a release.
- Branch names: `<type>/<issue>-<slug>`, where `<type>` matches the Conventional Commit types (`feat`, `fix`, `refactor`, `docs`, `chore`, `test`, `ci`, `perf`, `style`, `build`). Hotfixes branch from `main` as `hotfix/<slug>`.
- ALWAYS ask the user to confirm before running ANY git command — especially branch create/delete, `add`, `commit`, `push`. The user runs these. This is hard-enforced via the `ask` permission on `Bash(git:*)` and `Bash(gh:*)` in `.claude/settings.json`.

## After each implementation
- Review the docs for what changed, update them, then bump the version accordingly (CHANGELOG + package version).

## Build & test
- Not set up yet. Added per package once dependencies are installed.
```
