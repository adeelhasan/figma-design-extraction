# Billing Layout

> Frame: Billing
> Dimensions: 1440×1204px
> Pattern: sidebar-content (dashboard-grid)
> Figma Node ID: 0:2136

## Structure

```
┌─────────────────────────────────────────────────────────────────┐
│  Navbar (breadcrumb: Pages > Billing)                           │
├──────────┬──────────────────────────────────────────────────────┤
│          │  ┌───────────────┐┌────────┐┌────────┐┌───────────┐ │
│ Sidebar  │  │ Credit Card   ││ Salary ││ Paypal ││ Invoices  │ │
│          │  │ 4562 1122...  ││ +$2,000││ $49,000││ (5 items) │ │
│ • Dashboard │ └───────────────┘└────────┘└────────┘└───────────┘ │
│ • Tables  │                                                     │
│ • Billing◄│  ┌───────────────────────────────────────────────┐  │
│ • VR      │  │ Payment Method                  [ADD NEW CARD]│  │
│ • RTL     │  │ ┌─────────────┐ ┌─────────────┐              │  │
│          │  │ │ Mastercard  │ │ Visa        │              │  │
│ ACCOUNT  │  │ │ **** 7852   │ │ **** 5765   │              │  │
│ • Profile│  │ └─────────────┘ └─────────────┘              │  │
│ • Sign In│  └───────────────────────────────────────────────┘  │
│ • Sign Up│                                                      │
│          │  ┌─────────────────────┐┌────────────────────────┐  │
│          │  │ Billing Information ││ Your Transactions      │  │
│          │  │ (3 info cards)      ││ (6 items, grouped)     │  │
│          │  └─────────────────────┘└────────────────────────┘  │
├──────────┴──────────────────────────────────────────────────────┤
│  Footer                                                         │
└─────────────────────────────────────────────────────────────────┘
```

## Sections

| Section | Type | Dimensions | Grid Position | Pattern | Actions |
|---------|------|------------|---------------|---------|---------|
| credit-card | card | 407×245 | col 1, span 2 | credit-card | - |
| card-1 (Salary) | stat-card | 214×245 | col 3, span 1 | stat-card | - |
| card-2 (Paypal) | stat-card | 203×245 | col 4, span 1 | stat-card | - |
| invoices | list | 406×433 | col 5, span 2, **row-span 2** | list-item ×5 | VIEW ALL |
| payment-method | card | 787×205 | col 1, span 4 | - | ADD NEW CARD |
| billing-info | card | 689×615 | col 1, span 3 | info-card ×3 | EDIT, DELETE |
| your-transaction | list | 499×615 | col 4, span 3 | transaction-item ×6 | - |

## Grid Layouts

### Top Cards Row

```css
.top-cards {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 2fr;
  grid-template-rows: auto auto;
  gap: 24px;
  grid-template-areas:
    "credit-card credit-card salary paypal invoices invoices"
    ".           .           .      .      invoices invoices";
}

.credit-card { grid-area: credit-card; }
.salary-card { grid-area: salary; }
.paypal-card { grid-area: paypal; }
.invoices-card { grid-area: invoices; height: 100%; } /* height: 100% required to fill row-span */
```

**Key insight:** Invoices card spans 2 rows because it's 433px tall while Salary/Paypal are only 245px. Elements that span multiple rows need `height: 100%` to fill the grid area.

### Bottom Section

```css
.bottom-section {
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: 24px;
}

.billing-info { grid-column: 1; }
.your-transactions { grid-column: 2; }
```

## Top Row Cards

### Credit Card Display

Gradient card showing credit card details.

| Element | Value | Token |
|---------|-------|-------|
| Background | Dark gradient | `--gradient-credit-card` |
| Card number | 4562 1122 4594 7852 | - |
| Holder name | Jack Peterson | - |
| Expiry | 11/22 | - |
| Icons | WiFi symbol, chip | - |

### Salary Card (Stat Card)

| Element | Value |
|---------|-------|
| Icon | Plus in circle |
| Value | +$2,000 |
| Label | Salary |
| Sublabel | Belong Interactive |

### Paypal Card (Stat Card)

| Element | Value |
|---------|-------|
| Icon | PayPal logo |
| Value | $49,000 |
| Label | Paypal |
| Sublabel | Freelance Payment |

### Invoices List

| Date | Invoice ID | Amount | Action |
|------|------------|--------|--------|
| March 01, 2021 | #MS-415646 | $180 | PDF |
| February 12, 2021 | #MS-415647 | $250 | PDF |
| April 05, 2020 | #MS-415648 | $560 | PDF |
| March 25, 2019 | #MS-415649 | $120 | PDF |
| March 01, 2019 | #MS-415650 | $43 | PDF |

## Payment Method Section

Horizontal row of saved payment cards.

| Card | Number | Expiry |
|------|--------|--------|
| Mastercard | **** 7852 | 11/22 |
| Visa | **** 5765 | 06/24 |

**Action:** ADD NEW CARD button

## Billing Information

Three info cards with editable billing details.

### Card 1: Oliver Liam
- Company: Viking Burrito
- Email: oliver@burrito.com
- VAT: FRB1235476
- **Actions:** EDIT, DELETE

### Card 2: Lucas Harper
- Company: Stone Tech Zone
- Email: lucas@stone-tech.com
- VAT: FRB1235476
- **Actions:** EDIT, DELETE

### Card 3: Ethan James
- Company: Fiber Notion
- Email: ethan@fiber.com
- VAT: FRB1235476
- **Actions:** EDIT, DELETE

## Your Transactions

Grouped list of recent transactions.

### NEWEST
| Description | Amount | Status |
|-------------|--------|--------|
| Netflix | -$2,500 | Pending (red) |
| Apple | +$2,000 | Completed |

### YESTERDAY
| Description | Amount | Status |
|-------------|--------|--------|
| Stripe | +$750 | Completed |
| HubSpot | +$1,000 | Completed |
| Creative Tim | +$2,500 | Completed |
| Webflow | Pending | Pending (red) |

## Token Usage

| Element | Token |
|---------|-------|
| Credit card gradient | `--gradient-dark` |
| Stat card icon bg | `--gradient-info`, `--gradient-success` |
| Info card bg | `--color-surface` |
| Transaction positive | `--color-success` |
| Transaction negative | `--color-error` |
| Pending text | `--color-warning` |

## Component Instances

- Credit Card Display ×1
- Stat Card ×2
- Info Card ×3
- List Item ×11
- Button ×4 (ADD NEW CARD, EDIT×3, DELETE×3)
- PDF Icon Button ×5
