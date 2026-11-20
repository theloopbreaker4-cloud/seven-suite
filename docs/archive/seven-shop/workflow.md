# Workflow

## Common commands

```bash
# Backend (Express, port 3003)
cd backend
node src/api/index.js                  # production-ish run
npm run dev                            # nodemon if configured

# Frontend (Vite, port 8086 — single dev server for storefront + admin)
cd frontend
npm run dev                            # http://localhost:8086
npm run build                          # production bundle
npm run preview                        # preview prod build

# DB (MongoDB in WSL Docker)
docker run -d --name shop-mongo -p 27017:27017 mongo:7
```

## Local URLs

- Storefront: http://localhost:8086
- Admin: http://localhost:8086/admin
- API: http://localhost:3003 (Vite proxies `/api` and `/uploads` to it)

## Default admin (after seed)

`admin@sevenshop.com / Admin123!` — change in `backend/src/api/seed.js` if seeding script exists.

## Adding a new admin page

1. Create page component: `frontend/src/pages/admin/FooPage.vue`
2. Register route in `frontend/src/router/index.js` under `/admin/foo` with `meta: { admin: true }`
3. Add sidebar link in `frontend/src/components/AdminLayout.vue`
4. Backend route(s): `backend/src/api/routes/admin/foo.js` mounted in `index.js`
5. Schema if new entity: `backend/src/api/schemas/Foo.js`

## Adding a storefront page

1. Page component: `frontend/src/pages/shop/FooPage.vue`
2. Register route at `/foo` (or wherever) without `meta: { admin: true }`
3. If it uses data: composable like `useFoo()` calling the API

## Storefront SEO

- Set `<title>` and `<meta description>` per page via `useHead()` (vueuse-head or similar — add when needed)
- Each product page gets `og:image`, `og:title`, `og:description` from product data
- Sitemap at `/sitemap.xml` generated server-side from active products + categories

For real SEO (search engine indexing of products), pre-render product/category pages at build time with `vite-ssg` — but this is Phase 2.

## Database migrations

- Each migration is a JS file in `backend/migrations/YYYY_MM_DD_HHMMSS_description.js`
- Has `async up(db)` and `async down(db)` functions
- Tracking collection `_migrations` records which have run
- Run via `node backend/scripts/migrate.js` (write this script when needed)

## Adding a payment gateway

1. Create `backend/src/api/services/payment/foo.js` with the same interface as `stripe.js`:
   - `createPaymentIntent(amount, currency, metadata)`
   - `capturePayment(paymentId)`
   - `refundPayment(paymentId, amount)`
   - `verifyWebhookSignature(rawBody, signature)`
2. Add webhook route: `backend/src/api/webhooks/foo.js` — idempotent processing of incoming events
3. Register in payment provider registry (when one exists) so admin can enable/disable
4. Document in `docs/payments-foo.md`

## Testing

- **Unit tests:** Vitest. Cover pricing service, tax calculator, shipping calculator — anything pure-logic. Run `npm test`.
- **Integration tests:** TBD. Need test DB setup; postpone until services stabilize.
- **E2E:** Playwright for the checkout flow. Critical because checkout breakage = lost sales.

## Build & deploy

Production:

```bash
# Backend
cd backend && npm install --production
NODE_ENV=production node src/api/index.js

# Frontend
cd frontend && npm install && npm run build
# serve dist/ via nginx or any static host
```

Reverse proxy (nginx) routes:
- `/api/*` and `/uploads/*` → backend (port 3003)
- everything else → frontend `dist/`

## Don't

- **Don't trust client-supplied prices.** Always recompute via `services/pricing.js`.
- **Don't skip webhook signature verification.** Stripe/PayPal webhooks must be verified or anyone can spoof a "payment succeeded" event.
- **Don't decrement inventory at cart-add time.** Decrement on order placement (or reserve at checkout-start, commit on payment).
- **Don't store payment card data.** Use gateway tokens only. PCI scope must stay minimal.
- **Don't share business logic with sevenPHP or sevenAngular.io.** They're separate products. Conventions/styling are shared; logic is not.
- **Don't put everything in one mega-route.** If `routes/admin/products.js` is over 500 lines, split it.
