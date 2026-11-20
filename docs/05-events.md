# 05 — Event catalog

Events are past-tense facts, published through the outbox in the same transaction as the change.
Name: `<module>.<entity>.<verb>`. Payload: ids + the minimum needed; consumers load the rest.
Every consumer is idempotent (`processed_event` table).

| Event | Publisher | Consumers → reaction |
|---|---|---|
| `content.form.submitted` | Content | CRM → create lead (Party role `lead`) |
| `content.page.published` | Content | Web → revalidate paths |
| `crm.lead.qualified` | CRM | — (analytics) |
| `crm.deal.won` | CRM | Billing → draft subscription or invoice; Commerce → draft order (if products are physical) |
| `crm.quote.accepted` | CRM | Commerce → order / Billing → invoice |
| `commerce.order.placed` | Commerce | Inventory → reserve stock; Marketplace → split into vendor orders; Core → notify staff; CRM → timeline on Party |
| `commerce.order.paid` | Commerce | Billing → invoice (paid); Accounting → (via invoice) post revenue/VAT; Marketplace → credit vendor ledger (held); Commerce → digital download grants |
| `commerce.order.cancelled` | Commerce | Inventory → release reservation; Marketplace → reverse vendor entries |
| `commerce.shipment.shipped` | Commerce | Inventory → stock moves done (COGS); customer email |
| `commerce.refund.completed` | Commerce | Billing → credit note; Accounting → reversal; Marketplace → debit vendor |
| `marketplace.vendor.approved` | Marketplace | Core → grant vendor role; email |
| `marketplace.payout.paid` | Marketplace | Accounting → post payout (vendor payable → bank) |
| `billing.subscription.activated` | Billing | CRM → Party timeline; schedule first invoice |
| `billing.subscription.renewed` | Billing | issue invoice for next period |
| `billing.invoice.submitted` | Billing | Accounting → post AR / revenue / VAT; email customer; Localization GE → RS.ge e-invoice |
| `billing.invoice.paid` | Billing | Accounting → post cash/AR; CRM → timeline; Commerce → mark order paid (if linked) |
| `billing.invoice.overdue` | Billing | Billing dunning workflow |
| `billing.payment.failed` | Billing | dunning; notify customer |
| `inventory.stock.below_min` | Inventory | Procurement → draft PO by reorder rule; notify |
| `inventory.move.done` | Inventory | Accounting → stock valuation entries |
| `procurement.receipt.done` | Procurement | Inventory → incoming moves done |
| `procurement.bill.submitted` | Procurement | Accounting → post AP / expense / VAT; Localization GE → RS.ge |
| `accounting.period.closed` | Accounting | Billing/Procurement → lock documents dated in the period |
| `core.party.merged` | Core | every module → repoint references |

Workflows (sagas) built from these: **checkout**, **refund**, **subscription renewal + dunning**,
**marketplace payout**, **period close**, **PO → receipt → bill**.
