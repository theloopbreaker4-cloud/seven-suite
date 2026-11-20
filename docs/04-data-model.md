# 04 — Data model

PostgreSQL. One Postgres schema per module (`core.party`, `crm.deal`, `billing.invoice`,
`acc.journal_entry`, …). Every business table has `id uuid` (v7, time-ordered), `org_id uuid`,
`created_at`, `updated_at`, `created_by`, `updated_by`; master data also `deleted_at`.
These are sketches — final columns are decided in each module's migration.

Types: `money` = `amount bigint` (minor units) + `currency char(3)`; `i18n` = `jsonb`
`{ "en": "...", "ka": "..." }`; `status` = text checked against an enum list.

---

## 1. Platform & Core

| Entity | Key fields | Notes |
|---|---|---|
| `organization` | name, legal_name, country, base_currency, timezone, accounting_tz, locale, default_languages[], fiscal_year_start, modules_enabled[] | tenant |
| `user` | email, password_hash, name, locale, totp_secret, is_active | auth identity only |
| `membership` | user_id, org_id, role_ids[], party_id? | user ↔ organization |
| `role` / `permission` | role: name, permissions[] (`module:entity:action`) | per org; system roles seeded |
| `api_key` | name, hash, scopes[], last_used_at | hashed at rest |
| `session` / `refresh_token` | hash, family_id, expires_at, revoked_at | rotation + replay detection |
| **`party`** | type person/organization, name, legal_name, email, phone, tax_id(s), parent_id, roles[], tags[], custom jsonb | THE shared customer/vendor/contact/employee record |
| `party_address` | party_id, kind (billing/shipping/registered), lines, city, region, postal_code, country | |
| `party_contact_link` | org_party_id, person_party_id, title, is_primary | people inside companies |
| **`product`** | sku, name i18n, description i18n, type physical/digital/service/subscription, uom, tax_category_id, income_account_id, expense_account_id, is_stockable, is_active | master; modules extend it |
| `product_variant` | product_id, sku, options jsonb, barcode, weight_g | |
| `uom` | code, name, ratio, category | units of measure |
| `currency` / `fx_rate` | code, decimals / base, quote, rate, date, source | |
| `tax_rate` | name, rate_bp, is_inclusive, region, account_id | VAT 18% etc. |
| `sequence` | doc_type, prefix, year, next_value | gap-free numbering with row lock |
| `file` | bucket (public/private), key, mime, size, checksum, owner ref | S3 object metadata |
| `timeline_entry` | entity_type, entity_id, kind (note/activity/email/change/attachment), body, author_id | "chatter" on any record |
| `audit_log` | entity_type, entity_id, action, before jsonb, after jsonb, actor, ip | append-only |
| `notification` | user_id, kind, payload, read_at | in-app |
| `setting` | module, key, value jsonb | per org |
| `outbox_event` / `processed_event` | name, payload, occurred_at, dispatched_at / consumer, event_id | reliable events |
| `link` | from_type, from_id, to_type, to_id, kind | cross-module relations |
| `custom_field` (M10) | entity_type, key, type, label i18n, options, required | values in each table's `custom jsonb` |

## 2. Content

`page` (slug per lang, title i18n, blocks jsonb, seo jsonb, status draft/published, published_at,
parent_id) · `post` (+ category, tags, cover file, author) · `menu` / `menu_item` · `redirect`
(from, to, code) · `form` / `form_submission` (→ creates CRM lead) · media = `file` with folders.

## 3. Commerce

| Entity | Key fields | Notes |
|---|---|---|
| `catalog_product` | product_id, slug i18n, status draft/active/archived, is_visible, category_ids[], attributes jsonb, images[], seo | storefront presentation of a core product |
| `category` | parent_id, slug, name i18n, position, is_visible | tree |
| `price_list` / `price` | currency, customer_group, valid_from/to / variant_id, amount, compare_at, min_qty | B2C list + B2B lists |
| `cart` / `cart_item` | token, party_id?, currency, discount_codes[], expires_at / variant_id, qty | prices never stored on cart lines |
| **`order`** | number, party_id?, guest_email, currency, status, payment_status, fulfillment_status, totals (subtotal, discount, tax, shipping, total, paid, refunded), addresses (copied), channel, vendor_split? | three independent statuses |
| `order_line` | variant_id, **snapshot** (name, sku, options, image), qty, unit_price, discount, tax_rate, tax_amount, line_total, vendor_id? | immutable copy at purchase time |
| `payment` | order_id / invoice_id, gateway, gateway_ref (unique per gateway), amount, status, captured_at, refunded_amount | idempotent on gateway_ref |
| `refund` | payment_id, amount, reason, gateway_ref | |
| `shipment` | order_id, lines, carrier, tracking, status, shipped_at | |
| `shipping_zone` / `shipping_rate` | countries/regions / method, min/max subtotal or weight, price | |
| `discount` | code, kind percent/fixed/free_shipping, value, conditions, usage_limit, per_customer_limit, window | |
| `digital_asset` / `download_grant` | product_id, file_id, max_downloads, expires_days / order_line_id, token_hash, count, expires_at | atomic counter |
| `review` | product_id, party_id, rating, body, status | moderated |
| `payment_gateway_config` | gateway, credentials (encrypted), mode, is_active | per org |

**Order statuses**: `status` pending → confirmed → completed / cancelled; `payment_status` unpaid →
authorized → paid → partially_refunded / refunded / failed; `fulfillment_status` unfulfilled →
partial → fulfilled → delivered / returned.

## 4. Marketplace

| Entity | Key fields | Notes |
|---|---|---|
| `vendor` | party_id, status (applied/approved/suspended), commission_plan_id, payout_method, kyc jsonb | vendor = Party role |
| `vendor_user` | vendor_id, user_id, role | vendor staff |
| `commission_plan` | kind percent/fixed/tiered, value, per-category overrides | |
| `vendor_order` | order_id, vendor_id, lines, subtotal, commission, vendor_net, status | split of a customer order |
| **`vendor_ledger_entry`** | vendor_id, kind (sale/commission/refund/payout/adjustment), amount, ref, available_at | balance = sum; append-only |
| `payout` | vendor_id, amount, method, status requested/approved/paid/failed, reference | |
| `dispute` | order_id, vendor_id, reason, status, resolution | |

## 5. CRM

| Entity | Key fields |
|---|---|
| `lead` | party_id (role lead), source, status new/contacted/qualified/disqualified, score, owner_id |
| `pipeline` / `stage` | name / position, probability, is_won, is_lost |
| **`deal`** | title, party_id, owner_id, pipeline_id, stage_id, amount money, expected_close, outcome, lost_reason |
| `deal_line` | product_id, qty, price, discount |
| `activity` | type call/email/meeting/task, subject, due_at, done_at, owner_id, related entity |
| `quote` | number, party_id, deal_id, lines, totals, valid_until, status draft/sent/accepted/declined |
| `email_message` | thread_id, from, to, subject, body, party links (from mailbox sync) |

## 6. Billing

| Entity | Key fields |
|---|---|
| `plan` | product_id, interval (day/week/month/year), interval_count, pricing scheme (flat/per_unit/tiered/volume/graduated), tiers, trial_days |
| **`subscription`** | party_id, plan_id, qty, status trialing/active/past_due/paused/cancelled, current_period_start/end, cancel_at, payment_method_id |
| `usage_event` | subscription_id, metric, quantity, event_id (unique), occurred_at |
| **`invoice`** | number (immutable after submit), party_id, source (order/subscription/manual), status draft/open/paid/void/uncollectible, issue/due date, lines, totals, amount_paid, amount_due |
| `invoice_line` | product_id, description, qty, unit_price, tax_rate_id, tax_amount, period_start/end |
| `credit_note` | invoice_id, lines, totals, reason |
| `payment_method` | party_id, gateway, token, brand, last4, expires |
| `dunning_attempt` | invoice_id, step, scheduled_at, result |

## 7. Accounting

| Entity | Key fields | Invariants |
|---|---|---|
| `account` | code, name i18n, type asset/liability/equity/income/expense, subtype, parent_id, currency?, is_reconcilable | chart of accounts (GE template) |
| `journal` | code, type sales/purchase/bank/cash/general | |
| **`journal_entry`** | number, date, journal_id, period_id, source_type, source_id, status draft/posted/cancelled, reversal_of | posted entries immutable |
| `journal_line` | entry_id, account_id, debit, credit, party_id?, currency, amount_currency, fx_rate | **Σdebit = Σcredit** enforced by DB constraint trigger |
| `period` | start, end, status open/closed | no posting into closed periods |
| `bank_account` / `bank_statement_line` | account_id, iban / date, amount, ref, matched_entry_id | reconciliation |
| `posting_rule` | event, debit_account, credit_account, conditions | invoice.submitted → AR/Revenue/VAT |
| `vat_return` | period, boxes jsonb, status, submitted_at | GE VAT declaration |

## 8. Inventory & Procurement

| Entity | Key fields | Invariants |
|---|---|---|
| `warehouse` / `location` | name, address / parent, kind internal/transit/customer/vendor | |
| **`stock_move`** | variant_id, from_location, to_location, qty, unit_cost, source doc, status draft/done/cancelled | the stock ledger; quantities are sums of done moves |
| `stock_reservation` | variant_id, location, qty, source (order line), expires_at | available = on_hand − reserved |
| `stock_valuation_layer` | move_id, qty, value, remaining_qty | FIFO / moving average |
| `reorder_rule` | variant_id, location, min, max | creates draft POs |
| `supplier_info` | product_id, party_id (vendor), supplier_sku, price, lead_time | |
| `purchase_order` / `po_line` | number, party_id, status draft/sent/confirmed/received/billed/cancelled / variant, qty, price, received_qty | |
| `receipt` | po_id, lines → stock moves | |
| `vendor_bill` | number, party_id, po_id?, lines, totals, status | AP, posts to GL |

## 9. HR & Payroll (later)

`employee` (party_id, position, department, hire_date, salary) · `contract` · `leave_request` ·
`payroll_run` / `payslip` (gross, income tax, pension employee/employer, net) → posts to GL.

---

## Invariants worth a test each

1. A journal entry never posts unbalanced; nothing posts into a closed period.
2. A submitted invoice/bill/entry/move never changes; corrections create linked documents.
3. Document numbers are unique and gap-free per org/series/year.
4. Order line prices and names never change after the order is placed.
5. A gateway payment reference creates at most one payment.
6. Stock: on_hand(location) = Σ done moves in − Σ done moves out; never negative unless allowed.
7. Vendor balance = Σ ledger entries; payouts never exceed available balance.
8. Download grants never exceed max_downloads under concurrent requests.
9. Every row is visible only within its `org_id` (RLS test with two tenants).
