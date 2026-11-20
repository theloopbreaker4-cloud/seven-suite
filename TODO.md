# TODO — Seven Suite roadmap

Milestones are in build order. **Each one ends with something usable on its own** — a release you
can demo or sell — so the project never sits half-finished. Estimates are for one developer working
full time; treat them as ranges, not promises. Background: [`docs/`](docs/README.md).

| Milestone | Delivers | Estimate |
|---|---|---|
| M0 | Analysis, decisions, plan (this) | done |
| M1 | Foundation: monorepo, platform kernel, auth, tenants, admin + web shells, CI, deploy | 3–4 weeks |
| M2 | Core business data: Party, Product, files, timeline, numbering, settings, meta-UI | 3 weeks |
| M3 | **CRM** — first sellable product | 3–4 weeks |
| M4 | **Content + Web** — the organization's website | 2–3 weeks |
| M5 | **Commerce** — online shop with local gateways | 5–6 weeks |
| M6 | **Billing** — invoices, subscriptions, dunning | 3–4 weeks |
| M7 | **Accounting** + Georgian localization | 5–6 weeks |
| M8 | **Inventory + Procurement** | 4–5 weeks |
| M9 | **Marketplace** | 4–5 weeks |
| M10 | Platform power: custom fields, automation, search, reports | 4 weeks |
| M11 | HR & payroll (GE), cloud SaaS, 1.0 | 4+ weeks |

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
- [ ] Archive the `seven-shop` repository on GitHub (Settings → Archive) — **owner action**
- [ ] OD-1: choose a licence before the first public release

---

## M1 — Foundation (3–4 weeks)

**Done when:** `docker compose up` gives a running API, worker, admin and web; a user can sign up,
create an organization, invite a teammate with a role, log in with 2FA; CI is green; a deploy to
the VPS works with one command.

### Repository & tooling
- [ ] Remove legacy CMS clone: `backend/`, `frontend/`, `shared/`, `doc/`, `tests/`, `gulpfile.js`, `index.html`, old `package.json`
- [ ] Scaffold NX workspace at the repo root (pnpm): `apps/api`, `apps/worker`, `apps/admin`, `apps/web`
- [ ] Libraries: `libs/shared`, `libs/api-client`, `libs/server/platform`, `libs/server/core`, `libs/admin/ui`, `libs/admin/meta-ui`, `libs/web/ui`
- [ ] NX tags + `enforce-module-boundaries` rules per scope
- [ ] TS strict, ESLint, Prettier, commit hooks (lint-staged), conventional commits
- [ ] `docker/compose.dev.yml`: PostgreSQL 16, Redis 7, MinIO, Mailpit
- [ ] `.env.example` for every app; config module with schema validation (fails fast on missing vars)
- [ ] GitHub Actions: lint · typecheck · unit · integration (Testcontainers) · build · fresh-install

### Platform kernel (`libs/server/platform`)
- [ ] Prisma: multi-file schema, Postgres schema per module, migration workflow, seed runner
- [ ] Request context (AsyncLocalStorage): requestId, orgId, userId, locale
- [ ] Tenancy: org resolution (subdomain / domain / header), `SET app.org_id`, RLS policy helper + test with two tenants
- [ ] Transactions helper (unit of work) shared by repositories
- [ ] Outbox: `outbox_event` written in-transaction; dispatcher in worker; `processed_event` idempotency; retries + dead-letter
- [ ] BullMQ setup: queues, repeatable jobs (scheduler), dashboard (Bull Board) behind admin auth
- [ ] Cache + rate limiter (Redis)
- [ ] Structured logging (pino), request logging, error filter → `{ error, code, fields }`
- [ ] Health endpoints (`/health/live`, `/health/ready`)
- [ ] OpenAPI generation + `libs/api-client` generation script
- [ ] Module manifest system: id, requires, permissions, settings schema, menu entries; enable/disable per org with dependency checks

### Identity & access
- [ ] User, Organization, Membership, Role, Permission tables + migrations
- [ ] Sign-up (create org), login, logout, email verification, password reset (hashed one-time tokens)
- [ ] JWT access + rotating refresh (httpOnly cookie, replay detection revokes family)
- [ ] TOTP 2FA + recovery codes
- [ ] Invite members by email; switch organization
- [ ] RBAC guard + `@RequirePermission('crm:deal:write')`; record-rule hook for ownership
- [ ] API keys (hashed, scoped)
- [ ] Login/refresh/reset rate limits; audit of auth events
- [ ] Security headers, CORS policy, CSP for admin and web

### Admin shell (Angular)
- [ ] Layout: sidebar from module menus, top bar (org switcher, search, notifications, user)
- [ ] Auth flows: login, 2FA, invite accept, password reset
- [ ] HTTP interceptor (token, refresh, error toasts), permission directive `*can="'crm:deal:read'"`
- [ ] Theme tokens (light/dark), Tailwind 4, base components: button, input, select, date, money, table, dialog, toast, empty state
- [ ] i18n with Transloco (en, ru, ka first; az, hy, uk files present) + CI missing-key check (OD-7)
- [ ] Settings area: organization profile, members, roles, API keys

### Web shell (Next.js)
- [ ] App Router, next-intl, org resolution by domain, server-side API client with service key
- [ ] Layout, theme tokens, 404/500, health
- [ ] Customer session plumbing (httpOnly cookie held by Next)

### Deploy
- [ ] Dockerfiles (multi-stage) for api, worker, web, admin (static via nginx)
- [ ] `docker/compose.prod.yml`, nginx config, Cloudflare real-IP
- [ ] Deploy script (build → push → migrate → restart), rollback note
- [ ] Nightly backups: `pg_dump` + MinIO mirror; restore drill documented
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
- [ ] Email: provider interface (SMTP, Resend), templates per language, outbox-backed sending, Mailpit in dev
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
