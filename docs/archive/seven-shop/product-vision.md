# Product vision

Seven Shop is a **standalone e-commerce platform**. The seller's main business is *selling*, not publishing content. They have a catalog (often large), inventory, customer base, and revenue depends on the store working well.

## Three audiences

| Audience | What they need |
|---|---|
| **Sellers** (admin) | Easy catalog management, clear orders dashboard, inventory tracking, marketing tools, real revenue |
| **Customers** (storefront) | Fast browsing, trust (reviews, ratings), smooth checkout, order tracking, account history |
| **Developers** (integrations) | Clean REST API, webhooks, theming, custom fields |

## MVP (Phase 1) scope

### Storefront (public shop)

- Product listing with filters (category, price, attributes)
- Search (basic — full-text on name + description)
- Product detail with variants (size, colour, …)
- Cart (guest + logged-in, persisted via cookie + DB)
- Checkout (address, shipping, payment)
- Order confirmation page + email
- Customer account: order history, addresses, change password
- Multi-currency display (with one base currency for accounting)
- Multi-language (i18n strings on products, categories)

### Admin

- Product CRUD with variants, images, inventory
- Category tree (drag-and-drop reorder)
- Orders list + detail (mark paid, mark shipped, cancel, refund)
- Customers list + detail
- Discounts (codes, percentage/fixed/free shipping, date ranges)
- Basic shipping zones + rates
- Basic tax rates per region
- Settings: store info, currency, languages, payment gateways
- Dashboard: today's orders, revenue, pending fulfillment

### Integrations

- Stripe (cards, Apple/Google Pay)
- PayPal
- Manual payment (bank transfer, COD)

## Phase 2 (after MVP works)

- **Subscriptions** for recurring goods (subscription boxes, refills)
- **Reviews & ratings** with moderation
- **Wishlists**
- **Coupons** beyond simple discounts (BOGO, tiered)
- **Loyalty / referrals**
- **Email marketing** — abandoned cart, win-back, post-purchase. Probably integrate Mailgun/SendGrid rather than build.
- **Advanced search** — Elasticsearch / MeiliSearch with facets, typo tolerance, synonyms
- **Multi-vendor / marketplace** — let multiple sellers list. Big project, adds commission engine, KYC, payouts. Only do this if first customer asks.
- **Headless mode** — sellers building their own frontend, using only our API
- **POS** (point of sale) — sellers using the shop in physical retail. Partial inventory sharing with online.

## Phase 3 (if the product takes off)

- **Multi-store** — one seller running several stores from one admin
- **B2B features** — quotes, custom price lists, NET-30 terms, bulk pricing
- **Localized payment gateways** for specific markets (Yookassa for Russia, IDRAM for Armenia, BOG for Georgia, etc.)
- **Mobile apps** for the seller's customers (white-label storefront app)

## What this is NOT

- **A CMS.** Use sevenPHP for content.
- **A page builder.** No drag-and-drop sections beyond what's needed for product/category pages. The storefront has a fixed (but themeable) structure.
- **A marketing automation tool.** Email blasts, segmentation, drip campaigns are out of scope. Integrate Mailchimp/Klaviyo if needed.
- **An ERP.** No GL, no double-entry bookkeeping. Orders flow out via webhook to whoever's doing the accounting (could be sevenAngular.io's ERP, could be QuickBooks).
- **A full subscription billing platform.** That's sevenAngular.io's Billing app. Seven Shop has subscriptions for the simple "ship me a box every month" case; complex usage-based billing isn't the goal.

## Differentiation from existing players

| Player | Their strength | Where Seven Shop wins |
|---|---|---|
| **Shopify** | Polished, huge ecosystem | Self-hosted, no per-transaction fees, Russian/CIS payment gateways |
| **WooCommerce** | Free, large plugin library | Modern stack (Vue 3 instead of jQuery + WP), faster, better admin UX |
| **Medusa.js** | Headless, modern | Built-in storefront (Medusa requires you to build your own) |
| **PrestaShop** | Mature | Not PHP, not legacy. Cleaner code, faster to extend |

We're not trying to beat Shopify on polish. We're aiming at sellers in the CIS/Caucasus/Eastern Europe region who:
- Want self-hosting (data ownership, no per-sale tax to Shopify)
- Need local payment gateways Shopify doesn't support
- Want a modern, hackable codebase rather than WP/PHP plugin chaos
- Speak ru/ka/uk/az/hy and want UI in their language

## Success metrics (someday)

- 100 active stores using it in production
- Average store handling >$10k/month GMV
- <2s storefront page load on mobile 3G
- <5% checkout abandonment from technical issues (slow API, payment errors)
