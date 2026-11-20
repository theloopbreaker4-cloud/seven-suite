# 03 — Architecture

A **modular monolith**: one codebase, one database, one API process (plus a worker process from
the same code), split into domain modules with hard boundaries. No microservices — they solve
problems of large teams and huge traffic that we don't have, and cost network calls, distributed
transactions and extra ops.

## 1. Stack

| Layer | Choice | Why |
|---|---|---|
| Language | TypeScript (strict) everywhere | one language, shared types API ↔ UI |
| Monorepo | **NX** | supports Nest, Angular and Next in one workspace; affected-only builds; module boundary lint rules |
| API | **NestJS 11** | modules + DI, guards, interceptors, OpenAPI, BullMQ, schedule — built for this shape of app |
| Database | **PostgreSQL 16+** | transactions (double-entry needs them), JSONB for i18n and custom fields, FTS, row-level security |
| ORM | **Prisma** (multi-file schema, one folder per module, Postgres schemas per module) + raw SQL for reports | known from ToolPix; typed queries; migrations. See ADR-005 for the Drizzle alternative |
| Cache / queues | **Redis** + **BullMQ** | jobs, scheduled jobs, rate limits, cache |
| Admin UI | **Angular 20** (standalone, signals), one app with lazy routes per module | strong for large form/table-heavy business apps; DI and typed reactive forms |
| Web UI | **Next.js** (App Router, SSR/ISR) | SEO site and storefront; data fetched server-side from the API over the internal network |
| Styling | Tailwind 4 with shared design tokens | same tokens in Admin and Web |
| Files | S3-compatible storage (MinIO locally / on the VPS) | public bucket for media, private bucket for invoices, digital goods |
| Search | PostgreSQL full-text first; Meilisearch later for the storefront | no extra service until needed |
| Email | provider interface: SMTP, Resend | already used in ToolPix |
| Tests | Vitest/Jest (unit), Testcontainers Postgres (integration), Playwright (e2e) | real database in integration tests |
| Deploy | Docker Compose on the VPS, nginx, Cloudflare | same as our other projects |

## 2. Workspace layout

```
seven-suite/
├── apps/
│   ├── api/             NestJS HTTP API (imports the server modules)
│   ├── worker/          NestJS standalone app: BullMQ processors + schedules (same modules)
│   ├── admin/           Angular admin (lazy areas: crm, commerce, marketplace, billing, accounting, inventory, procurement, content, settings)
│   └── web/             Next.js public site + storefront + customer portal
├── libs/
│   ├── shared/          isomorphic: types, zod schemas, Money, I18nString, enums, error codes
│   ├── api-client/      generated from OpenAPI, used by admin and web
│   ├── server/
│   │   ├── platform/    kernel: config, db, events/outbox, jobs, cache, auth, rbac, tenancy, audit, files, i18n, numbering, mail
│   │   ├── core/        Party, Product master, currencies, taxes, settings, timeline, notifications
│   │   ├── content/  commerce/  marketplace/  crm/  billing/
│   │   ├── accounting/  inventory/  procurement/  hr/  reports/
│   │   └── localization-ge/
│   ├── admin/
│   │   ├── ui/          design system components (table, form fields, dialogs, kanban, timeline)
│   │   ├── meta-ui/     metadata-driven list/form/filter screens
│   │   └── <module>/    feature libraries per module
│   └── web/ui/          storefront components
├── prisma/              schema/<module>.prisma, migrations/
├── docker/              compose files, nginx, init scripts
├── docs/                this folder
└── tools/               generators, scripts
```

NX tags + `@nx/enforce-module-boundaries` make the boundaries mechanical: `scope:crm` may depend on
`scope:core` and `scope:platform`, never on `scope:billing`.

## 3. Module anatomy (server)

```
libs/server/crm/src/
├── crm.module.ts            Nest module; declares manifest (deps, permissions, settings, menu)
├── manifest.ts              { id: 'crm', requires: ['core'], permissions: [...], events: {...} }
├── deals/
│   ├── deal.entity.ts       domain type
│   ├── deal.repository.ts   only file that touches the deal tables
│   ├── deal.service.ts      business rules; emits events
│   ├── deal.controller.ts   REST, DTOs validated with zod/class-validator
│   ├── deal.dto.ts
│   └── deal.spec.ts
├── events.ts                events this module publishes (typed)
├── listeners/               reactions to other modules' events
└── public-api.ts            the only exports other modules may use
```

## 4. Cross-module communication

1. **Synchronous queries** — through another module's `public-api` service (read-only where possible).
2. **Domain events** — written to an **outbox table in the same transaction** as the change, then
   dispatched by the worker to BullMQ consumers. Consumers are **idempotent** (event id stored).
   No event is lost if the process crashes after commit; none is sent for a rolled-back change.
3. **Workflows (sagas)** — multi-step processes spanning modules (checkout, refund, payout, period
   close) are explicit workflows: ordered steps, each with a compensation; state persisted so a
   crashed workflow resumes.
4. **Links** — relations between modules' records (order ↔ invoice, deal ↔ subscription) live in
   platform-owned link tables, not as foreign keys from one module into another.

Event catalog: [`05-events.md`](05-events.md).

## 5. Multi-tenancy

- Every business table has `org_id`. A request resolves its organization (subdomain, custom domain
  or header) and the API sets `app.org_id` on the connection.
- **PostgreSQL row-level security** policies enforce `org_id = current_setting('app.org_id')` —
  a forgotten `WHERE` can't leak another tenant's data.
- Users ↔ organizations is many-to-many with a role per membership.
- One deployment serves one or many organizations (self-hosted single org, or our cloud).

## 6. Security model

- **Admin / API**: JWT access token (15 min) in memory + rotating refresh token in an httpOnly,
  SameSite=Strict cookie scoped to `/api/auth`; replay detection revokes the chain. 2FA (TOTP).
- **Web (customers)**: the Next.js server holds the session in an httpOnly cookie and calls the API
  server-to-server; the browser never sees tokens.
- **Service-to-service**: Web → API with a scoped service key over the internal network; the API is
  not exposed for anonymous bulk reads.
- **RBAC**: permissions `module:entity:action` (`billing:invoice:void`); roles are permission sets;
  record rules for ownership ("sales rep sees own deals"). Checked in guards *and* in services.
- **API keys** for integrations: per org, scoped permissions, hashed at rest.
- Rate limits (Redis), audit log for every state change, uploads MIME-sniffed with server-chosen
  extensions, HTML sanitization for rich text, signed outgoing webhooks, idempotency keys on POSTs
  that create money movements.
- Secrets only in environment, never in the database or logs.

## 7. Data rules

- Migrations are the only way the schema changes. Fresh-install test in CI.
- Money: integer minor units + currency code; `Money` value object; rounding rules per currency.
- Time: UTC in the database (`timestamptz`); each organization has an accounting timezone for
  "which day" decisions.
- I18n content: `jsonb` `{ "en": "...", "ka": "..." }` with fallback requested → org default → `en`.
- Soft delete (`deleted_at`) for master data; financial documents are never deleted, only cancelled.
- Numbering via a `sequences` table with row locks (gap-free per org/series/year).

## 8. Admin UI: metadata-driven by default

Each entity publishes metadata (fields, types, labels, permissions, list columns, filters, form
layout). `libs/admin/meta-ui` renders generic list/detail/form/filter/export screens from it.
Hand-written screens only where UX matters: pipeline Kanban, POS-like order entry, checkout,
reconciliation, dashboards. This is the lever that makes ~100 entities feasible for a small team.
Custom fields (M10) plug into the same metadata.

## 9. Web (Next.js)

- Pages are server-rendered; data comes from the API through `libs/api-client` on the server.
- ISR / tag-based revalidation: the API emits `content.published`, `product.updated` → Web
  revalidates the affected paths.
- Themes = design tokens + a set of section components; no arbitrary page builder.
- Multi-domain: one Web deployment serves every organization's domain.

## 10. Deployment

```
Cloudflare ─► nginx ─┬─► web (Next.js)      :3000
                      └─► api (NestJS)       :4000  (/api/*)
                           worker (NestJS)          (no port)
                           PostgreSQL  Redis  MinIO (internal network only)
```

Docker Compose for dev and the VPS; CI builds images on push; migrations run before the new API
starts; health checks; nightly `pg_dump` + MinIO sync to off-site storage.
