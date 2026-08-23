# Ordo documentation

Living documentation for Ordo. Each document is the single source of truth for
its topic, and topics are kept apart rather than piled into one file: structure in
the architecture guide, behaviour in the domain it belongs to, the HTTP surface in
the API reference. Files are not created empty ahead of need.

## Index

- [Architecture](./architecture.md) — the monorepo, how each package is organized,
  and the styling tokens. Start here.
- [Domains](./domains/) — one document per domain, each explaining what it does
  and why it was built that way:
  - [Tenancy and authentication](./domains/auth.md)
  - [Inventory](./domains/inventory.md)
  - [Stock movements](./domains/movements.md)
  - [CSV](./domains/csv.md)
  - [Dashboard panel](./domains/dashboard.md)
- [API reference](./api/README.md) — every HTTP endpoint with request/response
  JSON examples, plus the OpenAPI contract and a Postman collection.
- [Deployment](./deployment.md) — the runbook for MongoDB Atlas, Render and
  Vercel: what each host is configured with, in which order, and why.
- [Specs](./specs/) — what is designed but not yet built. A spec is written before
  the work starts, and once shipped the architecture, domain and API docs carry the
  truth; the spec stays as the record of why it was built that way.

## Where else things are documented

- [Root README](../README.md) — project overview, tech stack, and how to run it.
- [CHANGELOG](../CHANGELOG.md) — released and unreleased changes.
- [Contributing guide](../CONTRIBUTING.md) — branching model, commits, PR flow.
- `@ordo/shared` — the Zod contracts are the source of truth for data shapes, so
  they are not duplicated as prose here.
