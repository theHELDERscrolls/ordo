---
name: ship-pr
description: >-
  Ordo's git-flow helper. Turn finished working changes into logical one-line
  Conventional Commits, verify the build, keep the CHANGELOG and version aligned
  with this repo's release policy, push, and open a Pull Request from the repo's
  template. Use this whenever the user wants to commit, push, open a PR, "ship", or
  wrap up a finished piece of work, even if they just say "commit this", "let's open
  the PR", or "push this up". This is an invocable helper, never an automatic gate.
  It is NOT for reviewing code quality (use code-review) or for running the app
  (use run).
---

# ship-pr — Ordo commit-and-PR flow

This skill captures the git-flow this repo repeats after every unit of work, so it
is done consistently and nothing is forgotten. It does not run git for the user:
in this repo **git is user-owned** (a `Bash(git:*)` / `Bash(gh:*)` `ask`
permission enforces it), so you propose each command and let the user run or
confirm it. Never attribute anything to Claude or AI: no `Co-Authored-By`, no
"Generated with" lines, nowhere. All committed content — commit messages, the PR
body, docs — is written in English (repo convention).

Work through the steps in order. Show your thinking to the user and pause where it
says to — the value here is a clean, verified, reviewable history, not speed.

## 1. Understand what changed

Run `git status` and `git diff` (and `git branch --show-current`). Build a clear
picture of every modified/new file and which concern it belongs to. Ignore build
artifacts (`dist/`, `*.tsbuildinfo`) — they are gitignored.

If the current branch is `develop` or `main` (both protected), stop and create a
working branch first: `git switch -c <type>/<issue>-<slug>` from an up-to-date
`develop`, where `<type>` is a Conventional Commit type (`feat`, `fix`, `refactor`,
`docs`, `chore`, `test`, `ci`, `perf`, `style`, `build`). Uncommitted changes
follow the checkout onto the new branch.

## 2. Verify it works

Don't ship what you haven't run — a green typecheck is not proof of behavior. Follow
the repo's discipline:

- **Clean rebuild** so the result is reproducible and not a stale artifact: clear
  the build output, then `npm run build` (workspace-wide, or `-w @ordo/<pkg>`).
- Run `npm run lint` and `npm run test`.
- **Exercise the real behavior**: run the app or hit the endpoint you changed (see
  the run / verify skills), not just the compiler. For a backend change that means
  actually calling it; for UI, seeing it in the app.
- If anything fails, stop and report the **actual output**. Never ship a red build,
  and never claim a path works without having run it.

## 3. Update docs and the CHANGELOG

Docs travel in the same PR as the code they describe, so bring them along before
committing:

- Update the affected docs (README, `docs/`), and reorganize proactively if a doc
  outgrew its home (create folders, move files, split a section) — tell the user
  what moved.
- Append the change under `## [Unreleased]` in `CHANGELOG.md`.

**Versioning policy — do not get this wrong.** On `develop`, never bump the
`package.json` version. A version is published only at release (`develop` → `main`):
that is when `[Unreleased]` is renamed to `## [X.Y.Z] - YYYY-MM-DD`, the version is
bumped, and a `vX.Y.Z` tag is created on `main`. So unless this run is a release,
the only version-related action is adding lines to `[Unreleased]`.

## 4. Split into logical commits

Group the changes into the smallest set of commits that each tell one coherent
story, and **show the proposed split to the user before committing anything**. Good
seams to split on:

- **Layer/package**: backend vs frontend vs shared, if a change spans them.
- **Concern**: code (`feat`/`fix`) vs its documentation (`docs`).
- **Separate features**: two unrelated capabilities are two commits, even in one
  branch.

Each commit message is a single line of [Conventional
Commits](https://www.conventionalcommits.org/): lowercase, imperative, no trailing
period, optional scope. No emojis, no `---` lines.

**Example** — a branch that added a backend endpoint plus its docs:

```
feat: add product domain and inventory API
docs: add API reference and reorganize docs into api/
```

Stage each group explicitly (`git add <paths>`, not `git add -A`) so a commit only
contains its own files. Then propose the `git commit -m "..."` for the user to run.

## 5. Push and open the PR

Push the branch (`git push -u origin <branch>`), then open the PR **against
`develop`** (only `main` for a hotfix/release).

The PR body must follow `.github/PULL_REQUEST_TEMPLATE.md` — every section, not a
freeform description. GitHub only injects that template for PRs opened in the web
UI, so when opening via `gh pr create` you must reproduce it yourself. Fill:

- **Description**: what the PR does and why, in a sentence or two.
- **Changes**: a concrete bullet list of the actual modifications (grouped by
  backend/frontend/shared/docs where useful) — never just prose.
- **Type of change**: tick the boxes that apply.
- **Related issues**: `Closes #N` (and `Part of #M` if it belongs to an epic).
- **How has this been tested?**: the real checks from step 2 (build/lint/test,
  endpoints exercised), with actual results.
- **Checklist**: tick honestly; leave CI unchecked if you cannot confirm it.

Pass the body via stdin (`gh pr create --body-file -` with a heredoc) or inline —
never leave a temporary `.md` file in the repo.

## 6. Hand back

Report the commits made, the PR URL, and whether the version was touched (normally
not). The user reviews and merges; you do not merge for them.
