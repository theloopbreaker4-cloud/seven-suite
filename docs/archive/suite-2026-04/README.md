# Seven Suite

> **CRM + Billing + ERP** — a unified business operations platform. Three Angular apps, one NestJS backend, shared domain models.
>
> **Status: planning.** This folder is being repurposed from an old CMS clone into a separate product. No code for the new direction has been written yet.

## What it is

Three tightly-coupled apps that share a single backend and core domain models:

- **CRM** — sales pipeline, leads, deals, activities. For sales teams.
- **Billing** — recurring subscriptions, invoices, payments, dunning. For finance.
- **ERP** — accounting (GL), inventory, procurement, taxes, payroll. For operations.

The three apps model the lifecycle of a customer relationship: **lead → deal won → subscription → invoice → GL entry**.

## Why one platform instead of three products

- Real-world entities don't split cleanly between CRM/Billing/ERP. A customer is a customer in all three views; an invoice posted in Billing must show up in ERP's books; a deal won in CRM must trigger a subscription in Billing.
- Sharing models (`Party`, `Product`, `Document`) eliminates serialization mismatches and double-entry of master data.
- Three Angular apps in an NX monorepo means users only download the JS for the apps they have access to.

## What's NOT here

- **A CMS.** That's `sevenPHP` — a separate product in the same workspace.
- **A standalone e-commerce store.** That's `sevenVUE` — also separate.
- **Marketing automation, helpdesk, recruiting.** External tool integrations.

## Stack (target)

- **Frontend:** Angular 20 in an NX monorepo (`apps/crm`, `apps/billing`, `apps/erp`)
- **Backend:** NestJS 11 (`apps/api`, modular per domain)
- **DB:** MongoDB (Postgres for ERP if transactions get painful)
- **Auth:** JWT + refresh tokens, RBAC per app
- **Tailwind 4** with theme tokens matching the rest of the workspace

## Repository layout

```
sevenAngular.io/
├── CLAUDE.md          guidance for Claude Code
├── TODO.md            roadmap
├── README.md          this file
├── .claude/rules/     per-topic rules (architecture, data-model, conventions, …)
├── backend/           legacy CMS-clone NestJS (will be removed)
├── frontend/          legacy CMS-clone Angular (will be removed)
└── shared/            legacy shared types
```

When the rewrite begins, an NX workspace will be scaffolded in a `suite/` subfolder, and the legacy folders will be removed once enough new code exists.

## Getting started (legacy code only — for now)

```bash
# Backend (legacy NestJS)
cd backend && npm run start:dev          # port 3000

# Frontend (legacy Angular)
cd frontend && npm run start             # port 4200
```

These run the **old** CMS-clone code. They're left in place for reference until the rewrite begins. **Don't extend them.**

## Documentation

- [`CLAUDE.md`](CLAUDE.md) — project overview for Claude Code
- [`TODO.md`](TODO.md) — phase-by-phase roadmap
- [`.claude/rules/product-vision.md`](.claude/rules/product-vision.md) — what CRM, Billing, ERP mean here
- [`.claude/rules/architecture.md`](.claude/rules/architecture.md) — NX monorepo + NestJS module layout
- [`.claude/rules/data-model.md`](.claude/rules/data-model.md) — Party, Product, Subscription, Invoice, GL — the core entities
- [`.claude/rules/conventions.md`](.claude/rules/conventions.md) — naming, code style, API format
- [`.claude/rules/workflow.md`](.claude/rules/workflow.md) — commands, deployment

## License

ISC.
