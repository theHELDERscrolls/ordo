# Deployment

Ordo runs on three free tiers: the database on MongoDB Atlas, the API on Render
and the web client on Vercel. Each one deploys from this repository, so a release
is a merge and not a manual upload.

| Piece    | Host          | What it serves                       |
| -------- | ------------- | ------------------------------------ |
| Database | MongoDB Atlas | The `ordo` database                  |
| API      | Render        | `@ordo/backend`, an Express service  |
| Web      | Vercel        | `@ordo/frontend`, the built static site |

The order below matters: the API needs the database's connection string, the web
client needs the API's URL, and the API needs the web client's origin to close
CORS. Nothing else depends on anything.

## Why the hosts need so little configuration

Both packages declare `../shared` as a TypeScript project reference, so `tsc -b`
builds the contract package before the one that imports it. Neither host needs a
step for `@ordo/shared`: building the backend or the frontend builds it on the way.

Node's version is read from `engines.node` in the root manifest by CI, Render and
Vercel alike, so it is declared once and the three cannot drift apart.

## 1. MongoDB Atlas

1. Create a free **M0** cluster in the region closest to the Render one, so the
   two are not talking across an ocean on every query.
2. **Database Access**: create a user with the `readWrite` role on `ordo` and a
   generated password. This password travels inside the connection string, so it
   is a secret like any other.
3. **Network Access**: add `0.0.0.0/0`. A Render free service has no static
   outbound IP, so there is no narrower range to allow. The database stays closed
   behind its own credentials, which is what is actually guarding it.
4. Copy the connection string and append the database name, which the string from
   the dashboard does not carry:

   ```text
   mongodb+srv://<user>:<password>@<cluster>.mongodb.net/ordo?retryWrites=true&w=majority
   ```

   Without `/ordo` the driver connects to `test` and the app comes up empty.

## 2. Render

New **Web Service**, connected to this repository.

| Setting           | Value                                             |
| ----------------- | ------------------------------------------------- |
| Root Directory    | *(empty: the repo root, where the lockfile is)*   |
| Runtime           | Node                                              |
| Branch            | `develop` while deploying, `main` once released   |
| Build Command     | `npm ci --include=dev && npm run build -w @ordo/backend` |
| Start Command     | `npm run start -w @ordo/backend`                  |
| Health Check Path | `/health`                                         |

`--include=dev` is not optional: Render sets `NODE_ENV=production`, and npm then
skips `devDependencies`, TypeScript among them. Without it the build fails with
`tsc: not found`.

Environment variables:

| Variable      | Value                                                    |
| ------------- | -------------------------------------------------------- |
| `MONGODB_URI` | The Atlas string from step 1                             |
| `JWT_SECRET`  | A long random string: `openssl rand -base64 48`          |
| `CORS_ORIGIN` | The Vercel URL. Left for step 4, once that URL exists    |

`PORT` is injected by Render and read by the app, so it is not set by hand.

The service refuses to accept traffic until Mongo answers, so a first deploy that
stays "in progress" is a connection string or a Network Access rule, not the build.

## 3. Seed the database

The seed runs from a laptop against Atlas, not from Render: it is a one-off, and
a free Render instance has no shell.

```bash
MONGODB_URI="<the Atlas string>" npm run seed -w @ordo/backend
```

It wipes whatever is in the database and writes the demo business, its two users
and the catalogue from `backend/seed/*.csv`. Running it against production later
is destructive, which is why it takes the URI inline instead of reading `.env`.

## 4. Vercel

New **Project**, imported from this repository.

| Setting          | Value                                            |
| ---------------- | ------------------------------------------------ |
| Root Directory   | `frontend`                                       |
| Framework Preset | Vite *(detected)*                                |
| Build / Install  | *(the defaults: `npm run build`, `npm install`)* |

Vercel installs from the workspace root on its own, because that is where the
lockfile is, so the default commands are the right ones.

One environment variable, `VITE_API_URL`, set to the Render URL with no trailing
slash. Vite inlines it into the bundle at build time rather than reading it at
runtime, so changing it later needs a redeploy to take effect.

`frontend/vercel.json` rewrites every unmatched path to `index.html`. Without it
a reload on `/movements` would ask Vercel for a file that does not exist and get
a 404, because the routes are the client's, not the server's.

## 5. Close the CORS loop

Back in Render, set `CORS_ORIGIN` to the Vercel URL and redeploy. Until then the
API answers any origin, which is the default when the variable is unset.

The variable takes a comma-separated list, so a custom domain is added beside the
`.vercel.app` one rather than replacing it.

## Free tier, and what it costs in behaviour

A Render free service spins down after 15 minutes without traffic, and the next
request wakes it: roughly a minute in which the login sits there spinning. It is
not a bug and it is not worth fighting with a pinger, which would only burn the
monthly hours to keep an idle service warm. The README says as much so nobody
reports it as one.

An Atlas M0 cluster does not sleep, but it is paused after long inactivity and is
resumed from the dashboard.

## Verifying a deployment

```bash
curl https://<render-url>/health
# {"status":"ok"}
```

Then, in the browser, log in with a seeded user. That single flow crosses all
three pieces: the client reaches the API, the API reaches Atlas, and CORS lets the
answer through.

## Releasing

Render and Vercel both build the branch they are pointed at. While deploying they
follow `develop`; once the flow is verified end to end they are moved to `main`,
and from then on a release is the `develop` to `main` merge, with the version bump
and the tag described in the [contributing guide](../CONTRIBUTING.md).
