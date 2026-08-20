# Ordo

Configurable inventory & restocking platform for small businesses (Master's thesis / TFM). Not an ERP.

## Stack
- Monorepo: `backend/` (Node + Express + TypeScript, MongoDB + Mongoose), `frontend/` (React + TypeScript + Vite, Tailwind with custom components), `docs/`.
- Deploy: Render (backend) + Vercel (frontend) + MongoDB Atlas.

## Architecture
- Both `frontend/` and `backend/` are organized by domain (DDD-inspired). Grow the structure only when needed — do not scaffold ahead.

## Conventions
- All repository files in English (code, comments, docs).
- Commits follow Conventional Commits and are a single line.
- Do not use emojis or `---` separator lines in any file. Emojis are allowed only when functionally necessary, never for decoration or headings.
- Never attribute commits, PRs, or any content to Claude or AI: no `Co-Authored-By` trailers, no "Generated with" lines, no AI mentions anywhere.

## Agentic workflow
- Logic / backend work: apply the ponytail skill — laziest solution that works, stdlib and native platform features before new dependencies.
- Frontend / UI work: apply the frontend-design skill. The app is mobile-first: design for small screens first, then layer on larger breakpoints. Aesthetic is a simple black-and-white web with an invertible theme (light/dark); Tailwind with custom components, no UI component library.

## Git workflow
- `main` and `develop` are protected.
- Branch from `develop`, PR back into `develop`. `develop` → `main` is a release.
- Branch names: `<type>/<issue>-<slug>`, where `<type>` matches the Conventional Commit types (`feat`, `fix`, `refactor`, `docs`, `chore`, `test`, `ci`, `perf`, `style`, `build`). Hotfixes branch from `main` as `hotfix/<slug>`.
- ALWAYS ask the user to confirm before running ANY git command — especially branch create/delete, `add`, `commit`, `push`. The user runs these. This is hard-enforced via the `ask` permission on `Bash(git:*)` and `Bash(gh:*)` in `.claude/settings.json`.
- To commit and open PRs, apply the `ship-pr` skill: it splits changes into logical commits, keeps the CHANGELOG and version aligned with the release policy, and opens the PR from the template.

## After each implementation
- Verify it works before claiming done: do not assume. Run a clean rebuild (clear the build output, then `npm run build`) so the result is reproducible and not a stale artifact, and then exercise the real behavior (run the app / hit the endpoint via the verify or run skill), not just typecheck. Report failures with their actual output; never report a path as done without running it.
- Review the docs for what changed and update them, and record the change under CHANGELOG `[Unreleased]`. Do not bump the version on `develop`: the version bump, sealing `[Unreleased]` into `[X.Y.Z]`, and the `vX.Y.Z` tag happen only at release (`develop` → `main`).

## Build & test
- Workspace-wide from the repo root: `npm run typecheck`, `npm run lint`, `npm run build`, `npm run test`. Single package: append `-w @ordo/<backend|frontend|shared>`.
- Dev runners: `npm run dev -w @ordo/backend` (tsx watch), `npm run dev -w @ordo/frontend` (vite).
- Remove `--passWithNoTests` from a package once it has its first test, so "no tests found" fails loudly again.
```
