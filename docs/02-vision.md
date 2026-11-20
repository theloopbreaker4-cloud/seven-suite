# 02 — Product vision and scope

## One sentence

**Seven Suite is an all-in-one business platform — website, shop, marketplace, CRM, billing,
accounting and inventory on one data model — built for small and medium businesses in Georgia,
the Caucasus and the CIS.**

## The lifecycle it models

```
 Visitor ──► Lead ──► Deal ──► Quote ──► Order / Subscription ──► Invoice ──► Payment ──► GL entry
 (Site)     (CRM)    (CRM)    (CRM)       (Commerce / Billing)     (Billing)  (Billing)    (Accounting)
                                               │
                                               ▼
                                       Stock reservation ──► Shipment ──► Stock move ──► COGS entry
                                          (Inventory)        (Commerce)   (Inventory)    (Accounting)
                                               ▲
                              Purchase order ──┘  (Procurement → Vendor bill → AP)
```

Every arrow is an **event** between modules; every box is a document with its own lifecycle.

## Modules

| # | Module | Owns | Users |
|---|---|---|---|
| 0 | **Core** | organizations, users, auth, roles/permissions, Party, Product master, files, i18n, currencies, taxes (rates), numbering, audit, timeline, notifications, settings, jobs, webhooks, import/export | everyone |
| 1 | **Content** | pages, blog, menus, media library, SEO, redirects, web forms | marketing |
| 2 | **Commerce** | catalog presentation, price lists, cart, checkout, orders, payments, refunds, shipping, discounts, customer accounts, digital goods, reviews | sellers, shoppers |
| 3 | **Marketplace** | vendors, vendor onboarding, vendor catalog + moderation, commissions, split orders, vendor balances, payouts, disputes | platform operator, vendors |
| 4 | **CRM** | leads, accounts, contacts (as Party roles), deals, pipelines, activities, tasks, quotes, email/calendar sync, web-to-lead | sales |
| 5 | **Billing** | plans, subscriptions, invoices, payments, credit notes, dunning, proration, usage metering, customer portal | finance |
| 6 | **Accounting** | chart of accounts, journals, GL, AR/AP, bank accounts + reconciliation, periods, VAT, financial reports | accountants |
| 7 | **Inventory** | warehouses, locations, stock ledger, reservations, valuation, transfers, adjustments, reorder rules | operations |
| 8 | **Procurement** | suppliers (Party role), RFQs, purchase orders, receipts, vendor bills | purchasing |
| 9 | **HR & Payroll** (later) | employees (Party role), contracts, leave, payroll runs (GE taxes) | HR |
| 10 | **Reports & BI** | dashboards, saved reports, exports, scheduled emails | management |
| 11 | **Localization: GE** | Georgian chart of accounts, VAT rules, RS.ge e-invoice/waybill sync, payroll tax rules, Georgian gateways | GE customers |

Modules can be switched on per organization. A shop-only customer runs Core + Content + Commerce;
a B2B distributor runs Core + CRM + Billing + Accounting + Inventory.

## Applications (what users open)

| App | Tech | Audience | Contents |
|---|---|---|---|
| **Web** | Next.js (SSR) | public | the organization's website and storefront, customer account area, vendor storefronts |
| **Admin** | Angular, one app, lazy-loaded areas | staff | CRM, Commerce, Marketplace, Billing, Accounting, Inventory, Procurement, Content, Settings |
| **Vendor portal** | same Admin app, vendor role | marketplace vendors | their products, orders, balance, payouts |
| **Customer portal** | Web (Next.js) | customers | orders, invoices, subscriptions, downloads |
| **API** | NestJS, REST + OpenAPI | integrators | everything, with API keys and webhooks |

## Boundaries (who may do what)

- **Modules never write each other's tables.** They call a module's public service or react to its events.
- **Core owns master data** (Party, Product, Currency, Tax rate). Domain modules keep their own extension tables (`crm_party_profile`, `billing_customer_profile`, `inventory_item`) keyed by the master id.
- **Only Accounting writes the general ledger**, always from a submitted document (invoice, payment, bill, stock move, payout) via posting rules. CRM never touches money.
- **Only Billing and Commerce talk to payment gateways**, through one gateway interface in Core.
- **Submitted financial documents are immutable.** Fix by cancel + amend.
- **Nothing is hard-deleted** that has ever been referenced by a financial document. Soft delete + audit.

## Explicitly out of scope

- Manufacturing / MRP / BOM production planning.
- Marketing automation (drip campaigns, scoring rules) — integrate Mailchimp/Brevo.
- Helpdesk / ticketing, project management, recruiting — integrate or a later separate module.
- Page builder with arbitrary drag-and-drop layouts — content has structured blocks only.
- Being a general headless CMS — that is **Seven CMS (PHP)**, a separate product.

## Success criteria for 1.0

- A Georgian SMB can run its site, shop, sales pipeline, invoicing with VAT and books in Seven Suite
  without spreadsheets, and their accountant accepts the reports.
- Fresh install to first order in under 30 minutes.
- Every documented API endpoint covered by an automated test.
- Storefront pages: LCP < 2.5 s on mid-range mobile.
