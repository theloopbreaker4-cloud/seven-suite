# Data model

The core entities that span CRM, Billing, and ERP. Sketches, not final schemas — adjust when implementing.

## Party

The most important model. One physical entity (person or organization) is **one Party** with **one or more roles**.

```ts
Party {
  _id: ObjectId
  type: 'person' | 'organization'
  name: string                          // display name
  legalName?: string                    // for invoices: "Acme, Inc."
  email?: string
  phone?: string
  addresses: Address[]                  // billing, shipping, registered, …
  roles: Role[]                         // ['lead', 'customer', 'vendor', …]
  taxIds: TaxId[]                       // VAT, EIN, INN, etc.
  parent?: ObjectId                     // for org hierarchies (subsidiary → parent)
  metadata: Record<string, unknown>
  createdAt, updatedAt
  isActive: boolean
}

Role = 'lead' | 'contact' | 'customer' | 'vendor' | 'employee' | 'partner' | 'shareholder'
```

Why one entity with roles: a customer who later becomes a vendor (you start buying from them) is the **same** real-world entity. Two records means double-entry of address changes, name changes, tax ID. One record with two roles is correct.

## Product

```ts
Product {
  _id: ObjectId
  sku: string                           // unique
  name: I18nString                      // {en: "Pro Plan", ru: "..."}
  type: 'physical' | 'digital' | 'service' | 'subscription'
  variants: ProductVariant[]            // size, colour, plan tier, …
  pricing: Pricing[]                    // see below
  taxCategory: ObjectId                 // → TaxCategory
  glAccount: ObjectId                   // → Account (revenue posting)
  inventoryTracking: boolean            // ERP cares; Billing doesn't
  isActive: boolean
}

Pricing {
  currency: string                      // 'USD', 'EUR', …
  amount: number                        // minor units
  validFrom?: Date
  validTo?: Date
  scheme: 'flat' | 'per_unit' | 'tiered' | 'volume' | 'graduated'
  tiers?: PricingTier[]
}
```

Same Product is referenced by Billing (as plan) and ERP (as inventory item). Distinction: subscription Products track no inventory; physical Products do.

## Subscription (Billing)

```ts
Subscription {
  _id: ObjectId
  partyId: ObjectId                     // customer
  productId: ObjectId
  variantId?: ObjectId
  quantity: number                      // seats, units
  status: 'trialing' | 'active' | 'past_due' | 'cancelled' | 'paused'
  startDate: Date
  trialEnd?: Date
  currentPeriodStart: Date
  currentPeriodEnd: Date                // next renewal
  cancelAt?: Date
  cancelledAt?: Date
  paymentMethodId: ObjectId
  discountId?: ObjectId
  metadata: Record<string, unknown>
}
```

State machine: `trialing → active → (cancelled | past_due → active | past_due → cancelled)`.

## Invoice (Billing)

```ts
Invoice {
  _id: ObjectId
  number: string                        // sequential, locale-aware
  partyId: ObjectId
  subscriptionId?: ObjectId             // null for one-off invoices
  status: 'draft' | 'open' | 'paid' | 'void' | 'uncollectible'
  issueDate: Date
  dueDate: Date
  currency: string
  lines: InvoiceLine[]
  subtotal: number
  taxTotal: number
  total: number
  amountPaid: number
  amountDue: number
  paidAt?: Date
  voidedAt?: Date
  metadata: Record<string, unknown>
}

InvoiceLine {
  productId?: ObjectId
  description: string
  quantity: number
  unitPrice: number
  amount: number                        // quantity × unitPrice
  taxRateId?: ObjectId
  taxAmount: number
  periodStart?: Date                    // for prorated lines
  periodEnd?: Date
}
```

**Numbering:** sequential per series (e.g. by year + organization). Once issued (status leaves `draft`), the number is **immutable**. Voiding doesn't reuse the number.

**Posting:** when `status` becomes `paid`, ERP posts a journal entry: debit AR-clearing, credit Revenue, with the GL account from `Product.glAccount`. Tax goes to a Tax Payable account.

## Payment (Billing)

```ts
Payment {
  _id: ObjectId
  partyId: ObjectId
  invoiceId?: ObjectId                  // unallocated payments are possible
  gateway: 'stripe' | 'paypal' | 'manual' | 'bank_transfer'
  gatewayPaymentId?: string             // Stripe charge ID, etc.
  amount: number
  currency: string
  status: 'pending' | 'succeeded' | 'failed' | 'refunded'
  capturedAt?: Date
  refundedAmount: number
  failureReason?: string
}
```

Webhooks from gateways update this. Always **idempotent** — same `gatewayPaymentId` should never create two Payments.

## Account (ERP — chart of accounts)

```ts
Account {
  _id: ObjectId
  code: string                          // '1100', '4000', etc. (ERP convention)
  name: string
  type: 'asset' | 'liability' | 'equity' | 'income' | 'expense'
  subtype?: string                      // 'cash', 'accounts_receivable', 'revenue', …
  parent?: ObjectId                     // for hierarchical chart
  currency?: string                     // null = polymorphic (multi-currency)
  isActive: boolean
}
```

## JournalEntry (ERP — double-entry bookkeeping)

```ts
JournalEntry {
  _id: ObjectId
  date: Date
  description: string
  reference?: string                    // invoice number, bill number, …
  sourceType?: 'invoice' | 'payment' | 'manual' | 'adjustment'
  sourceId?: ObjectId
  lines: JournalLine[]                  // sum(debit) === sum(credit) — enforced
  postedAt?: Date                       // null = draft, set when posted
  periodId: ObjectId                    // → AccountingPeriod
  reversedBy?: ObjectId                 // for corrections
}

JournalLine {
  accountId: ObjectId
  debit: number                         // 0 if this is a credit line
  credit: number                        // 0 if this is a debit line
  partyId?: ObjectId                    // for AR/AP subledger
  currency: string
  amount: number                        // in line currency
  fxRate?: number                       // historical rate at entry date
}
```

**Invariant:** `sum(debit) === sum(credit)` for every entry. Enforce in service before save.

**Periods:** once a period is closed (`AccountingPeriod.status === 'closed'`), no new entries can land in it. Adjustments go in the next open period.

## Activity (CRM)

```ts
Activity {
  _id: ObjectId
  type: 'call' | 'email' | 'meeting' | 'note' | 'task'
  subject: string
  description?: string
  ownerId: ObjectId                     // user
  partyId?: ObjectId                    // related lead/contact/account
  dealId?: ObjectId
  scheduledAt?: Date
  completedAt?: Date
  duration?: number                     // minutes
  metadata: Record<string, unknown>
}
```

## Deal (CRM)

```ts
Deal {
  _id: ObjectId
  title: string
  partyId: ObjectId                     // account it belongs to
  ownerId: ObjectId                     // sales rep
  pipelineId: ObjectId
  stageId: ObjectId                     // current stage
  amount: number                        // minor units
  currency: string
  expectedCloseDate?: Date
  closedAt?: Date
  outcome?: 'won' | 'lost'
  lostReason?: string
  productIds: ObjectId[]                // what they're buying
  metadata: Record<string, unknown>
}
```

When `outcome === 'won'`, emit `deal.won` event — Billing listens and creates Subscription (or Invoice for one-off).

## I18nString

```ts
type I18nString = {
  en: string
  ru?: string
  ka?: string
  uk?: string
  az?: string
  hy?: string
}
```

Same convention as sevenPHP. Display logic falls back: requested → `en` → first available.

## What this model deliberately doesn't have

- **Single "User" with billing+roles** — User is auth (login credentials), Party is business identity. A User is associated with a Party (or none, for system users). Don't merge them.
- **One global "Customer" model** — `Party` with `roles: ['customer']` is the customer. Different from Lead, but both are Parties.
- **Many-to-many on everything** — keep it simple: Subscription has one Party, one Product. If you need bundled products, that's a Plan composed of multiple line items, not multi-Party Subscriptions.
