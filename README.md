# Seven Suite

> **All-in-one business platform** — website, shop, marketplace, CRM, billing, accounting and
> inventory on one data model. Built for small and medium businesses in Georgia, the Caucasus and
> the CIS: UI in en, ru, ka, uk, az, hy, local payment gateways, Georgian tax compliance.
>
> **Status: M0 done (analysis and plan). Next: M1 foundation.** The `backend/`, `frontend/`,
> `shared/` and `doc/` folders are a legacy CMS clone and will be removed in M1 — don't extend them.

## Modules

| Module | What it does |
|---|---|
| Core | organizations, users, roles, parties (customers/vendors/contacts), products, files, timeline, numbering, audit |
| Content | pages, blog, menus, forms, SEO — the public website |
| Commerce | catalog, cart, checkout, orders, payments, shipping, digital goods |
| Marketplace | vendors, commissions, split orders, balances, payouts |
| CRM | leads, deals, pipelines, activities, quotes, email |
| Billing | plans, subscriptions, invoices, dunning, customer portal |
| Accounting | double-entry ledger, AR/AP, bank reconciliation, VAT, reports |
| Inventory & Procurement | warehouses, stock ledger, valuation, purchase orders, vendor bills |
| Localization GE | Georgian chart of accounts, VAT, RS.ge e-invoices and waybills |

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
