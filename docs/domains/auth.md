# Tenancy and authentication

Who a request belongs to, and what it is allowed to do. Every other domain reads
its scope and its permissions from here.

## Multi-tenant and white-label

One deployment, one database; every tenant-scoped document carries a `businessId`.
The tenant is resolved from the logged-in user's `businessId` (not from a URL or
subdomain): the login page is generic Ordo, and the business brand (name, accent
color, and a muted "by Ordo") is applied after login. There is no public signup.
This keeps a single-business deployment identical to a multi-tenant one;
multi-tenancy is extra credit, not a requirement.

## Authentication flow

1. The client posts credentials to `POST /auth/login`.
2. The backend validates the body with the shared `loginSchema`, looks up the
   user, and verifies the password against the bcrypt hash. Unknown email and
   wrong password return the same generic 401 so emails cannot be probed.
3. On success it signs a JWT for the user id and returns the token plus the
   resolved tenant context (user + business) so the frontend can theme itself.
4. The client stores the token and sends it as a `Bearer` header. The
   `requireAuth` middleware verifies it and populates `req.userId` for protected
   routes such as `GET /auth/me`.

## Scope and roles

Every tenant-scoped query is filtered by `getAccessibleBusinessIds(user)` (today
the user's own business), so one tenant never sees another's data. The `loadUser`
middleware attaches the user (id, businessId, role) after `requireAuth`, and
`requireAdmin` guards what only an owner should touch.

| | `admin` | `employee` |
|---|---|---|
| Browse the [catalogue](./inventory.md) and the [ledger](./movements.md) | yes | yes |
| Create, edit and delete products | yes | no |
| [Import a CSV](./csv.md) | yes | no |
| Export a CSV | yes | yes |
| [Record a movement](./movements.md) | yes | yes |

Recording a movement is the one write open to `employee`, and the reasoning for
it is in [the ledger's own document](./movements.md).
