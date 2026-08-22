# Ordo documentation

Living documentation for Ordo. Each document is the single source of truth for
its topic. To stay coherent as the app grows, a topic starts as a section and is
only extracted into its own file once that section becomes too large to belong
where it is. Files are not created empty ahead of need.

## Index

- [Architecture](./architecture.md) — monorepo layout, domain organization, the
  authentication flow, the inventory domain (data model, roles, stock status), the
  stock movement ledger, the CSV path in and out of the catalogue, and how the
  seed is built from CSV files.
- [API reference](./api/README.md) — every HTTP endpoint with request/response
  JSON examples.
- [Specs](./specs/) — what is designed but not yet built. A spec is written before
  the work starts, and once shipped the architecture and API docs carry the truth;
  the spec stays as the record of why it was built that way.

## Where else things are documented

- [Root README](../README.md) — project overview, tech stack, and how to run it.
- [CHANGELOG](../CHANGELOG.md) — released and unreleased changes.
- [Contributing guide](../CONTRIBUTING.md) — branching model, commits, PR flow.
- `@ordo/shared` — the Zod contracts are the source of truth for data shapes, so
  they are not duplicated as prose here.
