# Ordo

> Configurable inventory and restocking platform for small businesses.

**Ordo** (from Latin *ordo*: order, organization) is a FullStack application that
lets small businesses centrally manage their operational inventory: products,
stock levels, locations, suppliers, stock movements, restocking orders, alerts
and related documentation.

The system is designed in an abstract way so it can adapt to different sectors
(hardware stores, workshops, computer shops, associations, warehouses...)
without aiming to become a full ERP.

This project is developed as a **Master's Thesis (TFM)**.

## Project status

**Early development.** The repository foundation is currently being set up
(governance, CI/CD, templates). The code structure and dependencies will be
added as development progresses.

## Tech stack

| Layer          | Technology                          |
| -------------- | ----------------------------------- |
| Frontend       | React + TypeScript + Vite           |
| Styling        | Tailwind CSS (custom components)    |
| Backend        | Node.js + Express + TypeScript      |
| Database       | MongoDB + Mongoose                  |
| Storage        | Amazon S3 (documents and images)    |
| Messaging      | Telegram bot                        |
| Deployment     | Render (backend) · MongoDB Atlas    |

## Monorepo structure

The project is organized as a **monorepo**:

```text
ordo/
├── .github/        Templates, CI/CD and Dependabot configuration
├── backend/        REST API (Node.js + Express + TypeScript)   [pending]
├── frontend/       Web client (React + TypeScript + Vite)       [pending]
└── docs/           Project documentation                        [pending]
```

> The internal structure of each package will be documented as it is defined
> during development.

## Git workflow

A simplified *git-flow* is used, with two protected branches:

```text
feat/*     ─PR→  develop  ─PR→  main
fix/*      ─┘               (release)
chore/*    ─┘
```

- **`main`** — stable / release branch.
- **`develop`** — day-to-day integration branch.
- Every change is merged through a *Pull Request* and must pass the CI pipeline.

## Contributing

Please read the [Contributing Guide](./CONTRIBUTING.md) for the branching model,
commit conventions and workflow. This project also has a
[Code of Conduct](./CODE_OF_CONDUCT.md) and a
[Security Policy](./SECURITY.md).

## License

Distributed under the [MIT](./LICENSE) license.

## Author

**Helder Manuel Vieira Ruiz**
