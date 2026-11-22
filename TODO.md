# TODO — Seven Suite roadmap

Milestones are in build order. **Each one ends with something usable on its own** — a release you
can demo or sell — so the project never sits half-finished. Estimates are for one developer working
full time; treat them as ranges, not promises. Background: [`docs/`](docs/README.md).

| Milestone | Delivers                                                                             | Estimate  |
| --------- | ------------------------------------------------------------------------------------ | --------- |
| M0        | Analysis, decisions, plan (this)                                                     | done      |
| M1        | Foundation: monorepo, platform kernel, auth, tenants, admin + web shells, CI, deploy | 3–4 weeks |
| M2        | Core business data: Party, Product, files, timeline, numbering, settings, meta-UI    | 3 weeks   |
| M3        | **CRM** — first sellable product                                                     | 3–4 weeks |
| M4        | **Content + Web** — the organization's website                                       | 2–3 weeks |
| M5        | **Commerce** — online shop with local gateways                                       | 5–6 weeks |
| M6        | **Billing** — invoices, subscriptions, dunning                                       | 3–4 weeks |
| M7        | **Accounting** + Georgian localization                                               | 5–6 weeks |
| M8        | **Inventory + Procurement**                                                          | 4–5 weeks |
| M9        | **Marketplace**                                                                      | 4–5 weeks |
| M10       | Platform power: custom fields, automation, search, reports                           | 4 weeks   |
| M11       | HR & payroll (GE), cloud SaaS, 1.0                                                   | 4+ weeks  |

Rough total to 1.0: **10–12 months**. CRM (M3) is sellable after ~2.5 months.

---

## M0 — Analysis and plan ✅

- [x] Market analysis and feature matrix → `docs/01-analysis.md`
- [x] Vision, modules, boundaries → `docs/02-vision.md`
- [x] Architecture → `docs/03-architecture.md`
- [x] Data model (PostgreSQL) → `docs/04-data-model.md`
- [x] Event catalog → `docs/05-events.md`
- [x] Conventions → `docs/06-conventions.md`
- [x] Decisions (ADR-001…009) → `docs/07-decisions.md`
- [x] Seven Shop plans merged → `docs/archive/seven-shop/`
- [x] Archive the `seven-shop` repository on GitHub
- [ ] OD-1: choose a licence before the first public release

---

## M1 — Foundation (3–4 weeks)

**Done when:** `docker compose up` gives a running API, worker, admin and web; a user can sign up,
create an organization, invite a teammate with a role, log in with 2FA; CI is green; a deploy to
the VPS works with one command.

### Repository & tooling

- [x] Remove legacy CMS clone: `backend/`, `frontend/`, `shared/`, `doc/`, `tests/`, `gulpfile.js`, `index.html`, old `package.json`
- [x] Scaffold NX 24 workspace at the repo root (pnpm, integrated layout): `apps/api`, `apps/worker`, `apps/admin`, `apps/web`
- [ ] Libraries: `libs/shared`, `libs/api-client`, `libs/server/platform`, `libs/server/core`, `libs/admin/ui`, `libs/admin/meta-ui`, `libs/web/ui` — _done: shared, server/platform, server/core; rest when first used_
- [x] NX tags + `enforce-module-boundaries` rules per layer and scope (verified to fail on a violation)
- [ ] TS strict, ESLint, Prettier, commit hooks (lint-staged), conventional commits
- [x] `docker/compose.dev.yml`: PostgreSQL 16 (+ RLS app role, test DB), Redis 7, S3 (SeaweedFS), Mailpit
- [x] `.env.example`; config module with zod schema validation (fails fast, lists every problem)
- [ ] GitHub Actions: lint · typecheck · unit · integration · build · fresh-install — _done: everything except the fresh-install job; integration runs on a real PostgreSQL + Redis service as the RLS-bound app role_

### Platform kernel (`libs/server/platform`)

- [x] Prisma 7: multi-file schema, Postgres schema per module (`platform`), migration workflow — _seed runner pending_
- [x] Request context (AsyncLocalStorage): requestId, orgId, userId, locale — _also actor (user/API key) and ip; X-Request-Id echoed_
- [x] Tenancy: RLS policies + `PrismaService.withOrg()` (`app.org_id` per transaction) + integration test with two tenants — _org resolution from request pending_
- [ ] Transactions helper (unit of work) shared by repositories
- [x] Outbox: `outbox_event` written in-transaction; dispatcher in worker; `processed_event` idempotency; retries + dead-letter — _`emitEvent(tx,…)`, `EventBus.subscribe()`, 7-day retention_
- [x] BullMQ setup: queues, repeatable jobs (scheduler), dashboard (Bull Board) behind admin auth — _own System → Queues page instead of Bull Board (strict CSP), operators only (PLATFORM_ADMINS)_
- [ ] Cache + rate limiter (Redis) — _done: `RateLimiter` (fixed window); cache pending_
- [x] Structured logging (pino), request ids, credential redaction; error filter → `{ error, code, fields }` (500s never leak details)
- [x] Health endpoints (`/api/v1/health/live`, `/ready` checks PostgreSQL + Redis)
- [ ] OpenAPI generation + `libs/api-client` generation script
- [ ] Module manifest system: id, requires, permissions, settings schema, menu entries; enable/disable per org with dependency checks

### Identity & access

- [x] User, Organization, Membership, Role (permissions as `module:entity:action` strings), RefreshToken tables + migrations
- [x] Sign-up (creates org + system roles owner/admin/member), login, logout, `/auth/me`, email verification, password reset (single-use hashed tokens; reset signs out every session)
- [x] JWT access (HS256 via jose, 15 min) + rotating refresh in an httpOnly SameSite=Strict cookie; reuse revokes the whole family; refresh/logout need `X-Requested-With` (CSRF)
- [x] TOTP 2FA + recovery codes — _encrypted secret, no code reuse, admin Security page, login step_
- [x] Invite members by email (cannot grant more than you have), accept as new or existing user, switch organization
- [x] Deny-by-default global guard, `@Public()`, `@RequirePermission(...)` with `*` wildcards — _record-rule hook pending_
- [x] API keys (hashed, scoped) — _capped by the creator's current role, `@UserOnly()` routes, admin page_
- [x] Login rate limits in Redis (5 per account+IP, 30 per IP / 15 min); timing-safe login for unknown emails — _auth audit done (login, failures, 2FA, keys); refresh/reset limits pending_
- [x] Security headers, CORS policy, CSP for admin — _API: CSP `default-src 'none'`, nosniff, frame deny, no-store, no CORS (tested); admin: strict CSP + HSTS in nginx; web (Next.js) when it ships_

### Admin shell (Angular)

- [x] Layout: sidebar filtered by permission, top bar (org switcher, language, theme, user, sign out), mobile menu — _search and notifications come with M2_
- [x] Auth flows: sign-up, login, forgot/reset password, email verification, invitation accept; session restored from the refresh cookie on reload — _2FA screen comes with TOTP_
- [x] HTTP interceptor (token, CSRF header, one shared refresh then replay, redirect to login), `*svCan` permission directive, API error codes shown in the UI language
- [ ] Theme tokens (light/dark), Tailwind 4, base components — _done: tokens, light/dark, buttons, inputs, field, card, toast; date/money/table/dialog/empty state with M2 meta-UI_
- [x] i18n with Transloco — _en, ru, ka, uk, az, hy complete; unit test checks every key and placeholder_
- [x] Settings area — _members, roles editor, organization profile, API keys, security (2FA)_

- [x] Move the Playwright smoke test (`d:/Works/tools/seven-suite-e2e/admin-smoke.mjs`, 8 steps, passing) into `apps/admin-e2e` and run it in CI — _`e2e/admin/` (smoke, 2FA/API keys, organization/roles/queues), CI step with Mailpit_

### Web shell (Next.js)

- [ ] App Router, next-intl, org resolution by domain, server-side API client with service key
- [ ] Layout, theme tokens, 404/500, health
- [ ] Customer session plumbing (httpOnly cookie held by Next)

### Deploy

- [ ] Docker images — _done: `docker/api.Dockerfile` (Node 22 slim + pruned prod deps + Prisma CLI, healthcheck); admin is static behind nginx; worker and web images pending_
- [x] nginx site (SPA fallback, `/api` proxy, Cloudflare real IP, security headers, cache rules); API container on host network with memory limit — _live at https://seven.toolpix.dev/suite/ (path on the showcase domain: `PUBLIC_BASE_PATH=/suite`, admin built with `--base-href=/suite/`, nginx strips the prefix for the API); Playwright smoke passes against production_
- [x] Deploy script `d:/Works/tools/seven-suite-deploy.sh` (local build → ~300 KB upload → image built on the server → migrate → container swap → health wait → admin swap); server setup `seven-suite-server-setup.sh` (DB + roles in shared PostgreSQL, secrets generated on the server). Rollback: `docker run` the previous `seven-suite-api:<sha>` tag
- [ ] Nightly backups — _done: `/usr/local/bin/vps-db-backup` (source `d:/Works/tools/vps-db-backup.sh`) dumps every database in the shared PostgreSQL at 03:30, verifies each archive, keeps 14 days (min 3), `--drill <db>` restores into a scratch DB and compares tables (passed for toolpix, seven_projects, seven_suite); off-site copy pending (needs a bucket, e.g. Cloudflare R2)_
- [ ] Staging instance on the VPS (subdomain), demo org with seed data

---

## M2 — Core business data (3 weeks)

**Done when:** staff can manage Parties (people and companies with roles), Products with variants,
attach files and notes to anything, and every list/form in the admin is generated from metadata.

### Core entities

- [ ] Party (+ addresses, contact links, tags, roles), merge duplicates (`core.party.merged`)
- [ ] Product master, variants, units of measure
- [ ] Currencies + FX rates (manual + daily fetch job; NBG rates for GEL)
- [ ] Tax rates and tax categories
- [ ] Numbering sequences (gap-free, row-locked) + admin for series formats
- [ ] Settings per module (schema-validated, admin UI)

### Cross-cutting

- [ ] Files: upload (MIME sniffing, server-chosen extension, size limits), public/private buckets, signed URLs, image thumbnails job
- [ ] Timeline ("chatter") on any entity: notes, @mentions, attachments, change history
- [ ] Audit log (before/after) + admin viewer
- [ ] Notifications: in-app + email; per-user preferences
- [ ] Email: provider interface (SMTP, Resend), templates per language, outbox-backed sending, Mailpit in dev — _done: SMTP via nodemailer, Mailpit in dev, in-memory capture in tests, English templates_
- [ ] Global search (Postgres FTS across Party, Product, documents)
- [ ] Import/export CSV/XLSX with mapping + dry-run (Party, Product first)
- [ ] Outgoing webhooks: subscriptions per org, HMAC-signed, retries, delivery log

### Meta-UI

- [ ] Entity metadata format (fields, types, relations, permissions, list/form layout, filters)
- [ ] Generic list (sort, filter, saved views, column chooser, bulk actions, export)
- [ ] Generic form (validation from zod schema, i18n fields editor, money/date/relation pickers)
- [ ] Generic detail page with timeline panel

---

## M3 — CRM (3–4 weeks) — first sellable product

**Done when:** a sales team can capture leads, run deals through a Kanban pipeline, log calls and
meetings, send quotes as PDF, and see pipeline reports — in ka/ru/en.

- [ ] Leads: sources, statuses, assignment rules, qualify → Party (customer) + deal
- [ ] Accounts & contacts views over Party (roles), company ↔ people
- [ ] Pipelines and stages (probability, won/lost), multiple pipelines
- [ ] Deals: Kanban (drag between stages), list, detail with timeline, products on deal, lost reasons
- [ ] Activities and tasks: due dates, reminders (BullMQ), my-day view, calendar view
- [ ] Quotes: lines, taxes, discounts, PDF (templated, per language), send by email, accept link → `crm.quote.accepted`
- [ ] Email: send from CRM; IMAP/SMTP mailbox sync → threads linked to Parties (Gmail/Microsoft OAuth later)
- [ ] Web-to-lead endpoint + embeddable form (shared with Content forms in M4)
- [ ] Duplicate detection (email/phone/tax id)
- [ ] Reports: pipeline by stage, won/lost, forecast, activity per rep
- [ ] Permissions: own/team/all record rules
- [ ] Seed demo data; screenshots; landing copy for seven.toolpix.dev
- [ ] Integration tests for every CRM endpoint; e2e: lead → deal → won

---

## M4 — Content + Web (2–3 weeks)

**Done when:** an organization publishes its multilingual website (pages, blog, menus, forms) on its
own domain with good SEO, and form submissions land in CRM.

- [ ] Pages with structured blocks (hero, text, image, gallery, features, CTA, FAQ, form, products), drafts, scheduled publish, revisions
- [ ] Blog: posts, categories, tags, authors, RSS
- [ ] Menus (header/footer), redirects (301/302), 404 log
- [ ] Media library (folders, alt text per language)
- [ ] SEO: meta per language, OpenGraph, JSON-LD, sitemap.xml, robots.txt, hreflang, canonical
- [ ] Forms builder (fields, spam protection: honeypot + rate limit + optional captcha) → `content.form.submitted` → CRM lead
- [ ] Next.js rendering of all blocks; ISR + revalidation on publish
- [ ] Themes: token presets + header/footer variants; custom CSS per org
- [ ] Custom domains per org (+ certificate flow documented)
- [ ] Lighthouse budget in CI for the demo site

---

## M5 — Commerce (5–6 weeks)

**Done when:** a shop sells physical and digital products online, takes payment through Stripe/
PayPal and at least one Georgian gateway, ships, refunds, and the customer can see orders and
download purchases. (Merged plan from Seven Shop — see `docs/archive/seven-shop/`.)

### Catalog

- [ ] Catalog presentation over core Product: slugs, status, visibility, categories tree, attributes, images
- [ ] Price lists (base + customer groups), compare-at price, per-currency prices
- [ ] Storefront: category listing with filters (category, price, attributes), sorting, pagination
- [ ] Product page: gallery, variant selector, stock badge, structured data
- [ ] Search (Postgres FTS; Meilisearch adapter later)

### Cart & checkout

- [ ] Cart (guest token + customer), merge on login, recalculated prices, expiry
- [ ] Pricing service: single source of truth for lines, discounts, tax, shipping (unit-tested)
- [ ] Checkout workflow (saga): address → shipping method → payment → place order; compensations on failure
- [ ] Discounts: percent/fixed/free shipping, conditions, usage limits, per-customer limits, date windows
- [ ] Shipping zones and rates (by weight/subtotal), pickup option
- [ ] Taxes from core tax rates; inclusive/exclusive display

### Payments

- [ ] Gateway interface in core (authorize, capture, refund, webhook verify, idempotency)
- [ ] Stripe, PayPal adapters
- [ ] Georgian gateways: Bank of Georgia (iPay), TBC — at least one in M5, the other right after
- [ ] Manual: bank transfer, cash on delivery
- [ ] Webhooks: signature verification, `gateway_ref` uniqueness, underpaid guard, replay safety

### Orders

- [ ] Orders with three statuses; snapshots of lines; admin list/detail, notes, timeline
- [ ] Fulfilment: shipments, tracking numbers, partial shipments
- [ ] Refunds (full/partial) workflow → credit note (M6) / reversal
- [ ] Digital goods: private files, download grants with atomic limits, expiry
- [ ] Customer account (Web): orders, addresses, downloads, password, language
- [ ] Emails: order confirmation, payment received, shipped, refunded, abandoned cart (job)
- [ ] Reviews with moderation
- [ ] Admin dashboard: today's orders, revenue, pending fulfilment, low stock (when M8)
- [ ] Tests: every storefront and admin endpoint; e2e checkout with a sandbox gateway; concurrency test on downloads and stock reservation

---

## M6 — Billing (3–4 weeks)

**Done when:** a business issues numbered VAT invoices (one-off and recurring), collects payments,
handles failed payments with dunning, and customers manage subscriptions in a portal.

- [ ] Plans: flat, per-unit, tiered, volume, graduated; trials; setup fees
- [ ] Subscriptions: state machine, renewals job, proration on change, pause/resume/cancel at period end
- [ ] Invoices: draft → submit (number assigned, immutable) → paid/void/uncollectible; PDF per language
- [ ] Credit notes; partial payments; overpayment as customer credit
- [ ] Payment methods (tokenized) per Party; charge on renewal
- [ ] Dunning workflow: retries schedule, reminder emails, auto-cancel after N attempts
- [ ] Customer portal (Web): invoices, pay online, subscriptions, payment methods
- [ ] Links: order → invoice, deal won → subscription/invoice
- [ ] Reports: MRR, churn, AR aging, revenue by product
- [ ] Usage metering (`usage_event`, idempotent ingestion) — basic metered price (full usage billing in M10)

---

## M7 — Accounting + Georgian localization (5–6 weeks)

**Done when:** every sales/purchase/payment document posts to a double-entry ledger, the books close
by period, VAT is computed and exportable for RS.ge, and a Georgian accountant signs off on the
reports for a test company.

- [ ] **Hire/consult a Georgian accountant** before starting (chart of accounts, VAT, RS.ge flows)
- [ ] Chart of accounts (tree), Georgian template, account types; journals
- [ ] Journal entries: draft/posted/cancelled, reversal; DB-level balance check; period lock
- [ ] Posting rules engine: invoice, payment, credit note, vendor bill, stock move, payout, payroll
- [ ] AR/AP subledgers per Party; payment allocation to invoices/bills
- [ ] Bank accounts; statement import (CSV / bank formats of BOG, TBC); reconciliation UI with matching suggestions
- [ ] Multi-currency: revaluation of open items, realized/unrealized FX gain/loss
- [ ] Periods: open/close with checklist, year-end closing entry
- [ ] Reports: trial balance, P&L, balance sheet, cash flow, general ledger, AR/AP aging, VAT report
- [ ] Localization GE module: VAT 18% rules, RS.ge e-invoice (ანგარიშ-ფაქტურა) and waybill (ზედნადები) integration via the official service API, NBG FX rates
- [ ] Exports to Excel/PDF; audit trail on every posting
- [ ] Tests: posting scenarios per document type; closed-period guard; balance invariants (property-based tests)

---

## M8 — Inventory + Procurement (4–5 weeks)

**Done when:** stock is tracked per warehouse with a full move ledger and valuation, orders reserve
and ship stock, low stock creates purchase orders, receipts update stock and vendor bills post to AP.

- [ ] Warehouses and locations; stock ledger (`stock_move`); on-hand, reserved, available
- [ ] Reservations from orders; release on cancel; backorders policy
- [ ] Transfers between warehouses; adjustments (count sheets); scrap
- [ ] Valuation: FIFO and moving average; COGS posting on shipment
- [ ] Reorder rules (min/max) → draft POs
- [ ] Suppliers (Party role vendor) + supplier prices and lead times
- [ ] RFQ → purchase order → receipt (partial) → vendor bill; three-way match warnings
- [ ] Barcodes on variants; mobile-friendly picking/receiving screens (PWA)
- [ ] Reports: stock on hand, valuation, movements, slow movers, purchase history
- [ ] Tests: ledger invariants under concurrent reservations; valuation scenarios

---

## M9 — Marketplace (4–5 weeks)

**Done when:** an operator onboards vendors who list products (moderated), customers buy from many
vendors in one checkout, the order splits per vendor, commissions are computed, vendor balances
are tracked and payouts are made (manual/bank first).

- [ ] Vendor application + approval, KYC fields and documents, vendor staff users
- [ ] Vendor portal (Admin app, vendor role): products, orders, balance, payouts, profile
- [ ] Vendor products with moderation queue; per-vendor storefront pages in Web
- [ ] Order split into vendor orders; per-vendor shipping; fulfilment by vendor
- [ ] Commission plans (percent/fixed/tiered, per-category overrides)
- [ ] Vendor ledger (append-only): sale, commission, refund, adjustment, payout; holding period before available
- [ ] Payout requests/approval; manual bank payout export; accounting postings
- [ ] Disputes and returns between customer, vendor and operator
- [ ] Vendor reviews/ratings; operator reports (GMV, commissions, top vendors)
- [ ] OD-4: evaluate bank split-payment APIs in Georgia

---

## M10 — Platform power (4 weeks)

- [ ] Custom fields on any entity (metadata + jsonb), in forms, lists, filters, imports, API
- [ ] Automation rules: trigger (event/schedule) → conditions → actions (update field, create task, send email, webhook)
- [ ] Approval workflows for documents (e.g. PO above amount needs manager)
- [ ] Report builder: pick entity, columns, filters, group by; dashboards with widgets; scheduled email reports
- [ ] Meilisearch for storefront and global search
- [ ] Usage-based billing complete (aggregations, metered tiers)
- [ ] Public API polish: API docs site, SDK (generated), Zapier/Make-style webhooks catalogue
- [ ] Performance: query review, indexes, caching, load test of checkout and lists

---

## M11 — HR & payroll, cloud, 1.0 (4+ weeks)

- [ ] Employees (Party role), departments, contracts, leave requests/approvals
- [ ] Payroll runs with Georgian rules (income tax, pension contributions) → payslips → GL
- [ ] Cloud SaaS: self-service sign-up, plans/limits per org (billed by our own Billing module), usage limits, org data export/delete
- [ ] Onboarding wizard per business type (shop, B2B distributor, services)
- [ ] Documentation site (user guide in ka/ru/en), video walkthroughs
- [ ] Security review / external audit before 1.0; backup restore drill
- [ ] 1.0 release, update seven.toolpix.dev product card

---

## Always-on

- [ ] Every new endpoint: DTO validation, permission, audit, OpenAPI, integration test
- [ ] Every new entity: migration, RLS policy, metadata for meta-UI, i18n labels (6 languages), seed data
- [ ] Every money/stock change: inside a transaction, emits an outbox event, idempotent consumer
- [ ] Keep `docs/` in sync — a change in behaviour without a docs change is unfinished

## Won't do (for now)

- Manufacturing/MRP, marketing automation, helpdesk, project management, recruiting
- Microservices, GraphQL-first API, arbitrary drag-and-drop page builder
- Sharing code with Seven CMS (PHP) — only conventions and design tokens are shared
