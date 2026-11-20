# TODO — Seven Shop

Roadmap for the Storefront-as-a-Service rewrite. Status: **planning**, no Seven Shop code written yet.

## Phase 0 — Decide

- [ ] Pick storefront rendering: SPA (Vue Router) or pre-rendered (vite-ssg) for SEO? Recommendation: SPA for MVP, add SSG for product/category pages in Phase 2.
- [ ] Pick first localized payment gateway to support beyond Stripe/PayPal (Yookassa for RU, IDRAM for AM, BOG for GE — pick one based on first user feedback).
- [ ] Decide whether to keep the existing Express+Mongoose codebase as a starting point or scaffold fresh. Recommendation: keep it, gradually replace CMS routes with shop routes.

## Phase 1 — Foundation cleanup

- [ ] Remove legacy CMS routes from `backend/src/api/routes/` (Post, Page, Category, Tag, Comment, Menu, Slider, Social) — Seven Shop doesn't need them
- [ ] Remove legacy CMS pages from `frontend/src/pages/site/` and `frontend/src/pages/admin/` (Posts, Pages, Categories, Tags, Comments, Slider, Menus, Social)
- [ ] Keep: `auth`, `users`, `media` (will be reused for product images)
- [ ] Reset `backend/.env.example` for shop-specific config

## Phase 2 — Catalog

- [ ] `Product` schema with variants, images, attributes, status
- [ ] `Variant` schema (price, SKU, inventory tracking, options)
- [ ] `Category` schema with parent/child tree
- [ ] Admin CRUD: products, variants, categories
- [ ] Admin: bulk import (CSV) — Phase 2.5 if needed
- [ ] Storefront: product listing with filters (category, price, attributes)
- [ ] Storefront: product detail page with variant selector
- [ ] Search: basic full-text on name + description (MongoDB text index for MVP)

## Phase 3 — Cart & Checkout

- [ ] `Cart` schema (guest cart + customer cart)
- [ ] Cart API: get, add item, update quantity, remove, clear, apply discount
- [ ] **Pricing service** (`backend/src/api/services/pricing.js`) — single source of truth for cart totals (lines, discounts, taxes, shipping)
- [ ] Cart merging on login (guest → customer)
- [ ] Storefront cart drawer + cart page
- [ ] Checkout flow: address → shipping method → payment → review
- [ ] Address book for customer accounts

## Phase 4 — Payments

- [ ] Stripe integration (Payment Intents, webhook handler with idempotency)
- [ ] PayPal integration
- [ ] Manual / bank transfer / COD as fallback
- [ ] Webhook signature verification (mandatory)
- [ ] Order placement flow: cart → reserve inventory → create order (status=pending_payment) → charge → status=paid
- [ ] Refund flow (full + partial)

## Phase 5 — Orders & Customers

- [ ] `Order` schema with status state machine (draft → pending_payment → paid → fulfilled → shipped → delivered, with cancel/refund branches)
- [ ] Inventory decrement on `paid`, restock on `cancelled`
- [ ] Order snapshots — capture product/variant data at order time, never reference live data
- [ ] Customer-facing: order history, order detail, tracking link
- [ ] Admin orders list with filters + bulk actions (mark shipped, export to CSV)
- [ ] Customer accounts: profile, addresses, password change, marketing preferences

## Phase 6 — Discounts, Shipping, Taxes

- [ ] `Discount` schema (percentage / fixed / free shipping, conditions, usage limits)
- [ ] Apply discount to cart, validate at checkout
- [ ] `ShippingZone` + `ShippingRate` schemas
- [ ] Shipping calculator (zone match → rate calculation by weight/price)
- [ ] `TaxRate` schema (per-region, inclusive vs exclusive)
- [ ] Tax calculator integrated into pricing service

## Phase 7 — Email & Notifications

- [ ] Email templates: order confirmation, shipping notification, refund, password reset, abandoned cart (Phase 7.5)
- [ ] Email service (Nodemailer + SMTP for MVP, switch to provider API later)
- [ ] Admin notification: new order, payment failed, low stock alert

## Phase 8 — Storefront polish

- [ ] Theme system: pick layout, colors, typography from admin
- [ ] Multiple themes selectable per shop
- [ ] Mobile-responsive at every breakpoint
- [ ] Product image gallery with zoom
- [ ] Category and product page SEO (meta tags, structured data, OG tags)
- [ ] Sitemap.xml generation
- [ ] Storefront performance: <2s page load on 3G mobile

## Phase 9 — Subscriptions (optional, post-MVP)

- [ ] Subscription schema for "ship me a box every N weeks"
- [ ] Recurring billing via Stripe Subscriptions
- [ ] Pause / resume / cancel customer-facing UI
- [ ] Failed payment retry flow

## Phase 10 — Localized payment gateways

- [ ] Yookassa (Russia)
- [ ] IDRAM (Armenia)
- [ ] BOG / TBC (Georgia)
- [ ] LiqPay / WayForPay (Ukraine)

Each is its own service module with the same interface as `stripe.js`.

## Phase 11+ (long term)

- **Multi-vendor marketplace** — let multiple sellers list. Adds commission engine, KYC, payouts via Stripe Connect.
- **Headless mode** — sellers using only the API, building their own frontend.
- **POS** — physical-store cash register with shared inventory.
- **Multi-store** — one seller running multiple stores from one admin.
- **B2B** — quotes, custom price lists, NET-30 terms, bulk pricing.

## Cross-cutting concerns

- [ ] **Audit log** — admin state changes recorded with userId, timestamp, before/after
- [ ] **Rate limiting** — Redis-backed, per-IP per-action (login, password reset, cart abuse)
- [ ] **CSRF** — only needed if we add cookie-based auth; currently JWT in header sidesteps it
- [ ] **Localization** — all UI strings via i18n keys, all content as `I18nString` objects, languages: `en, ru, ka, uk, az, hy`
- [ ] **Backups** — automated MongoDB dumps, S3 storage
- [ ] **Monitoring** — Sentry for errors, basic uptime monitoring

## Won't do

- ~~Replicate sevenPHP CMS features~~ — Seven Shop and the CMS are different products with different audiences.
- ~~Share business logic with sevenAngular.io's Billing module~~ — Suite Billing is for B2B subscription/usage billing; Seven Shop has its own simpler subscription model.
- ~~Build a page builder~~ — out of scope. Storefront has fixed structure with theming.
- ~~Build marketing automation~~ — integrate Mailchimp/Klaviyo if/when needed.
- ~~GraphQL API~~ — REST is sufficient, GraphQL adds complexity that doesn't pay off for e-commerce.
- ~~Microservices~~ — one Express process is fine until traffic warrants splitting.

## Open questions

- [ ] **Inventory sync between online and physical retail** — needed if we add POS in Phase 11. Real-time? Periodic batch? Decide when POS is in scope.
- [ ] **Multi-currency strategy** — display in customer's currency but charge in store's base currency? Or maintain separate prices per currency? (Recommendation: display only, charge in base — simpler.)
- [ ] **Tax engine** — roll our own or integrate TaxJar? TaxJar is ~$19/mo per shop — viable if first sellers are small. EU VAT MOSS is a months-long project to do correctly.
