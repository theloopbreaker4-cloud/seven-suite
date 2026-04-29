# TODO — Seven Suite (CRM + Billing + ERP)

Roadmap for the rewrite. Status: **planning**, no code written yet for the new direction.

## Phase 0 — Decide

- [ ] Pick a database: MongoDB only, or MongoDB for CRM/Billing + Postgres for ERP? (Postgres wins on transactional integrity for double-entry bookkeeping; Mongo wins on schema flexibility for CRM and on existing legacy code.)
- [ ] Pick deployment: subdomains (`crm.example.com`) or path-based (`app.example.com/crm`)?
- [ ] Pick first MVP slice — CRM alone, or CRM + minimal Billing? (Recommend CRM-only first — Billing without CRM is useless, but CRM without Billing is a working sales tool.)

## Phase 1 — Scaffold

- [ ] `npx create-nx-workspace suite --preset=angular-monorepo` in this folder
- [ ] Add `apps/api` (NestJS)
- [ ] Add `apps/crm`, `apps/billing`, `apps/erp` (Angular)
- [ ] Add `libs/{shared, ui, auth, api-client}`
- [ ] Wire up basic auth (login, JWT, refresh)
- [ ] Wire up shared theming (Tailwind 4, theme tokens matching sevenPHP)

## Phase 2 — Shared core

- [ ] `Party` model + module + CRUD endpoints
- [ ] `Product` model + module
- [ ] `Address`, `Currency`, `TaxRate`, `User`, `Permission`
- [ ] Audit log infrastructure (every state change recorded with userId, timestamp, before/after)
- [ ] Soft-delete convention applied everywhere

## Phase 3 — CRM MVP

- [ ] `Pipeline`, `Deal`, `Activity` models + endpoints
- [ ] CRM app shell with sidebar + auth guard
- [ ] Lead capture form (creates Party with role=lead)
- [ ] Pipeline kanban view (deals as cards, drag between stages)
- [ ] Deal detail page (related party, activities, products)
- [ ] Activity log (call/email/meeting notes)
- [ ] Email integration (basic IMAP/SMTP via library — full Gmail API later)

## Phase 4 — Billing MVP

- [ ] `Plan`, `Subscription`, `Invoice`, `Payment` models + endpoints
- [ ] Stripe gateway adapter (charge, webhook handler, idempotent processing)
- [ ] Subscription state machine (trial → active → past_due → cancelled)
- [ ] Invoice generation (numbered, line items, taxes)
- [ ] Email sending (invoice issued, payment failed, dunning reminders)
- [ ] Cron worker for due renewals
- [ ] CRM → Billing bridge: when `deal.won`, prompt to create Subscription

## Phase 5 — ERP MVP

- [ ] Chart of accounts (`Account` model)
- [ ] `JournalEntry` with double-entry invariant
- [ ] Posting from invoice payments to GL
- [ ] Accounting periods (open/closed)
- [ ] P&L and balance sheet reports
- [ ] Tax categories and rates per jurisdiction

## Phase 6 — Inventory & Procurement (only if relevant to first customer)

- [ ] Stock levels, locations
- [ ] `PurchaseOrder` model
- [ ] Receiving against PO updates inventory

## Phase 7 — Polish

- [ ] Multi-currency
- [ ] Multi-organization (each user can belong to multiple orgs)
- [ ] Audit log UI (admin can view who changed what)
- [ ] Reports module: P&L, balance sheet, AR aging, deal pipeline analytics
- [ ] Backup / restore tooling
- [ ] OpenAPI / Swagger doc auto-generation

## Open questions (resolve before Phase 4)

- [ ] **Tax engine:** roll our own or integrate TaxJar/Avalara? (TaxJar API is ~$19/mo per organization — possibly viable; rolling our own is months of work for EU VAT MOSS alone.)
- [ ] **Email templates:** static HTML in code, or admin-editable via in-app editor? (Admin-editable wins long-term but adds a chunk of work.)
- [ ] **Invoice numbering:** per-organization sequence, or per-org-per-year? (Per-year is more common in EU; per-org-only is simpler.)

## Won't do

- ~~Share code with sevenPHP~~ — different runtime, different domain (CMS vs business ops). Only conventions/styling are shared.
- ~~Microservices~~ — premature, one NestJS process is fine until 100k users.
- ~~SSR / Angular Universal~~ — internal business tool doesn't need it.
- ~~Marketing automation, helpdesk, recruiting~~ — out of scope, integrate external tools.
