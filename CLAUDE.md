# CLAUDE.md — Seven Suite (sevenAngular.io)

> **Status: planning / re-purposing.** This folder used to be a CMS clone of sevenPHP. As of 2026-04-30 it's being repurposed into a different product: **Seven Suite — CRM + Billing + ERP**. The existing CMS code in `frontend/` and `backend/` is legacy until rewritten or removed.

## What this becomes

A **business operations platform** with three tightly-coupled apps sharing one backend and core domain models:

| App | Purpose | Audience |
|---|---|---|
| **CRM** | Sales pipeline: leads, deals, accounts, contacts, activities, email/call tracking | Sales teams |
| **Billing** | Recurring subscriptions, invoices, payment processing, dunning, revenue recognition | Finance / RevOps |
| **ERP** | Accounting (GL), inventory, procurement, taxes, payroll, period close | Operations / Accounting |

The three apps are **separate UIs** but share a single NestJS backend and the same domain entities (`Party`, `Product`, `Document`, `Account`).

## Stack (target, not current)

- **Frontend:** Angular 20 (NX monorepo with three apps under `apps/`)
- **Backend:** NestJS 11 (one server, modular per domain)
- **DB:** MongoDB (or Postgres for ERP — TBD when data model firms up)
- **Auth:** JWT + refresh, RBAC per app
- **Tailwind 4** via `@tailwindcss/vite`

## Stack (current — legacy)

The existing code is the old CMS clone. Don't extend it without consulting roadmap. If touching it, prefer to delete than patch — most of it will be removed.

- `frontend/` — Angular 20 admin clone of CMS
- `backend/` — NestJS clone of CMS
- `shared/` — shared TypeScript types (potentially salvageable)

## Detailed rules

`.claude/rules/`:

| File | Topic |
|---|---|
| [`product-vision.md`](.claude/rules/product-vision.md) | What CRM, Billing, ERP mean here. Boundaries between them. |
| [`architecture.md`](.claude/rules/architecture.md) | NX monorepo, shared core, NestJS module layout |
| [`data-model.md`](.claude/rules/data-model.md) | Party, Product, Subscription, Invoice, GL — the core entities |
| [`conventions.md`](.claude/rules/conventions.md) | Naming, code style, API format |
| [`workflow.md`](.claude/rules/workflow.md) | Commands, adding apps/modules, deployment |

## Important

- **Don't replicate sevenPHP features here.** The CMS and the Suite are separate products with separate audiences. Shared models/styles/conventions are fine; copying business logic is not.
- **Don't extend the legacy CMS UI.** It's there because the rewrite hasn't happened yet, not because it's the path forward.
- See `TODO.md` for the MVP roadmap.
