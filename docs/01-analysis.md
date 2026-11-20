# 01 — Market analysis

What already exists, what each project does well, what we borrow, and where Seven Suite
can actually win. Written 2026-11-20 from public knowledge of these projects; licences and
feature details change — re-check a project's repository before relying on a specific fact.

---

## 1. The landscape

Seven Suite spans five product categories. Each has strong open-source players.

### 1.1 All-in-one business suites (our closest competitors)

| Project | Stack | Licence model | What it is |
|---|---|---|---|
| **Odoo** | Python, PostgreSQL, own ORM + XML views | LGPL "Community" + proprietary "Enterprise" | The reference all-in-one: Website, eCommerce, CRM, Sales, Invoicing/Accounting, Inventory, Manufacturing, POS, HR, Projects. ~40+ official apps, thousands of community modules. |
| **ERPNext** (Frappe) | Python, MariaDB, Frappe framework | GPLv3 | Metadata-driven ERP: everything is a "DocType". Strong accounting, stock, manufacturing; regional compliance packs (e.g. India GST). |
| **Dolibarr** | PHP, MySQL/PostgreSQL | GPLv3 | Simple modular ERP+CRM for small businesses; modules switched on/off. |
| **Bitrix24 / 1C-Bitrix** | PHP, proprietary | Commercial (SaaS + on-prem) | CRM + tasks + site/shop; dominant in CIS. Not open source, but the main competitor in our region. |

### 1.2 CRM

| Project | Stack | Notes |
|---|---|---|
| **Twenty** | TypeScript, **NestJS**, React, **PostgreSQL + Redis**, BullMQ | Modern open-source CRM (AGPL). Custom objects and fields via metadata, Kanban/table views, GraphQL + REST. *Same stack as ours* — the best reference for code-level patterns. |
| **EspoCRM** | PHP | Metadata-driven entities, light and fast. |
| **SuiteCRM** | PHP (SugarCRM fork) | Feature-rich, legacy UX. |

### 1.3 Billing / subscriptions / invoicing

| Project | Stack | Notes |
|---|---|---|
| **Lago** | Ruby on Rails, PostgreSQL | Usage-based billing: event ingestion, metering, plans, invoices, webhooks. |
| **Kill Bill** | Java | Mature subscription billing engine, plugin-based gateways. |
| **Invoice Ninja** | Laravel + Flutter | Invoices, quotes, recurring invoices, client portal. |
| **Akaunting** | Laravel | Small-business accounting: invoices, bills, banking, reports, app store. |

### 1.4 Commerce / marketplace

| Project | Stack | Notes |
|---|---|---|
| **Medusa** | TypeScript/Node, PostgreSQL | Headless commerce built from **isolated modules** (product, pricing, cart, order, inventory, …) linked together, plus a **workflow engine with compensation** (sagas) for checkout and order flows. |
| **Saleor** | Python/Django, GraphQL | Headless, multi-channel, strong B2C. |
| **Sylius** | PHP/Symfony | Framework-like, very extensible. |
| **Bagisto** | Laravel | Commerce with a paid multi-vendor marketplace extension. |

### 1.5 Content (for the public site)

| Project | Stack | Notes |
|---|---|---|
| **Payload** | TypeScript, Next.js-native | Config-defined collections → admin UI and API generated; access-control functions per collection. |
| **Strapi** | Node | Headless CMS, content-type builder. |
| **Seven CMS** (ours) | PHP | Stays a separate product. |

---

## 2. What each one teaches us (and what we take)

| Idea | Seen in | How we use it |
|---|---|---|
| **One partner record with roles** | Odoo (`res.partner`), ERPNext (Customer/Supplier on one Party), our Suite plan | `Party` with roles (lead, customer, vendor, employee…). Already the core of our data model. |
| **Module manifest with dependencies** | Odoo, Dolibarr, Seven CMS `plugin.json` | Each domain module declares what it depends on; the platform refuses to enable a module whose dependencies are off. |
| **Document lifecycle: draft → submitted → cancelled** | ERPNext | Financial documents (invoice, bill, journal entry, PO, stock move) become **immutable** once submitted. Corrections = cancel + amend (new linked document), never edit. Required for an honest audit trail. |
| **Naming series** | ERPNext, Odoo sequences | `INV-2026-00042`: per organization, per document type, per year; gap-free for tax documents. |
| **GL generated from documents** | ERPNext, Odoo | Nobody types journal entries for invoices/payments/stock — submitting the document posts them. Manual entries only for adjustments. |
| **"Chatter" / timeline on every record** | Odoo | One generic `Activity`/`Note`/`Attachment`/`Audit` timeline attached to any entity (deal, invoice, product, order). Built once in core, used everywhere. |
| **Custom objects and fields via metadata** | Twenty, EspoCRM, ERPNext | Phase 2: custom fields stored in JSONB + metadata table, rendered automatically in forms, lists and filters. |
| **Isolated modules + explicit links** | Medusa | Modules never import each other's tables. Cross-module relations live in link tables owned by the platform ("order ↔ invoice", "deal ↔ subscription"). |
| **Workflows with compensation (sagas)** | Medusa | Checkout, refund, payout are workflows of steps, each with an undo; a failure half-way rolls back cleanly. |
| **Event ingestion + metering** | Lago | Usage-based billing reads idempotent usage events (`event_id` unique). |
| **Generated admin from schema** | Payload, ERPNext | Entity metadata (fields, types, permissions) drives generic list/form/filter screens; hand-written screens only where UX needs it. This is how a solo developer covers 100+ entities. |
| **Regional compliance as a module** | ERPNext India, Odoo localisations | A `localization-ge` module: Georgian chart of accounts, VAT 18%, RS.ge e-invoices and waybills, payroll taxes. This is our moat in the region. |
| **Multi-company / workspaces** | Odoo, Twenty | Every row belongs to an organization; one user can belong to several. |

### What we deliberately don't copy

- **Odoo's inheritance-everywhere model** (`_inherit` patching of models and XML views). Powerful but makes upgrades and reasoning hard. We prefer events + explicit extension points.
- **Frappe's "everything is a generic DocType" at runtime.** Great flexibility, but weak static typing. We keep typed modules and add metadata only for *custom* fields.
- **Open-core with crippled community edition** (Odoo's accounting split). If we monetize, it's via hosting/support/regional modules, not by removing core features.
- **GraphQL-first API.** REST + OpenAPI is enough and generates typed clients (Seven Shop's plan reached the same conclusion).

---

## 3. Feature coverage matrix

`●` strong · `◐` partial · `○` absent or via extension. Our column is the **target**, by milestone.

| Area | Odoo | ERPNext | Dolibarr | Twenty | Medusa | Lago | **Seven Suite** |
|---|---|---|---|---|---|---|---|
| Website / content | ● | ◐ | ○ | ○ | ○ | ○ | ◐ M4 (pages, blog, menus, SEO) |
| E-commerce storefront | ● | ◐ | ○ | ○ | ● (headless) | ○ | ● M5 (Next.js SSR) |
| Multi-vendor marketplace | ○ (3rd party) | ○ | ○ | ○ | ◐ | ○ | ● M9 |
| CRM pipeline | ● | ◐ | ◐ | ● | ○ | ○ | ● M3 |
| Quotes → orders | ● | ● | ● | ○ | ◐ | ○ | ● M3/M5 |
| Subscriptions / recurring | ● (Ent.) | ◐ | ◐ | ○ | ○ | ● | ● M6 |
| Usage-based billing | ○ | ○ | ○ | ○ | ○ | ● | ◐ M10 |
| Double-entry accounting | ● (Ent. full) | ● | ● | ○ | ○ | ○ | ● M7 |
| Inventory / warehouses | ● | ● | ● | ○ | ◐ | ○ | ● M8 |
| Procurement | ● | ● | ● | ○ | ○ | ○ | ● M8 |
| Manufacturing | ● | ● | ◐ | ○ | ○ | ○ | ○ (out of scope) |
| HR / payroll | ● | ◐ (Frappe HR) | ◐ | ○ | ○ | ○ | ◐ M11 (GE payroll only) |
| Custom fields / objects | ● (Studio, Ent.) | ● | ◐ | ● | ◐ | ○ | ● M10 |
| Workflow automation | ● | ● | ◐ | ◐ | ● | ○ | ◐ M10 |
| ka / az / hy UI | ◐ (community) | ◐ | ◐ | ○ | ○ | ○ | ● from M1 |
| Georgian compliance (RS.ge) | ◐ (3rd party) | ○ | ○ | ○ | ○ | ○ | ● M7 |
| Local gateways (BOG, TBC, Idram…) | ◐ (3rd party) | ○ | ○ | ○ | ○ | ○ | ● M5 |
| Modern TS stack, typed API | ○ | ○ | ○ | ● | ● | ○ | ● |

---

## 4. Where Seven Suite can win

We will not out-feature Odoo. The realistic position:

1. **Region first.** Small and medium businesses in Georgia, the Caucasus and CIS:
   - UI and content in **en, ru, ka, uk, az, hy** from day one (not community-translated afterthoughts);
   - **local payment gateways**: Bank of Georgia (iPay), TBC (TBC Pay / e-commerce), Payze, Idram (AM), LiqPay / WayForPay (UA);
   - **RS.ge** (Georgian Revenue Service) e-invoices, waybills and VAT, a Georgian chart of accounts, payroll taxes (income tax 20%, pension 2%+2%) — verify current rates with an accountant before implementing.
2. **One coherent product, not a patchwork.** Site + shop + CRM + billing + books in one data model, one login, one search — the thing SMBs otherwise assemble from Shopify + HubSpot + spreadsheets + an accountant's 1C.
3. **Modern, hackable stack.** TypeScript end-to-end, typed API, readable modules — attractive to local agencies and developers who would build on it (and to clients who don't want Bitrix lock-in).
4. **Self-hosted or cloud.** Data ownership for those who need it; hosted plan for those who don't want to run servers.

### Who it's for (MVP target customer)

A Georgian SMB with 3–50 people that sells online and offline, has a sales person or two, issues invoices with VAT, and today juggles a website builder, Excel and an accountant. Examples: a furniture or electronics retailer, a B2B distributor, a tour operator, a service company with subscriptions.

### Risks

| Risk | Mitigation |
|---|---|
| Scope is enormous (Odoo took ~20 years) | Every milestone ships something usable on its own (CRM alone is a product). Metadata-driven admin to avoid hand-writing every screen. |
| Accounting/tax correctness | Georgian accountant as advisor before M7; extensive tests on posting rules; immutable documents. |
| No users / chicken-and-egg | Use it ourselves and for client projects first (agency model); demo instance with seed data; local language marketing. |
| Payments for marketplaces in GE (no Stripe Connect) | Balance ledger + manual/bank payouts first; split payments only after a bank agreement. |
| Solo-developer bus factor | Strict docs (this folder), tests from day one, conventional stack. |

---

## 5. Lessons carried over from our own projects

From **Seven CMS (PHP)** — paid for with real bugs on 2026-11-19/20:

- Schema only through **migrations**; never let an ORM invent column types (fluid RedBean made `view_count` TINYINT and lost writes silently).
- Fail loudly: no silent fallbacks on SQL errors; migrations that error are not "applied".
- Orders keep **three independent statuses** (order / payment / fulfilment), **snapshots** of products at purchase time, webhook **idempotency** and an **underpaid guard**.
- Digital downloads: files outside the web root, token + **atomic** download-limit check.
- Security: session token never readable by JS (httpOnly cookie for the site), rate-limited logins, MIME-sniffed uploads with server-chosen extensions, SVG and HTML sanitization, trusted-proxy handling of client IPs.
- Every documented URL must be covered by a test — the shop's REST paths were documented but never matched.
- A fresh-install test on an empty database catches what a long-lived dev database hides.

From **ToolPix (Next.js)**: BullMQ workers, Paddle billing, Resend email, SEO metadata at scale, Cloudflare in front.
From **0xTrend (NestJS)**: Nest module structure, scheduled jobs, ops scripts.
