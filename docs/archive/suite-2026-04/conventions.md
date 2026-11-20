# Conventions

## File naming

- **Angular:** kebab-case files, PascalCase components/services. `deal-list.component.ts`, `DealListComponent`. Standalone components by default.
- **NestJS:** module folder per domain area. Each has `*.schema.ts`, `*.service.ts`, `*.controller.ts`, `*.module.ts`. Optionally `*.dto.ts` for input validation.
- **Tests:** colocated `*.spec.ts` next to the file under test.

## File header

Every TypeScript source file:

```ts
/** Seven Suite — github.com/<org>/<repo> */
```

(Update repo URL when repo is set up.)

## Code style

- **Strict TS** — `strict: true`, `noImplicitAny: true`, `strictNullChecks: true`. No `any` without a `// eslint-disable` comment explaining why.
- **ESLint + Prettier.** Standard NX config, no bikeshedding.
- **Comments in English.** Only for non-obvious *why*. Never narrate what.
- **No emojis** in code or files unless user explicitly asks.

## API conventions

### Endpoint shape

```
GET    /api/crm/deals                  list
GET    /api/crm/deals/:id              detail
POST   /api/crm/deals                  create
PATCH  /api/crm/deals/:id              partial update
DELETE /api/crm/deals/:id              soft-delete (sets isActive=false, never hard-deletes)
```

### List response

```json
{
  "items": [...],
  "total": 142,
  "limit": 20,
  "offset": 40
}
```

### Error response

```json
{
  "error": "Human-readable message",
  "code": "machine_readable_code",
  "fields": { "email": "Invalid format" }
}
```

### Status codes

- `200 OK` for successful GET/PATCH/DELETE
- `201 Created` for successful POST
- `400 Bad Request` for malformed input
- `401 Unauthorized` for missing/invalid JWT
- `403 Forbidden` for valid JWT but missing permission
- `404 Not Found` for missing resource (or hidden by RBAC — don't leak existence)
- `409 Conflict` for unique-constraint violations
- `422 Unprocessable Entity` for validation errors with `fields`
- `429 Too Many Requests` for rate limit
- `500` for actual bugs only

## Money

- **Always integer minor units.** `amount: 1999` for $19.99.
- Use a `Money` value object for arithmetic (don't add raw numbers — easy to make currency mistakes).
- Display via a centralized `MoneyPipe` that knows currency formatting per locale.

## Dates / time

- ISO 8601 strings on the wire (`"2026-04-30T12:34:56Z"`).
- Internal: store as `Date` (Mongo) or `timestamp` (Postgres). Always UTC.
- Display: convert to user's timezone in the UI layer (`Intl.DateTimeFormat`).
- Period-sensitive operations (invoice posting, period close) — be explicit about what timezone defines a "day": usually the company's accounting timezone, set per organization.

## I18n

- All user-facing strings via i18n key, never hardcoded.
- Languages: `en, ru, ka, uk, az, hy` — same as sevenPHP for consistency.
- Content fields stored as `I18nString` object (see `data-model.md`).

## Validation

- Backend: `class-validator` decorators on DTOs. Reject early at controller boundary.
- Frontend: Angular Reactive Forms. Custom `FormValidator` service in `libs/ui/` mirrors the sevenPHP UX (inline errors, shake on invalid, toast).

## Auth / RBAC

- JWT in `Authorization: Bearer <token>` header for all `/api/*` calls.
- **Never** put auth tokens in cookies for the API (CSRF concerns moot, but it complicates SPA architecture).
- Permissions are granular: `crm:deal:write`, `billing:invoice:void`, `erp:gl:post`. Frontend hides UI; backend re-checks on every request.
- `Csrf` is **not** used here — JWT in header is sufficient. Don't bring CSRF over from sevenPHP.

## Logging

- Server: NestJS Logger, structured JSON in production. Include `requestId`, `userId`, `path`, `duration`.
- Audit log for any state-changing action. Critical for ERP compliance.
- **Don't log secrets.** No tokens, no passwords, no payment details.

## Database

- **Indexes** named meaningfully: `partyId_idx`, `status_dueDate_idx`. Add an index whenever you write a query that filters/sorts on a non-trivial field.
- **Soft delete**: set `isActive=false`, don't `db.collection.delete()`. Audit trails depend on history.
- **Schema migrations**: each domain module owns its schema. Use Mongoose schema versioning if needed.

## Documentation

- Each module has a `README.md` explaining its public API and key invariants.
- API endpoints documented via Swagger (`@nestjs/swagger`) auto-generated from DTOs.
- Cross-cutting concerns (auth flow, event flow, period close) documented in `docs/`.
