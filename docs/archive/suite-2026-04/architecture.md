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

## Database — Postgres-first, Mongo-optional

**Default: Postgres + Redis.** Mongo is **opt-in** for specific append-only
collections via env var. New developers should be able to run Suite locally
with just Postgres — no Mongo setup required.

### Postgres = master data + transactions (always)

Everything that's transactional, FK-related, or financially critical:

- **Master data:** Party, User, Permission, Address, Currency
- **Money:** Invoice, Payment, JournalEntry, Account, Subscription, Plan
- **Catalog:** Product, Variant
- **Orders:** Order, OrderItem
- **Anything with FKs to the above**

These NEVER move to Mongo. Postgres FKs + ACID + period-close immutability
are why we picked Postgres in the first place.

For ERP double-entry bookkeeping, Postgres transactions are the floor —
not a nice-to-have.

### Postgres handles "Mongo-like" needs too

Don't reach for Mongo just because data is semi-structured. Postgres has:

- **JSONB columns** for flexible attributes (custom fields per Party, integration metadata)
- **GIN indexes** for fast JSONB queries: `WHERE custom_fields @> '{"vip": true}'`
- **`pg_trgm`** for fuzzy text search without a separate engine
- **TimescaleDB** extension if a high-volume table needs time-series scaling
- **Logical replication** for read scaling when needed

Example for custom fields per Party:

```sql
CREATE TABLE party (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  custom_fields JSONB DEFAULT '{}'   -- Mongo-like flexibility
);
CREATE INDEX idx_party_custom ON party USING GIN (custom_fields);
```

### Mongo = optional adapter for specific collections

Append-only, high-write, schema-flexible collections are **candidates** for
Mongo offload when scale demands it. Day-1 they all live in Postgres tables.
Day-N you flip an env var and the data writes to Mongo instead.

**Eligible collections:**

| Collection | Why Mongo-eligible | Postgres fallback |
|---|---|---|
| `activity_log` | Millions of rows, append-only, never updated | `activity_log` table with `event_data JSONB` |
| `audit_log` | Same shape as activity but compliance-grade | `audit_log` table |
| `webhook_log` | External payloads, schema unpredictable | `webhook_log` table with `payload JSONB` |
| `email_log` | Large volume, simple read pattern | `email_log` table |
| `integration_data` | Third-party API responses | JSONB column on owner record |

**NOT eligible** (master data only, ever):
- Party, User, Invoice, Payment, JournalEntry, Order, Subscription, Account.

### How it's wired (NestJS)

Repository pattern. Business code never touches a driver directly.

```ts
// libs/shared/src/repositories/activity-log.repository.ts
export interface ActivityLogRepository {
  log(event: ActivityLogEntry): Promise<void>;
  findByPartyId(partyId: string, limit?: number): Promise<ActivityLogEntry[]>;
}

// Two implementations behind the same interface:
//   - PostgresActivityLogRepository (default)
//   - MongoActivityLogRepository (when ACTIVITY_LOG_DRIVER=mongo)

// Module wires the right one based on env:
{
  provide: 'ActivityLogRepository',
  useFactory: (cfg: ConfigService) =>
    cfg.get('ACTIVITY_LOG_DRIVER', 'postgres') === 'mongo'
      ? new MongoActivityLogRepository(...)
      : new PostgresActivityLogRepository(...),
  inject: [ConfigService],
}
```

`.env`:

```
# Default — Postgres only
ACTIVITY_LOG_DRIVER=postgres
AUDIT_LOG_DRIVER=postgres
WEBHOOK_LOG_DRIVER=postgres
MONGO_URI=

# Production at scale — switch heavy ones to Mongo
# ACTIVITY_LOG_DRIVER=mongo
# AUDIT_LOG_DRIVER=mongo
# MONGO_URI=mongodb://...
```

### Outbox pattern for cross-store consistency

When a Postgres transaction must produce a Mongo side effect (deal won →
activity log entry), don't write to Mongo from inside the Postgres
transaction — that breaks atomicity.

Instead, write an `outbox` row in the same Postgres transaction. A
background worker reads `outbox` and dispatches to Mongo (with retries +
idempotency).

```ts
async winDeal(dealId: string) {
  await this.db.transaction(async (tx) => {
    await tx.update(deals).set({ status: 'won' }).where({ id: dealId });
    await tx.insert(outbox).values({
      eventType: 'deal.won',
      payload: { dealId, /* ... */ },
      destination: 'activity_log',
      createdAt: new Date(),
    });
  });
  // OutboxWorker picks this up and pushes to wherever ActivityLogRepository points
}
```

This is mandatory whenever dual-write is involved. Skipping it = lost
events on partial failures.

### Cross-store queries don't work

You can't `JOIN` Postgres `Party` with Mongo `activity_log`. Solutions:

- **Denormalize counters** into Postgres: `Party.activitiesCount`,
  `Party.lastActivityAt` updated by the OutboxWorker.
- **Snapshot identifiers** in the Mongo doc: store `partyName` at write
  time so reports don't need a join.

### Money

Always integer minor units (cents/kopeks). Never floats. Same convention as
sevenPHP and sevenVUE.

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
