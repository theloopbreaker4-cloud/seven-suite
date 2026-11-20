# Architecture

## High-level layout

```
sevenVUE/
├── backend/                         Express + Mongoose API
│   └── src/api/
│       ├── index.js                 entry point, middleware setup, route mounting
│       ├── middleware/
│       │   ├── auth.js              requireAuth, adminOnly, optionalAuth
│       │   ├── rate-limit.js        per-route Redis-backed rate limiting
│       │   └── error.js             centralized error handler
│       ├── schemas/                 Mongoose schemas (Product, Order, Customer, …)
│       ├── models/                  thin model wrappers (mongoose.model exports)
│       ├── routes/
│       │   ├── auth.js              login, register, refresh, password reset
│       │   ├── catalog.js           public product browsing
│       │   ├── cart.js              cart management (guest + logged-in)
│       │   ├── checkout.js          checkout flow
│       │   ├── orders.js            customer-facing order history
│       │   └── admin/               admin-only routes
│       │       ├── products.js
│       │       ├── orders.js
│       │       ├── customers.js
│       │       ├── discounts.js
│       │       ├── shipping.js
│       │       ├── taxes.js
│       │       └── settings.js
│       ├── services/
│       │   ├── pricing.js           price calculation (variants, discounts, taxes)
│       │   ├── inventory.js         stock decrement, reservation
│       │   ├── shipping.js          rate calculation by zone
│       │   ├── tax.js               rate lookup by region
│       │   ├── payment/
│       │   │   ├── stripe.js
│       │   │   ├── paypal.js
│       │   │   └── manual.js
│       │   └── email.js             order confirmation, shipping notification, etc.
│       └── webhooks/
│           ├── stripe.js
│           └── paypal.js
└── frontend/                        Vue 3 + Vite (single bundle, two app shells)
    └── src/
        ├── main.js
        ├── App.vue                  <RouterView /> + global toast/dialog stack
        ├── style.css                Tailwind + theme tokens
        ├── router/index.js          unified routing with /admin guard
        ├── stores/                  Pinia stores
        │   ├── auth.js              shared between storefront and admin
        │   ├── cart.js              storefront cart state
        │   ├── i18n.js              language switching
        │   ├── theme.js             dark/light + palette
        │   └── toast.js             notifications
        ├── components/
        │   ├── shop/                storefront-only components (ProductCard, CartDrawer, …)
        │   ├── admin/               admin-only components (DataTable, FormField, …)
        │   ├── ShopLayout.vue       storefront shell (header, nav, footer)
        │   └── AdminLayout.vue      admin shell (sidebar, breadcrumbs)
        └── pages/
            ├── shop/                /, /products, /products/:slug, /cart, /checkout, /account/*, /signin, …
            └── admin/               /admin, /admin/products, /admin/orders, /admin/customers, …
```

## Single-bundle vs two-bundle

Currently one Vite project that builds **one bundle** with two layouts/routers. Pros: shared theme, shared auth store, simpler dev. Cons: storefront downloads admin JS (small overhead).

If admin JS grows large, **split** into two Vite projects (`frontend/storefront/` and `frontend/admin/`) with shared `libs/` directory. Don't do this preemptively — the overhead of one shared bundle is ~30 KB gzipped; not worth a multi-package setup until the bundle is >500 KB.

## Backend conventions

- **One Express app** (`backend/src/api/index.js`). All routes mounted there.
- **Routes are thin** — they parse the request, call a service, return JSON. No business logic in route handlers.
- **Services own logic** — `services/pricing.js` is the single source of truth for "how much does this cart cost." Routes/admin tools/checkout all call it.
- **Mongoose models** are thin wrappers around schemas. No business methods on the model — those go in services.

## Pricing pipeline (the most important service)

`pricing.js::calculate(cart, customer?, options?)` returns:

```ts
{
  subtotal: number,           // sum of line prices before discounts
  discounts: Discount[],      // applied
  discountTotal: number,
  tax: TaxBreakdown[],        // by jurisdiction
  taxTotal: number,
  shipping: ShippingOption[],
  shippingTotal: number,      // selected option
  total: number,
  currency: string,
}
```

**Order of operations** (matters for tax):

1. Sum line items (qty × variant.price)
2. Apply line-level discounts (% off this product)
3. Apply cart-level discounts (% off cart, fixed amount)
4. Add shipping
5. Calculate tax (depends on region: tax-inclusive vs exclusive)
6. Compute total

This is one place because every consumer (cart preview, checkout, admin order edit) must see the same numbers. **Never recompute manually.**

## Cart strategy

Two cart "owners":

- **Guest cart:** stored in DB keyed by a long-lived `cart_token` cookie. Survives browser sessions.
- **Customer cart:** stored in DB keyed by `customerId`. Multiple devices = same cart.

On login, merge: take all line items from guest cart, deduplicate against customer cart, switch the token to customer cart. Old guest cart deleted.

Cart items store `variantId` + `quantity`. Prices are **always recalculated** on the server side — never trust a price from the client. The client may **display** a stale price; the truth is `pricing.calculate()` at checkout.

## Order state machine

```
draft  →  pending_payment  →  paid  →  fulfilled  →  shipped  →  delivered
                          ↘  failed
                              ↘  cancelled
                                  ↘  refunded
```

Once an order is `paid`, **inventory is decremented** (committed reservation). `cancelled` from `paid` → restock + refund. `refunded` from `delivered` is partial — refund money but don't restock unless customer returns.

## Auth

- **Customers** auth: JWT in `Authorization` header. Refresh token rotation. Storefront uses `httpOnly` cookie for refresh.
- **Admins** auth: same JWT system, but JWT contains `role: 'admin'`. The `/admin/*` routes check this.
- **Guest carts** auth: long-lived cookie token (no JWT). Revealed only as cart-read permission.

## Webhooks (incoming from gateways)

- **Idempotent** — every gateway sends the same event 2-3 times in retries. Track `gatewayEventId` and skip duplicates.
- **Signature verification** — Stripe signs with `Stripe-Signature` header; verify before processing.
- **Timeout-safe** — return 200 OK quickly, queue heavy work (order status update + email) for async processing.
- **Idempotent against our DB** — `payment.succeeded` should never create two payment records.

## What this architecture deliberately doesn't have

- **GraphQL.** REST is fine for e-commerce; GraphQL adds complexity that pays off only with diverse clients.
- **Server-side rendering / SSG.** Storefront is Vue SPA — fine for SEO if we add pre-rendering for product/category pages later (Vite SSG plugin). Not needed for MVP.
- **Microservices.** One Express process for everything.
- **Real-time updates.** Polling is fine for admin notifications; WebSockets only if a feature really needs it (live inventory countdown for flash sales, maybe).
