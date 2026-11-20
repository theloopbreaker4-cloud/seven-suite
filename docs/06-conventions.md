# 06 — Conventions

## Code

- TypeScript `strict`, no `any` without a comment explaining why. ESLint + Prettier, NX defaults.
- File header in every source file: `/** Seven Suite — github.com/theloopbreaker4-cloud/seven-suite */`
- Comments in English and only for the non-obvious *why*. No emojis in code.
- Angular: standalone components, signals, typed reactive forms, kebab-case files.
- Nest: one folder per entity (`*.entity.ts`, `*.repository.ts`, `*.service.ts`, `*.controller.ts`,
  `*.dto.ts`, `*.spec.ts`); only the repository touches tables; only `public-api.ts` is importable
  from other modules.
- Tests next to the code (`*.spec.ts`); integration tests in `*.int-spec.ts` against a real Postgres.

## API

```
GET    /api/v1/crm/deals              list   ?limit=&offset=&sort=&filter[stage]=
GET    /api/v1/crm/deals/:id          detail
POST   /api/v1/crm/deals              create (201)
PATCH  /api/v1/crm/deals/:id          partial update
DELETE /api/v1/crm/deals/:id          soft delete (master data only)
POST   /api/v1/billing/invoices/:id/submit     document actions are verbs
POST   /api/v1/billing/invoices/:id/cancel
```

- List response `{ items, total, limit, offset }`; error response `{ error, code, fields? }`.
- Status codes: 200, 201, 400, 401, 403, 404 (also for "exists but hidden"), 409, 422 (validation
  with `fields`), 429, 500 only for real bugs.
- `Idempotency-Key` header honoured on POSTs that move money or stock.
- OpenAPI generated from DTOs; `libs/api-client` generated from it — never hand-write clients.
- Every documented endpoint has at least one integration test.

## Money, numbers, time

- Money = integer minor units + currency; arithmetic only through `Money`; rounding per currency,
  half-even for tax lines unless the jurisdiction says otherwise.
- Quantities: `numeric(18,4)`; never JS floats for money or stock.
- UTC `timestamptz` in the database; ISO 8601 on the wire; display in the user's timezone;
  accounting dates in the organization's accounting timezone.

## I18n

- Languages: `en, ru, ka, uk, az, hy` (same set as Seven CMS).
- UI strings via translation keys (Transloco in Admin, next-intl in Web); no hard-coded text.
- Content as `I18nString` jsonb; fallback requested → organization default → `en`.
- CI fails if a key is missing in any shipped language.

## Auth

- Admin/API: JWT access (15 min, memory) + refresh token rotation in an httpOnly SameSite=Strict
  cookie scoped to `/api/v1/auth`; the refresh call also requires a custom header (CSRF-safe).
- Web: session cookie owned by the Next.js server; API calls happen server-side.
- Permissions `module:entity:action`; check in guards and again in services for record rules.

## Database

- Schema changes only through migrations; migrations reviewed like code; a fresh-install test runs
  in CI on every change.
- Index names: `<table>_<cols>_idx`; unique: `<table>_<cols>_uniq`.
- Soft delete via `deleted_at` for master data; financial documents are cancelled, never deleted.
- Row-level security on every tenant table.

## Logging & errors

- Structured JSON logs (pino) with `requestId`, `orgId`, `userId`, `route`, `durationMs`.
- Audit log for every state change; never log secrets, tokens or card data.
- Errors are typed (`DomainError` with a code); controllers map them to HTTP codes.

## Git

- Trunk-based on `main`; small commits with conventional messages (`feat(crm): …`, `fix(billing): …`).
- CI on every push: lint, typecheck, unit, integration (Testcontainers), fresh-install, build.
