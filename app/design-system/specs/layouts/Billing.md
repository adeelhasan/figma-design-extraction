# Billing — Layout Specification

## Frame Metadata

| Property | Value |
|----------|-------|
| Screen | Billing |
| Figma Frame ID | 0:2136 |
| Dimensions | 1440 × 1204px |
| Viewport | Desktop |
| Shells | sidebar, navbar, footer |

## Grid System

| Property | Value |
|----------|-------|
| Columns | 12 |
| Column Gap | 24px |
| Content Left Offset | 248px (sidebar width) |
| Content Padding | 24px all sides |
| Effective Content Width | ~1112px |

## Layout Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│ SIDEBAR (248px fixed)    │  NAVBAR (sticky top)                     │
│                          │                                          │
│  Soft UI Dashboard       ├────────────────────────────────────────── │
│                          │                                          │
│  ○ Dashboard             │  ┌──────────────────────────┐ ┌────────┐ │
│  ○ Tables                │  │  CREDIT CARD (dark grad) │ │        │ │
│  ● Billing (active)      │  │  4562  1122  4594  7852  │ │        │ │
│  ○ RTL                   │  │  Jack Peterson   11/22   │ │INVOICES│ │
│                          │  ├──────────┬───────────────┤ │        │ │
│  ACCOUNT PAGES           │  │ Salary   │    Paypal     │ │ List   │ │
│  ○ Profile               │  │ +$2,000  │   $49,000     │ │ of 5   │ │
│  ○ Sign In               │  ├──────────┴───────────────┤ │        │ │
│  ○ Sign Up               │  │     PAYMENT METHOD       │ │ VIEW   │ │
│                          │  │  [MC****7362] [VISA 3288]│ │  ALL   │ │
│  ┌────────────────────┐  │  │  [+ ADD NEW CARD]        │ └────────┘ │
│  │   Need help?       │  │  ├──────────────────────────┼────────────┤ │
│  │  DOCUMENTATION     │  │  │   BILLING INFORMATION    │  YOUR      │ │
│  └────────────────────┘  │  │  ┌─────────────────────┐ │ TRANSACT. │ │
│                          │  │  │ Oliver Liam          │ │          │ │
└──────────────────────────┘  │  │ Viking Burrito       │ │ Netflix  │ │
                              │  │ Email / VAT          │ │ Apple    │ │
                              │  ├─────────────────────-┤ │ Stripe   │ │
                              │  │ Lucas Harper         │ │ HubSpot  │ │
                              │  │ Stone Tech Zone      │ │ Creative │ │
                              │  ├──────────────────────┤ │ Webflow  │ │
                              │  │ Ethan James          │ │          │ │
                              │  │ Fiber Notion         │ └──────────┘ │
                              │  └──────────────────────┘             │
                              ├─────────────────────────────────────── │
                              │ FOOTER                                 │
                              └────────────────────────────────────────┘
```

## Section Grid Positions

| Section | Grid Column | Grid Row | Col Span | Row Span | Width | Height | Pattern |
|---------|-------------|----------|----------|----------|-------|--------|---------|
| credit card | 1 / 8 | 1 / 2 | 7 | 1 | ~824px | 245px | credit-card-group |
| invoices | 8 / 13 | 1 / 3 | 5 | 2 | 406px | 433px | list |
| payment-metod | 1 / 8 | 2 / 3 | 7 | 1 | 787px | 205px | payment-cards |
| billing info | 1 / 9 | 3 / 4 | 8 | 1 | 689px | 615px | billing-cards-list |
| your transaction | 9 / 13 | 3 / 4 | 4 | 1 | 499px | 615px | transaction-list |

## CSS Grid Template

```css
.main-content {
  margin-left: 248px;
  padding: 24px;
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  grid-template-rows: 245px 205px auto;
  gap: 24px;
  background: var(--color-background);
  min-height: 100vh;
}

.section-credit-card   { grid-column: 1 / 8;  grid-row: 1 / 2; }
.section-invoices      { grid-column: 8 / 13; grid-row: 1 / 3; }
.section-payment       { grid-column: 1 / 8;  grid-row: 2 / 3; }
.section-billing-info  { grid-column: 1 / 9;  grid-row: 3 / 4; }
.section-transactions  { grid-column: 9 / 13; grid-row: 3 / 4; }
```

## Sections Detail

### credit card (Figma ID: 0:2138)
- **Type:** FRAME
- **Pattern:** Credit card group (dark gradient card + 2 mini stat cards)
- **Layout:** Horizontal group — dark credit card (358×221px) + Salary card + Paypal card
- **Credit card gradient:** `var(--gradient-dark)` (dark blue-navy), border-radius 12px
- **Card number:** 4562 1122 4594 7852
- **Card holder:** Jack Peterson | Expires: 11/22
- **Salary card:** +$2,000 | Belong Interactive
- **Paypal card:** $49,000 | Freelance Payment
- **Background:** `var(--color-surface)`, border-radius 12px, shadow `0 20px 27px rgba(0,0,0,0.05)`

### card-1 / card-2 (mini summary cards)
- **Salary** — icon with `var(--gradient-primary)` box, label "Salary", subtitle "Belong Interactive", amount +$2,000
- **Paypal** — icon with `var(--gradient-primary)` box, label "Paypal", subtitle "Freelance Payment", amount $49,000
- **Background:** `var(--color-surface)`, radius 12px, shadow lg

### invoices (Figma ID: 0:2214) — SPANS ROWS 1+2
- **Type:** FRAME (tall panel)
- **Pattern:** Scrollable list of invoice rows
- **Background:** `var(--color-surface)`, radius 12px, shadow lg
- **Header:** "Invoices" + "VIEW ALL" button (outlined, border `var(--color-primary)`)
- **5 rows:** date | invoice number | amount | PDF badge
  1. March, 01, 2021 — #MS-415646 — $180
  2. February, 12, 2021 — #RV-126749 — $250
  3. April, 05, 2020 — #FB-212562 — $550
  4. June, 25, 2019 — #QW-103578 — $400
  5. March, 03, 2019 — #AR-803481 — $700

### payment-metod (Figma ID: 0:2188)
- **Type:** FRAME
- **Pattern:** Saved payment method cards + add button
- **Background:** `var(--color-surface)`, radius 12px, shadow lg
- **Header:** "Payment Method" + "ADD NEW CARD" button (`var(--gradient-dark)`, radius 6px)
- **Card 1:** Mastercard logo + **** **** **** 7362 + pencil edit icon
- **Card 2:** Visa logo + **** **** **** 3288 + pencil edit icon
- **Cards:** white background, radius 12px, border `1px solid var(--gray-light-alt)`

### billing info (Figma ID: 0:2250)
- **Type:** FRAME
- **Pattern:** List of 3 billing contact cards
- **Background:** `var(--color-surface)`, radius 12px, shadow lg
- **Header:** "Billing Information"
- **Each card:** name | Company Name label + value | Email Address label + value | VAT Number label + value | EDIT + DELETE buttons
- **Card background:** `var(--color-background)`, radius 12px
  - Card 1: Oliver Liam / Viking Burrito / oliver@burrito.com / FRB1235476
  - Card 2: Lucas Harper / Stone Tech Zone / lucas@syone-tech.com / FRB1235476
  - Card 3: Ethan James / Fiber Notion / ethan@fiber.com / FRB1235476
- **EDIT:** dark text, pencil icon
- **DELETE:** red text (`var(--color-error)`), trash icon

### your transaction (Figma ID: 0:2310)
- **Type:** FRAME
- **Pattern:** Chronological transaction list
- **Background:** `var(--color-surface)`, radius 12px, shadow lg
- **Header:** "Your Transactions" + date filter "23 - 30 March 2021" with calendar icon
- **NEWEST group (label uppercase):**
  - Netflix — 27 March 2021, at 12:30 PM — **- $2,500** (red, minus circle icon)
  - Apple — 27 March 2021, at 04:30 AM — **+ $2,000** (green, plus circle icon)
- **YESTERDAY group (label uppercase):**
  - Stripe — 26 March 2021, at 12:30 AM — **+ $750** (green)
  - HubSpot — 26 March 2021, at 11:30 AM — **+ $1,050** (green)
  - Creative Tim — 26 March 2021, at 07:30 AM — **+ $2,400** (green)
  - Webflow — 26 March 2021, at 04:00 AM — **Pending** (exclamation icon, dark circle)

## Token Usage

### Colors
- `var(--color-background)` — page background (#f8f9fa)
- `var(--color-surface)` — card backgrounds (#ffffff)
- `var(--color-text-primary)` — headings and primary labels (#252f40)
- `var(--color-text-secondary)` — secondary labels (#8392ab)
- `var(--color-body)` — body text (#67748e)
- `var(--color-error)` — DELETE text, negative transactions (#ea0606)
- `var(--color-success)` — positive transaction icons (#82d616)
- `var(--color-primary)` — VIEW ALL button border (#cb0c9f)
- `var(--color-border)` — subtle dividers (#e9ecef)
- `var(--gray-light-alt)` — payment card borders (#f5f5f5)

### Gradients
- `var(--gradient-dark)` — credit card face, ADD NEW CARD button
- `var(--gradient-primary)` — Salary and Paypal icon backgrounds

### Shadows
- `var(--shadow-lg)` — card outer shadows (0 20px 27px rgba(0,0,0,0.05))

### Typography
- `var(--font-family-primary)` — all body and label text ('Open Sans')
- `var(--font-size-base)` — section headers (16px, semibold)
- `var(--font-size-lg)` — card amounts (20px, semibold)
- `var(--font-size-sm)` — labels, dates (14px)
- `var(--font-size-2xs)` — secondary labels (12px)
- `var(--font-weight-semibold)` — names, amounts, headers
- `var(--font-weight-bold)` — transaction amounts, button labels

### Border Radius
- `var(--radius-card)` / 12px — card sections
- `var(--radius-DEFAULT)` / 6px — ADD NEW CARD button
- `var(--radius-md)` / 8px — icon containers

## Components Used

| Component | Section | Count |
|-----------|---------|-------|
| Credit card (dark gradient) | credit card | 1 |
| Stat mini-card | card-1, card-2 | 2 |
| Invoice row | invoices | 5 |
| Payment card row | payment-metod | 2 |
| Billing contact card | billing info | 3 |
| Transaction row | your transaction | 6 |
| Primary gradient button | payment-metod | 1 |
| Outlined button | invoices | 1 |
