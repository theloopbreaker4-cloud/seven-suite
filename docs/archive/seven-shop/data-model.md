# Data model

Sketches, not final schemas — adjust as you implement.

## Product

```js
Product {
  _id: ObjectId,
  sku: String,                          // unique
  slug: String,                         // unique, used in URL
  name: I18nString,                     // {en, ru, ka, …}
  description: I18nString,              // long text, may contain HTML
  shortDescription: I18nString,
  type: 'physical' | 'digital' | 'subscription',
  categoryIds: [ObjectId],              // multiple categories ok
  tags: [String],
  attributes: { [key]: I18nString },    // brand, material, etc — used for filtering
  images: [Image],
  variants: [Variant],                  // see below
  defaultVariantId: ObjectId,
  status: 'draft' | 'active' | 'archived',
  isVisible: Boolean,                   // can be toggled without changing status
  taxCategoryId: ObjectId,              // → TaxCategory
  shippingClassId: ObjectId,            // → ShippingClass (used by shipping calculator)
  weightGrams: Number,                  // overall product, may be overridden per variant
  digitalFile: { url, downloadLimit, expiryDays }?,  // for digital products
  metadata: Mixed,
  createdAt, updatedAt,
}

Image {
  url: String,
  alt: I18nString,
  position: Number,                     // sort order
}
```

## Variant

```js
Variant {
  _id: ObjectId,
  productId: ObjectId,
  sku: String,                          // unique within product
  name: I18nString,                     // "Large / Red"
  options: { [key]: String },           // {size: 'L', color: 'red'}
  price: Number,                        // minor units
  compareAtPrice: Number?,              // "was $X" strikethrough
  costPrice: Number?,                   // for margin calculation in admin
  weightGrams: Number?,                 // overrides product
  barcode: String?,
  inventoryTracking: Boolean,
  stockQuantity: Number,                // current on-hand
  reservedQuantity: Number,             // in pending orders, not yet shipped
  isActive: Boolean,
}
```

`availableQuantity = stockQuantity - reservedQuantity`. If `inventoryTracking` is false, the product is treated as infinitely available (services, made-to-order).

## Category

```js
Category {
  _id: ObjectId,
  parentId: ObjectId?,
  slug: String,
  name: I18nString,
  description: I18nString,
  image: Image?,
  position: Number,
  isVisible: Boolean,
}
```

Tree structure. Tree depth not limited — but practical max ~3-4 levels.

## Cart

```js
Cart {
  _id: ObjectId,
  customerId: ObjectId?,                // null for guest carts
  cartToken: String?,                   // for guest carts (cookie)
  currency: String,
  items: [CartItem],
  appliedDiscounts: [DiscountRef],
  shippingAddressId: ObjectId?,
  billingAddressId: ObjectId?,
  selectedShippingOptionId: String?,
  notes: String?,
  expiresAt: Date,                      // guest carts expire after N days idle
  createdAt, updatedAt,
}

CartItem {
  variantId: ObjectId,
  quantity: Number,
  // No price stored — always recalculated from current Variant.price
}
```

## Order

```js
Order {
  _id: ObjectId,
  number: String,                       // "ORD-2026-001234", sequential per shop
  customerId: ObjectId?,                // null for guest orders
  guestEmail: String?,                  // for guest orders
  status: 'draft' | 'pending_payment' | 'paid' | 'fulfilled' | 'shipped' | 'delivered'
        | 'cancelled' | 'refunded' | 'failed',
  currency: String,
  items: [OrderItem],                   // snapshot — prices captured at order time
  subtotal: Number,
  discountTotal: Number,
  taxTotal: Number,
  shippingTotal: Number,
  total: Number,
  amountPaid: Number,
  amountRefunded: Number,
  shippingAddress: Address,             // copied, not reference (immutable)
  billingAddress: Address,
  shippingMethod: String,
  trackingNumber: String?,
  trackingUrl: String?,
  appliedDiscounts: [{ code, amount, type }],
  paymentMethod: 'stripe' | 'paypal' | 'manual' | 'bank_transfer' | 'cod',
  notes: String?,
  internalNotes: String?,               // visible only in admin
  metadata: Mixed,
  placedAt: Date,
  paidAt: Date?,
  shippedAt: Date?,
  deliveredAt: Date?,
  cancelledAt: Date?,
}

OrderItem {
  variantId: ObjectId,
  productSnapshot: { name, sku, image },  // captured for historical accuracy
  variantSnapshot: { name, sku, options },
  quantity: Number,
  unitPrice: Number,                    // captured at order time — Variant.price may change later
  lineTotal: Number,                    // unitPrice × quantity
  taxRate: Number,
  taxAmount: Number,
}
```

**Snapshots matter.** A customer's order should always show the product name/price at the time of purchase, even if the seller renames or changes the variant a year later.

## Customer

```js
Customer {
  _id: ObjectId,
  email: String,                        // unique
  passwordHash: String,
  firstName: String,
  lastName: String,
  phone: String?,
  defaultLanguage: String,              // 'en', 'ru', …
  defaultCurrency: String,
  addresses: [Address],
  defaultShippingAddressId: ObjectId?,
  defaultBillingAddressId: ObjectId?,
  acceptsMarketing: Boolean,
  totalSpent: Number,                   // computed, denormalized for admin filtering
  ordersCount: Number,                  // computed
  lastOrderAt: Date?,
  isActive: Boolean,
  createdAt, updatedAt,
}
```

## Discount

```js
Discount {
  _id: ObjectId,
  code: String,                         // unique, customer-facing ("SUMMER20")
  type: 'percentage' | 'fixed' | 'free_shipping',
  value: Number,                        // 20 (for 20%) or amount in minor units
  minSubtotal: Number?,                 // minimum cart total
  maxDiscount: Number?,                 // cap on percentage discounts
  appliesTo: 'cart' | 'shipping' | 'product',
  productIds: [ObjectId]?,              // for product-specific
  categoryIds: [ObjectId]?,
  startsAt: Date?,
  endsAt: Date?,
  usageLimit: Number?,                  // total uses allowed
  perCustomerLimit: Number?,
  usageCount: Number,                   // current
  isActive: Boolean,
}
```

## ShippingZone + ShippingRate

```js
ShippingZone {
  _id: ObjectId,
  name: String,                         // "EU", "US Domestic", "Worldwide"
  countries: [String],                  // ISO 2-letter codes
  postalCodePatterns: [String]?,        // optional regex narrowing
  position: Number,
}

ShippingRate {
  _id: ObjectId,
  zoneId: ObjectId,
  name: I18nString,                     // "Standard (3-5 days)"
  type: 'flat' | 'weight_based' | 'price_based' | 'free',
  basePrice: Number,
  perWeightUnit: Number?,               // for weight_based, per kg
  conditions: {
    minSubtotal: Number?,               // free shipping above $X
    maxWeightGrams: Number?,
  }?,
  estimatedDays: { min, max },
  isActive: Boolean,
}
```

## TaxRate

```js
TaxRate {
  _id: ObjectId,
  name: String,                         // "EU VAT 20%"
  rate: Number,                         // 0.20 = 20%
  appliesTo: 'all' | 'shipping' | 'products',
  taxCategoryId: ObjectId?,             // null = applies to everything
  countries: [String],
  states: [String]?,                    // for US, CA
  postalCodePatterns: [String]?,
  isInclusive: Boolean,                 // true = price includes tax (EU style)
  isActive: Boolean,
}
```

## Address

```js
Address {
  _id: ObjectId,
  customerId: ObjectId,                 // owner
  firstName: String,
  lastName: String,
  company: String?,
  line1: String,
  line2: String?,
  city: String,
  region: String?,                      // state/province
  postalCode: String,
  country: String,                      // ISO 2-letter
  phone: String?,
  isDefault: Boolean,
}
```

## Payment

```js
Payment {
  _id: ObjectId,
  orderId: ObjectId,
  gateway: 'stripe' | 'paypal' | 'manual' | 'bank_transfer',
  gatewayPaymentId: String?,            // Stripe charge ID, etc.
  amount: Number,
  currency: String,
  status: 'pending' | 'succeeded' | 'failed' | 'refunded',
  capturedAt: Date?,
  refundedAmount: Number,
  refundedAt: Date?,
  failureReason: String?,
  metadata: Mixed,
}
```

## Subscription (Phase 2 — not MVP)

For "ship me a box every month" use cases. Simpler than sevenAngular.io's Billing.

```js
Subscription {
  _id: ObjectId,
  customerId: ObjectId,
  productId: ObjectId,
  variantId: ObjectId,
  quantity: Number,
  intervalUnit: 'day' | 'week' | 'month',
  intervalCount: Number,                // every N intervalUnits
  status: 'active' | 'paused' | 'cancelled',
  startedAt: Date,
  nextDeliveryAt: Date,
  pausedUntil: Date?,
  cancelledAt: Date?,
  paymentMethodId: String,              // stripe payment method id
  shippingAddressId: ObjectId,
}
```

## I18nString

```ts
type I18nString = {
  en: string;
  ru?: string;
  ka?: string;
  uk?: string;
  az?: string;
  hy?: string;
}
```

Display logic: requested → `en` → first non-empty. Same convention as sevenPHP and sevenAngular.io.
