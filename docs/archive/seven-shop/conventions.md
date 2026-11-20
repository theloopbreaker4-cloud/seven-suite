# Conventions

## File naming

- **Vue components:** PascalCase, `.vue` extension. `ProductCard.vue`, `CartDrawer.vue`.
- **Stores (Pinia):** camelCase, `useFooStore` export. `auth.js` exporting `useAuthStore`.
- **Routes:** kebab-case URL segments, camelCase file names. `routes/admin/products.js`.
- **Schemas (Mongoose):** PascalCase singular. `Product.js`, `Order.js`.
- **Utilities:** kebab-case. `format-money.js`, `validate-email.js`.

## File header

Every JS / Vue source file starts with:

```js
/** Seven Shop — github.com/<org>/<repo> */
```

(Update repo URL when repo is set up.)

## Code style

- **ES modules** everywhere (`import`/`export`, no CommonJS in new code)
- **Async/await** preferred over `.then()` chains
- **No `var`** — `const` by default, `let` when reassigning
- **Strict equality** (`===`, `!==`)
- **No `any` in TypeScript** if/when we add it; for now JS is fine
- **ESLint + Prettier** — standard config, no bikeshedding
- **Comments in English.** Only when *why* is non-obvious. Never narrate *what*.
- **No emojis** in code/files unless user explicitly asks.

## API conventions

### Endpoint shape

```
Public storefront:
  GET  /api/products                   list (with filters)
  GET  /api/products/:slug             detail
  GET  /api/categories
  GET  /api/cart                       (uses cart_token cookie)
  POST /api/cart/items
  PATCH /api/cart/items/:id
  POST /api/checkout/start
  POST /api/checkout/complete
  GET  /api/orders/:id                 (customer-scoped)

Admin:
  GET    /api/admin/products
  POST   /api/admin/products
  PATCH  /api/admin/products/:id
  DELETE /api/admin/products/:id       soft-delete (status='archived')
  ... etc.
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

- `200 OK` for GET / PATCH / DELETE success
- `201 Created` for POST success
- `400 Bad Request` for malformed input
- `401 Unauthorized` for missing JWT (or invalid token)
- `403 Forbidden` for valid JWT but insufficient permissions
- `404 Not Found` for missing resource
- `409 Conflict` for unique-constraint violation (e.g. duplicate SKU)
- `422 Unprocessable Entity` for validation errors with `fields`
- `429 Too Many Requests` for rate limit
- `500` for actual bugs

## Money

- **Always integer minor units.** `1999` for $19.99.
- Pricing service is the single source of truth — never compute prices on the client.
- Display via a centralized `formatMoney(amount, currency, locale)` helper.

## Dates / time

- ISO 8601 strings on the wire (`"2026-04-30T12:34:56Z"`). UTC.
- Timezone-aware features (delivery windows, store hours) — store the timezone explicitly on the Shop settings; convert in UI.

## I18n

- All user-facing strings either i18n keys (UI chrome) or `I18nString` objects (content like product names).
- Languages: `en, ru, ka, uk, az, hy`.

## Auth

- JWT in `Authorization: Bearer <token>` header for all `/api/*` calls
- Refresh token in `httpOnly`, `secure`, `samesite=Strict` cookie
- **Don't put access tokens in cookies.** SPA-friendly = headers.
- **Cart token** is a separate, long-lived cookie (`cart_token`). Not a JWT, just an opaque random ID.

## Validation

- **Server side:** validate every input. Use a schema validator (joi/zod). Reject early at route boundary.
- **Client side:** mirror the validation for UX. Inline errors with theme-aware styling (same conventions as sevenPHP — `.form-error--inline` etc.)
- **Server is the truth.** Client validation is for UX only.

## Logging

- Backend: structured JSON in production (`{ ts, level, msg, requestId, userId, path, duration }`)
- Audit log for admin state changes — who changed what, when. Stored in DB, not just in logs.
- **Don't log secrets** (tokens, passwords, payment details).

## Database

- Indexes named meaningfully: `email_idx` on `Customer.email` (unique), `slug_idx` on `Product.slug` (unique), etc.
- Add an index whenever you write a query that filters/sorts on a non-trivial field.
- Soft-delete by default — `isActive: false` or `status: 'archived'`. Don't `Model.deleteOne()`.
- Schema migrations: track via a `migrations` collection. Each migration is a JS file in `backend/migrations/` with `up()` and `down()` functions.

## Frontend conventions

- **Pinia for state** — one store per domain (`auth`, `cart`, `i18n`, `theme`, `toast`)
- **Composition API** — script setup syntax. No options API in new components.
- **Reactive Form pattern** — central `useForm` composable mirroring sevenPHP `forms.js` UX (inline errors, shake on invalid, toast).
- **No global event bus.** Prop down, emit up. Pinia for shared state.
- **CSS:** Tailwind utility classes + theme tokens. No `<style scoped>` for one-off styling unless you really need a complex selector.

## Documentation

- Each module/folder has a `README.md` explaining its purpose.
- API endpoints documented via OpenAPI/Swagger spec (auto-generate from route definitions if possible).
- Cross-cutting concerns documented in `docs/`.
