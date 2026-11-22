# Seven Suite

> **All-in-one business platform** — website, shop, marketplace, CRM, billing, accounting and
> inventory on one data model. Built for small and medium businesses in Georgia, the Caucasus and
> the CIS: UI in en, ru, ka, uk, az, hy, local payment gateways, Georgian tax compliance.
>
> **Status: 0.2.0 — foundation preview.** Sign-in with optional two-factor codes, organizations,
> members, roles, invitations, API keys and reliable events (outbox + worker) work end to end;
> business modules land milestone by milestone ([TODO.md](TODO.md),
> [CHANGELOG.md](CHANGELOG.md)).
>
> **Live demo:** https://seven.toolpix.dev/suite/ — `demo@example.com` / `seven-demo-2026`
> (shared account, reset every hour; sign-up, mail and membership changes are off).

## Quick start (development)

Requirements: Node 22, pnpm, Docker (Docker Desktop or Docker inside WSL).

```bash
pnpm install
cp .env.example .env
pnpm dev:services        # PostgreSQL :5434, Redis :6380, S3 :9100, Mailpit UI :8026
pnpm api                 # NestJS API
pnpm admin               # Angular admin
pnpm web                 # Next.js site
pnpm check               # lint + typecheck + test + build, all projects
```

| Path                   | What                                                                        |
| ---------------------- | --------------------------------------------------------------------------- |
| `apps/api`             | NestJS HTTP API                                                             |
| `apps/worker`          | NestJS background worker (queues, schedules)                                |
| `apps/admin`           | Angular admin (CRM, Billing, Accounting, …)                                 |
| `apps/web`             | Next.js public site, storefront, customer portal                            |
| `libs/shared`          | isomorphic types and helpers (`@seven/shared`)                              |
| `libs/server/platform` | server kernel: config, db, events, auth, tenancy (`@seven/server-platform`) |
| `libs/server/core`     | Party, Product, numbering, timeline (`@seven/server-core`)                  |
| `docker/`              | dev services                                                                |

Module boundaries are enforced by lint (`eslint.config.mjs`): server, admin and web code can only
import their own layer plus `shared`; `platform` sits below `core`, and `core` below every module.

## Modules

| Module                  | What it does                                                                                                   |
| ----------------------- | -------------------------------------------------------------------------------------------------------------- |
| Core                    | organizations, users, roles, parties (customers/vendors/contacts), products, files, timeline, numbering, audit |
| Content                 | pages, blog, menus, forms, SEO — the public website                                                            |
| Commerce                | catalog, cart, checkout, orders, payments, shipping, digital goods                                             |
| Marketplace             | vendors, commissions, split orders, balances, payouts                                                          |
| CRM                     | leads, deals, pipelines, activities, quotes, email                                                             |
| Billing                 | plans, subscriptions, invoices, dunning, customer portal                                                       |
| Accounting              | double-entry ledger, AR/AP, bank reconciliation, VAT, reports                                                  |
| Inventory & Procurement | warehouses, stock ledger, valuation, purchase orders, vendor bills                                             |
| Localization GE         | Georgian chart of accounts, VAT, RS.ge e-invoices and waybills                                                 |

## Stack

NX monorepo · **NestJS** API + worker (modular monolith) · **PostgreSQL** + **Redis/BullMQ** ·
**Angular** admin · **Next.js** public site and storefront (SSR) · Prisma · Tailwind 4 · Docker.

## Documentation

Start with [`docs/README.md`](docs/README.md). The roadmap is in [`TODO.md`](TODO.md).

## Related projects

- **Seven CMS** (PHP) — a separate, lightweight CMS: [seven-cms-php](https://github.com/theloopbreaker4-cloud/seven-cms-php)
- **Seven Projects** — the showcase site: [seven.toolpix.dev](https://seven.toolpix.dev)
- **Seven Shop** — merged into this repository as the Commerce module (archived)

## License

To be decided before the first public release (see `docs/07-decisions.md`, OD-1).
