# 07 — Decisions (ADR log)

Short records of decisions and why. Change a decision by adding a new entry that supersedes it.

## ADR-001 — One platform, one repository (2026-11-20)
**Decision:** Seven Suite absorbs Seven Shop (commerce) and adds marketplace and site content.
`seven-shop` is archived; its plans live in `docs/archive/seven-shop/`. Seven CMS (PHP) stays a
separate product.
**Why:** commerce, CRM, billing and accounting share Party, Product, Order and Invoice. Two repos on
two stacks (Vue/Express/Mongo vs Angular/Nest) doubles the work for one developer and forces
syncing models across an API.

## ADR-002 — Modular monolith, not microservices (2026-11-20)
**Decision:** one NestJS API + one worker from the same code, domain modules with lint-enforced
boundaries, events through a transactional outbox.
**Why:** same isolation benefits without network calls, distributed transactions and multi-service
ops. Odoo, ERPNext, Twenty and Medusa are all monoliths. A module can still be extracted later
because it only talks through events and public APIs.

## ADR-003 — PostgreSQL + Redis instead of MongoDB (2026-11-20)
**Supersedes:** the April plan "MongoDB (Postgres for ERP if needed)".
**Decision:** PostgreSQL as the single system of record; Redis for cache, queues and rate limits.
**Why:** double-entry bookkeeping, stock ledgers, payouts and invoice numbering need multi-row ACID
transactions and constraints. JSONB covers the flexible parts (i18n, custom fields, block content).
Two primary databases would mean no shared transactions and two backups/migrations stories.

## ADR-004 — Next.js for the public web, Angular for the admin (2026-11-20)
**Supersedes:** "three separate Angular apps" and "no SSR".
**Decision:** one Angular admin app with lazy-loaded areas per module; Next.js for the public site,
storefront and customer portal.
**Why:** the public side needs SSR and SEO, and must not expose a public bulk API — Next renders on
the server and talks to the API internally. The admin is a heavy forms-and-tables app where Angular
is strong; one app with lazy routes gives the "don't download what you can't use" benefit without
three deployments and three logins.

## ADR-005 — Prisma as ORM (2026-11-20, revisit after M1)
**Decision:** Prisma with a multi-file schema (one file per module) and Postgres schemas per module;
raw SQL (`$queryRaw`/views) for reports.
**Alternative:** Drizzle (SQL-first, very good for per-module schemas and complex queries) or
MikroORM (unit of work). **Revisit** at the end of M1 if multi-schema, RLS session variables or
transaction ergonomics turn out painful.

## ADR-006 — Multi-tenancy by `org_id` + row-level security (2026-11-20)
**Decision:** shared schema, `org_id` on every business table, Postgres RLS enforcing the current
org from a session variable.
**Why:** one deployment serves self-hosted single orgs and our cloud; RLS turns a forgotten filter
into an empty result instead of a data leak.

## ADR-007 — Metadata-driven admin screens (2026-11-20)
**Decision:** generic list/form/filter/export screens rendered from entity metadata; bespoke
screens only where UX demands.
**Why:** ~100 entities are not hand-writable by one developer; the same metadata later powers
custom fields and imports.

## ADR-008 — Immutable financial documents (2026-11-20)
**Decision:** invoices, bills, journal entries, stock moves, payouts become immutable when
submitted; corrections are cancel + amend / reversal.
**Why:** audit trail and accountant trust; it is how ERPNext and Odoo behave and what auditors expect.

## ADR-009 — Region-first positioning (2026-11-20)
**Decision:** first market is Georgia: ka/ru/en UI, GEL, VAT 18%, RS.ge integration, Georgian
gateways; az/hy/uk follow.
**Why:** a defensible niche the global open-source suites serve poorly.

## Open decisions

| # | Question | Options | Decide by |
|---|---|---|---|
| OD-1 | Licence | AGPLv3 (like Twenty/Lago) + paid cloud · MIT + paid modules · source-available | before public release |
| OD-2 | Product name of the bundle | keep "Seven Suite" | decided: keep |
| OD-3 | Deployment of tenants | subdomain per org on our cloud + custom domains | M1 |
| OD-4 | Payments in GE for marketplace payouts | manual bank payouts first; bank API split later | M9 |
| OD-5 | RS.ge integration depth | e-invoice + waybill first; VAT return export later | M7 |
| OD-6 | Tax engine beyond GE | per-country localization modules vs external service | after 1.0 |
| OD-7 | Admin i18n library | Transloco (runtime switch) vs Angular built-in i18n | M1 |
