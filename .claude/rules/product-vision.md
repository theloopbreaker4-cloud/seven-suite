# Product vision

Three apps, one platform. They model the **lifecycle of a customer relationship** from first contact through invoice through accounting close.

```
Lead             →  Deal won           →  Subscription           →  Invoice          →  GL entry
(CRM)               (CRM)                  (Billing)                 (Billing)            (ERP)

prospect data       opportunity            recurring charges         dunning if late      revenue recognition
                    pipeline stage         payment methods           tax computed         period close
                                           usage metering            sent to customer     reports
```

## CRM — sales process

**Owns:** the pre-sale and pre-billing world.

- **Leads** — unqualified contacts. Source, score, status (new/contacted/qualified/lost).
- **Accounts** — qualified companies. Industry, size, ARR, owner.
- **Contacts** — people inside accounts. Title, email, phone, role.
- **Deals** — opportunities. Stage (prospecting → qualification → proposal → negotiation → won/lost), amount, expected close date, owner.
- **Activities** — calls, emails, meetings, tasks. Tied to leads/contacts/deals.
- **Pipelines** — customizable stage flows.

**Doesn't own:** money. CRM doesn't know about invoices or accounting. When a deal is won, it hands off to Billing.

## Billing — recurring revenue

**Owns:** the money side, between sale and bookkeeping.

- **Plans** — products with pricing rules: flat-rate, per-seat, per-usage, tiered.
- **Subscriptions** — customer × plan + state (trialing, active, past_due, cancelled). Renewal date. Quantity. Discounts.
- **Invoices** — issued documents with line items, taxes, due date, status (open/paid/void/uncollectible). Numbered.
- **Payments** — charge attempts. Tied to gateways (Stripe, PayPal, manual). Retry on failure.
- **Dunning** — failed-payment workflows: email reminders, retry schedule, cancel after N attempts.
- **Webhooks** — incoming events from gateways. Idempotent processing.

**Doesn't own:** the customer relationship (CRM does) or the accounting books (ERP does). It's the **engine** that converts subscriptions into money flows.

## ERP — operations and accounting

**Owns:** the books, the warehouse, the compliance.

- **General Ledger (GL)** — chart of accounts, journal entries, double-entry bookkeeping. Every billing transaction posts here.
- **Inventory** — products as physical goods: stock levels, locations, reservations, reorder points. (Distinct from billing's "plans" — those are recurring services or licences.)
- **Procurement** — purchase orders, suppliers, receiving.
- **Taxes** — multi-jurisdiction VAT/GST/sales tax. Tax periods. Filings.
- **Payroll** — employees, wages, deductions, payroll runs.
- **Period close** — month/quarter/year end: lock periods, reconcile, generate reports.
- **Reports** — P&L, balance sheet, cash flow, AR/AP aging.

**Doesn't own:** customer-facing anything. ERP is internal-facing — accountants, ops managers, supply chain.

## Shared core (not a fourth app — just shared models)

Lives in `libs/shared/` (Angular) and `src/shared/` (NestJS):

- **Party** — abstract person/organization. Has roles: `customer`, `lead`, `contact`, `vendor`, `employee`, `partner`. One Party can have multiple roles. CRM sees them as leads/contacts; Billing sees them as customers; ERP sees them as customers/vendors/employees.
- **Product** — abstract sellable thing. Has variants. Used by Billing (as plan template) and ERP (as inventory item).
- **Document** — abstract numbered document with line items. Specialised into Quote (CRM), Invoice (Billing), PO (ERP).
- **Account** — chart-of-accounts entry (ERP-owned but referenced by Billing for revenue posting).
- **Address, Currency, Tax rate, User, Permission** — boring shared infrastructure.

## Boundaries (what NOT to do)

- **CRM does not write to GL.** When a deal is won, CRM emits an event; Billing creates a Subscription; Billing creates an Invoice; Invoice posts to GL. CRM has no reason to touch accounting.
- **Billing does not edit Party records directly.** It reads them. Billing-only data (payment methods, default plan, dunning preferences) lives on a `BillingProfile` attached to the Party, not on the Party itself.
- **ERP does not generate customer-facing emails.** That's Billing (invoice sent, payment failed). ERP only generates internal documents (PO sent, period closed).
- **No app deletes Party records.** Soft-delete only — history matters in all three contexts.

## Out of scope (deliberately)

- **Marketing automation** — drip campaigns, lead scoring rules. Use external tool integration (HubSpot/Mailchimp).
- **Helpdesk / ticketing** — would belong as a fourth app or external integration.
- **HR (beyond payroll)** — recruiting, performance reviews. External tool.
- **Project management** — external tool.

These are real products in their own right; trying to bake them in dilutes focus.
