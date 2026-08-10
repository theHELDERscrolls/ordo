# Ordo documentation

Living documentation for Ordo. Each document is the single source of truth for
its topic. To stay coherent as the app grows, a topic starts as a section and is
only extracted into its own file once that section becomes too large to belong
where it is. Files are not created empty ahead of need.

## Index

- [Architecture](./architecture.md) — monorepo layout, domain organization, the
  authentication flow, and the inventory domain (data model, roles, stock status).
- [API reference](./api/README.md) — every HTTP endpoint with request/response
  JSON examples.

## Where else things are documented

- [Root README](../README.md) — project overview, tech stack, and how to run it.
- [CHANGELOG](../CHANGELOG.md) — released and unreleased changes.
- [Contributing guide](../CONTRIBUTING.md) — branching model, commits, PR flow.
- `@ordo/shared` — the Zod contracts are the source of truth for data shapes, so
  they are not duplicated as prose here.
