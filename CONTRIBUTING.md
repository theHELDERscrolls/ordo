# Contributing to Ordo

Thank you for your interest in Ordo. This document explains how the project is
structured and how to contribute.

> Ordo is developed as a Master's Thesis (TFM). Even as a single-maintainer
> project, it follows a strict Git workflow as a good engineering practice.

## Branching model

- `main` — production branch. Only receives merges from `develop` when a new
  version is ready to release.
- `develop` — integration branch. All feature work targets this branch.
- Working branches — named `<type>/<issue-number>-<short-slug>`, where `<type>`
  matches the Conventional Commit types: `feat`, `fix`, `refactor`, `docs`,
  `chore`, `test`, `ci`, `perf`, `style`, `build`
  (e.g. `feat/42-product-catalog`, `refactor/57-stock-service`).
- Hotfix branches — the only exception: named `hotfix/<slug>` and branched from
  `main`. After merging into `main`, the fix must be merged back into `develop`.

```
feat/42-product-catalog ──► develop ──► main
                                            ▲
hotfix/login-crash ─────────────────────────┘ (then back-merged into develop)
```

## Commit style

This project follows [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add SKU uniqueness validation
fix: prevent negative resulting stock on corrections
docs: document the purchase order endpoints
chore: configure ESLint and Prettier
refactor: extract stock update into an inventory service
```

Use lowercase, imperative mood, no trailing period. A scope is optional
(e.g. `feat(products): ...`).

## Pull request flow

1. Create a branch from an up-to-date `develop`.
2. Open a PR targeting `develop` (or `main` only for a hotfix/release).
3. Link the issue it closes (`Closes #42`) in the PR description.
4. Fill in the Pull Request template and make sure the **CI check is green**.
5. Keep PRs focused — one feature or fix per PR.

## Local development

Setup instructions will be documented in the [README](README.md) as the backend
and frontend packages are added.

## Security

Never commit secrets or credentials. Configuration is provided through `.env`
files (ignored by Git); keep `.env.example` up to date. To report a
vulnerability, see the [Security Policy](SECURITY.md).

## Questions or issues

Open a [GitHub issue](../../issues) or contact
[manuhelderruiz@gmail.com](mailto:manuhelderruiz@gmail.com).

By participating you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md).
