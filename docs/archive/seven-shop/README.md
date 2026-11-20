# Seven Shop

> **Storefront-as-a-Service** — a standalone e-commerce platform. Built with Vue 3 + Express + MongoDB.
>
> **Status: planning / re-purposing.** This folder used to be a CMS clone. As of 2026-04-30 it's being repurposed into Seven Shop. No code for the new direction has been written yet — the legacy CMS-clone code in `frontend/` and `backend/` is kept for reference only.

## What it is

A self-hosted e-commerce platform for sellers whose main business is selling — not publishing content. Catalog management, customer accounts, cart, checkout, payments, orders.

Targeted at the CIS / Caucasus / Eastern Europe market: self-hosted, no per-transaction fees, support for local payment gateways, multilingual UI (en/ru/ka/uk/az/hy).

## What this is NOT

- **A CMS.** That's [`sevenPHP`](../sevenPHP) — a separate product in the same workspace.
- **A subscription billing platform** beyond the basic "subscription box" case. For full subscription/usage-based billing, see [`sevenAngular.io`](../sevenAngular.io) (Seven Suite).
- **An ERP.** Orders flow out via webhook to whoever's doing the accounting.
- **A page builder or content tool.** The storefront has a fixed (but themeable) structure.

## Stack (target)

- **Frontend:** Vue 3 + Vite + Pinia + Vue Router + Tailwind 3 (single bundle serving storefront + admin via routing)
- **Backend:** Express 4 + Mongoose + MongoDB
- **Auth:** JWT for the API, session cookies for guest carts
- **Payments:** Stripe + PayPal first; localized gateways (Yookassa, IDRAM, BOG) later

## Stack (current — legacy)

The existing code is the old CMS clone (Posts, Pages, Categories, etc.). It will be removed or rewritten as Seven Shop is built.

- `backend/src/api/` — Express CMS routes
- `frontend/src/` — Vue 3 unified site + admin shell

## Repository layout

```
sevenVUE/
├── CLAUDE.md            guidance for Claude Code
├── TODO.md              roadmap
├── README.md            this file
├── .claude/rules/       per-topic rules (architecture, data-model, …)
├── backend/             legacy Express CMS (will be replaced)
└── frontend/            legacy Vue 3 admin (will be replaced)
```

## Getting started (legacy code only — for now)

```bash
# Backend (port 3003)
cd backend && npm install
node src/api/index.js

# Frontend (port 8086 — single Vite dev serves storefront + admin)
cd frontend && npm install && npm run dev
```

Visit:
- Storefront: http://localhost:8086
- Admin: http://localhost:8086/admin

These run the **old** CMS-clone code. They're left in place for reference until the rewrite begins. **Don't extend them.**

## Environment

```env
# backend/.env
PORT=3003
MONGO_URI=mongodb://localhost:27017/sevenshop
JWT_SECRET=change-me
NODE_ENV=development
UPLOAD_DIR=uploads
```

## Documentation

- [`CLAUDE.md`](CLAUDE.md) — project overview for Claude Code
- [`TODO.md`](TODO.md) — phase-by-phase roadmap
- [`.claude/rules/product-vision.md`](.claude/rules/product-vision.md) — what Seven Shop is, what it isn't, MVP scope
- [`.claude/rules/architecture.md`](.claude/rules/architecture.md) — backend/frontend layout, services, pricing pipeline
- [`.claude/rules/data-model.md`](.claude/rules/data-model.md) — Product, Variant, Cart, Order, Customer, Discount, ShippingZone, TaxRate
- [`.claude/rules/conventions.md`](.claude/rules/conventions.md) — naming, code style, API format
- [`.claude/rules/workflow.md`](.claude/rules/workflow.md) — dev commands, adding features, deployment

## License

ISC.
