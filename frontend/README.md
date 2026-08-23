# @ordo/frontend

Web client for Ordo: React + TypeScript + Vite, styled with Tailwind CSS v4.

See the [root README](../README.md) for setup and demo credentials, and the
[architecture guide](../docs/architecture.md) for how the frontend is organized.

## Scripts

```bash
npm run dev        # start the Vite dev server (http://localhost:5173)
npm run build      # type-check and build for production
npm run preview    # preview the production build locally
npm run lint       # run ESLint
npm run typecheck  # type-check without emitting
```

## Structure

- `core/` — cross-cutting concerns (API client, auth session, theme).
- `features/` — screens grouped by domain (auth, dashboard).
- `shared/ui/` — reusable presentational components.

The `@` path alias resolves to `src/`.
