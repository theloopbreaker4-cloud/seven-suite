# Seven Suite — documentation

Read in order the first time.

| # | Document | What's in it |
|---|---|---|
| 01 | [Market analysis](01-analysis.md) | Odoo, ERPNext, Dolibarr, Twenty, Medusa, Lago, Payload… what we borrow, feature matrix, positioning, risks |
| 02 | [Vision and scope](02-vision.md) | modules, apps, boundaries, out of scope, 1.0 criteria |
| 03 | [Architecture](03-architecture.md) | modular monolith, stack, workspace layout, events/outbox, tenancy, security, deploy |
| 04 | [Data model](04-data-model.md) | entities per module (PostgreSQL) and the invariants to test |
| 05 | [Event catalog](05-events.md) | who publishes what, who reacts |
| 06 | [Conventions](06-conventions.md) | code, API, money/time, i18n, auth, database, git |
| 07 | [Decisions](07-decisions.md) | ADR log and open decisions |
| — | [Roadmap / TODO](../TODO.md) | milestones M0–M11 with checklists |

## Archive

Earlier plans, kept for reference (superseded where the documents above disagree):

- [`archive/suite-2026-04/`](archive/suite-2026-04/) — the April 2026 CRM + Billing + ERP plan (MongoDB, three Angular apps)
- [`archive/seven-shop/`](archive/seven-shop/) — the Seven Shop plan (Vue + Express + MongoDB), now the Commerce module
