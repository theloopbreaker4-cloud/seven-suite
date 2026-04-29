# Architecture

## Target layout (NX monorepo)

```
sevenAngular.io/
├── apps/
│   ├── crm/                 Angular app (sales pipeline)
│   ├── billing/             Angular app (subscriptions + invoices)
│   ├── erp/                 Angular app (accounting + ops)
│   └── api/                 NestJS backend (one server, modular)
├── libs/
│   ├── shared/              shared TypeScript models (Party, Product, Document, …)
│   ├── ui/                  shared Angular components (form fields, tables, dialogs)
│   ├── auth/                shared auth (JWT interceptor, guards)
│   └── api-client/          shared HTTP client (typed endpoints)
├── nx.json
├── tsconfig.base.json
└── package.json
```

Each app is a separate Angular bundle. Three deployment targets, one codebase, one backend.

## Why NX

- Type-safe sharing: `libs/shared/` exports `Party`, `Invoice`, etc. — all three apps import them. Zero serialization mismatches.
- Affected-only builds: change CRM, NX rebuilds only `apps/crm` + dependent libs.
- Per-app routing/auth: CRM users don't load Billing JS unless they have access.

## Backend module layout

`apps/api/src/` — NestJS, one module per domain area:

```
apps/api/src/
├── shared/                  Party, Product, Document, User, Permission, ...
│   ├── party/
│   │   ├── party.schema.ts
│   │   ├── party.service.ts
│   │   ├── party.controller.ts
│   │   └── party.module.ts
│   ├── product/
│   ├── document/
│   └── user/
├── crm/
│   ├── pipeline/
│   ├── deal/
│   ├── activity/
│   └── crm.module.ts        composes the above
├── billing/
│   ├── plan/
│   ├── subscription/
│   ├── invoice/
│   ├── payment/
│   ├── gateway/             Stripe/PayPal adapters + webhook handlers
│   └── billing.module.ts
├── erp/
│   ├── ledger/              GL, journal entries
│   ├── inventory/
│   ├── procurement/
│   ├── tax/
│   ├── payroll/
│   └── erp.module.ts
└── app.module.ts            imports SharedModule + CrmModule + BillingModule + ErpModule
```

## Inter-domain communication

Always through **events**, never direct service-to-service calls across domains:

```
deal.won (CRM)              → Billing creates Subscription
subscription.activated      → Billing schedules first invoice
invoice.issued              → Billing sends email
invoice.paid                → ERP posts revenue to GL
invoice.overdue             → Billing dunning flow
period.closed (ERP)         → Billing locks invoice editing for that period
```

Use NestJS's built-in `EventEmitter2` or a real queue (Bull/Redis) for cross-domain side effects. This keeps modules independently deployable later if needed.

**Within a domain** (e.g. Billing's `subscription.service` calling `invoice.service`), direct DI is fine.

## Auth & RBAC

- One JWT system shared across apps. Login on any app issues the same token.
- Permissions are **per-app**: a user can have CRM access without Billing access.
- Roles map to permissions: `crm:read`, `crm:write`, `billing:read`, `billing:admin`, `erp:bookkeeper`, `erp:admin`, etc.
- `PermissionGuard` on every controller method.

Frontend: each app's router has a `CanActivate` guard that checks the user's permissions for *that* app and redirects to a "no access" page if missing.

## Database

Default: **MongoDB**. Reasons: existing legacy code uses it, Mongoose is fine for CRM/Billing where schemas evolve. Atlas / WSL Docker.

**Caveat:** ERP accounting wants strict transactional integrity (multi-document journal entries must commit atomically). Mongo supports multi-doc transactions in replica-set mode, but it's not ideal. **Decision deferred** — start with Mongo, migrate ERP-specific collections to Postgres later if transactions become painful.

Money: stored as integer minor units everywhere (cents for USD/EUR, kopeks for RUB). Same convention as sevenPHP.

## Frontend conventions

- Each app has its own `app.routes.ts` and shell.
- Shared layout components in `libs/ui/`: `<seven-table>`, `<seven-form-field>`, `<seven-dialog>`, `<seven-toast>`.
- Theme tokens (CSS variables) — same names as sevenPHP for muscle-memory continuity. Tailwind 4 with `@theme inline`.
- Validation: a single `FormValidator` service in `libs/ui/` mirrors the sevenPHP `forms.js` UX (inline errors with icon, shake on invalid, toast). Translates Angular `FormControl` errors to display strings.

## Deployment

Three Angular bundles + one NestJS server. Possible setups:

1. **Single domain, path-based:** `app.example.com/crm`, `/billing`, `/erp`. Easier auth.
2. **Subdomains:** `crm.example.com`, `billing.example.com`, `erp.example.com`. Cleaner for SSO branding.

API at `api.example.com` (or `app.example.com/api`). CORS tuned to the chosen layout.

## Out of scope (architecture-wise)

- Microservices. One NestJS process is fine until 100k users — premature splitting hurts more than it helps.
- Server-side rendering (SSR/SSG). Angular Universal for an internal business tool is wasted effort.
- Real-time sync between users. Optimistic concurrency + refresh is enough; if collaboration becomes a thing, add `socket.io` later.
