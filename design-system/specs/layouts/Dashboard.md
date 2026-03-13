# Dashboard Layout Specification

## Overview
The Dashboard is a comprehensive analytics and management interface with a dark sidebar navigation, top navbar, and multi-section content area featuring statistics, charts, tables, and timelines.

**Frame Name:** Dashboard-sidebar transparent
**Screen Size:** 1440px × 1584px
**Figma Node ID:** 0:263
**Pattern:** Sidebar + Content Layout

## Layout Structure

### Top-Level Composition

The Dashboard uses a two-column layout with a fixed sidebar and scrollable content area:

```
┌──────────────────────────────────────────────────────────┐
│  Top Navbar (64px height)                                │
├──────────┬──────────────────────────────────────────────┤
│          │                                              │
│ Sidebar  │  Main Content Area (Grid Layout)            │
│ 280px    │  - Stat Cards Row (4 columns)               │
│ Dark     │  - Promo Cards Row (2 columns)              │
│ Gradient │  - Charts Row (2 columns)                   │
│          │  - Projects Table (Full width)              │
│          │  - Orders Timeline (Full width)             │
│          │                                              │
├──────────┴──────────────────────────────────────────────┤
│  Footer (48px height)                                    │
└──────────────────────────────────────────────────────────┘
```

### Component Structure

| Section | Type | Dimensions | Background | Notes |
|---------|------|------------|-----------|-------|
| Sidebar | FRAME | 280×1584 | Dark gradient | Fixed navigation |
| Navbar | FRAME | 1440×64 | White | Top header with search/menu |
| Content | GROUP | 1160×~1400 | Light gray | Main scrollable area |
| Footer | FRAME | 1440×48 | White | Copyright/links |

### Content Group Children (10 items)

| Index | Name | Type | Purpose |
|-------|------|------|---------|
| 0 | Widget-1 | FRAME | Stat card 1 (Money) |
| 1 | Widget-2 | FRAME | Stat card 2 (Users) |
| 2 | Widget-3 | FRAME | Stat card 3 (Clients) |
| 3 | Widget-4 | FRAME | Stat card 4 (Sales) |
| 4 | Chart-2 | FRAME | Bar chart (Active Users) |
| 5 | Chart-1 | FRAME | Line chart (Sales Overview) |
| 6 | Table-1 | FRAME | Projects table |
| 7 | Timeline | FRAME | Orders history timeline |
| 8 | Card-1 | FRAME | Promo card (Rocket) |
| 9 | Card-2 | FRAME | Feature card (Spotlight) |

## Section A: Statistics Cards Row

**Grid Position:** Full width, 4 equal columns
**Layout:** CSS Grid with 4 columns (each 1fr)
**Spacing:** 24px gap between cards
**Count:** 4 cards

### Card Specifications

Each stat card contains:
- **Icon Zone:** 32×32px, gradient background, centered icon (Lucide)
- **Value:** Bold, 24px, dark text (#344767)
- **Label:** 12px, secondary gray (#8392ab)
- **Subtext:** 12px, secondary gray, "(+X% change)"

| Card | Icon | Value | Label | Change |
|------|------|-------|-------|--------|
| Widget-1 | wallet | $53,000 | Today's Money | +55% (positive) |
| Widget-2 | globe | 2,300 | Today's Users | +3% (positive) |
| Widget-3 | file-text | +3,462 | New Clients | -2% (negative) |
| Widget-4 | shopping-cart | $103,430 | Sales | +5% (positive) |

### Card Styling
- **Background:** White (#ffffff)
- **Border Radius:** 16px (`--radius-2xl`)
- **Shadow:** `var(--shadow-md)` (0 20px 27px 0 rgba(0,0,0,0.05))
- **Padding:** 20px
- **Border:** 1px light gray (#e9ecef)

Icon gradients:
- Widget-1: `--gradient-primary` (magenta/pink)
- Widget-2: `--gradient-info` (cyan/blue)
- Widget-3: `--gradient-warning` (yellow/orange)
- Widget-4: `--gradient-success` (green)

## Section B: Promo Cards Row

**Grid Position:** Full width, 2 equal columns
**Layout:** CSS Grid with 2 columns (each 1fr)
**Spacing:** 24px gap
**Count:** 2 cards

### Card-1: Rocket Card (Promo)
- **Background:** `--gradient-primary` (magenta gradient)
- **Text Color:** White
- **Content:** Large rocket icon (60px), title, description
- **Title:** "Soft UI Dashboard"
- **Description:** "From colors, cards, typography to complex elements..."
- **CTA Button:** "Read More" (white text, transparent background)
- **Radius:** 16px
- **Shadow:** `var(--shadow-md)`

### Card-2: Feature Card (Spotlight)
- **Background:** `--gradient-dark` (navy/slate gradient)
- **Text Color:** White
- **Content:** Spotlight/feature image, title, description
- **Title:** "Work with the rockets"
- **Description:** "Wealth creation is an evolutionarily recent positive-sum game..."
- **CTA Button:** "Read More" (white text, transparent background)
- **Radius:** 16px
- **Shadow:** `var(--shadow-md)`

## Section C: Charts Row

**Grid Position:** Full width, 2 equal columns
**Layout:** CSS Grid with 2 columns (each 1fr)
**Spacing:** 24px gap
**Count:** 2 chart containers

### Chart-2: Bar Chart (Active Users)
- **Background:** White (#ffffff)
- **Title:** "Active Users"
- **Subtitle:** "(+5) more in 2021"
- **Chart Area:** 400px height, placeholder with vertical bars (12 data points)
- **Stats Below:** 3 metrics (Active Users: 3.6K, Clicks: 2m, Sales: $772)
- **Radius:** 16px
- **Shadow:** `var(--shadow-md)`
- **Padding:** 20px

### Chart-1: Line Chart (Sales Overview)
- **Background:** White (#ffffff)
- **Title:** "Sales Overview"
- **Subtitle:** "(+5) more in 2021"
- **Chart Area:** 400px height, placeholder with multi-line chart
- **Grid Background:** Subtle horizontal lines
- **Legend:** 2 colored dots with labels
- **Radius:** 16px
- **Shadow:** `var(--shadow-md)`
- **Padding:** 20px

## Section D: Projects Table

**Grid Position:** Full width
**Background:** White (#ffffff)
**Radius:** 16px
**Padding:** 20px
**Shadow:** `var(--shadow-md)`

### Table Header
- **Title:** "Projects" (size 18px bold)
- **Subtitle:** "Done this month" (12px, secondary gray)

### Table Structure
```
| COMPANIES (200px) | MEMBERS (120px) | BUDGET (120px) | COMPLETION (150px) | ACTION (60px) |
```

### Table Rows (6 projects)
| Company | Members | Budget | Completion |
|---------|---------|--------|------------|
| Soft UI Shopify Version | 4 | $14,000 | 60% |
| Progress Track | 2 | $3,000 | 10% |
| Fix Platform Errors | 2 | Not Set | 100% |
| Launch new Mobile App | 4 | $20,500 | 100% |
| Add the New Landing Page | 2 | $500 | 25% |
| Redesign Online Store | 6 | $2,000 | 40% |

### Row Styling
- **Height:** 48px
- **Hover Background:** Light gray (#f8f9fa)
- **Border Bottom:** 1px, #e9ecef
- **Text:** 14px, dark text

### Status/Completion
- Progress bars with colored backgrounds
- Percentage text (12px, bold)
- Colors based on completion: 0-30% (warning), 31-70% (primary), 71-100% (success)

## Section E: Orders History Timeline

**Grid Position:** Full width
**Background:** White (#ffffff)
**Radius:** 16px
**Padding:** 20px
**Shadow:** `var(--shadow-md)`

### Timeline Header
- **Title:** "Orders History" (size 18px bold)
- **Subtitle:** "23% this month" (12px, secondary gray)
- **Action:** "VIEW ALL" link (primary color)

### Timeline Items (6 items)

| Icon | Description | Date | Time | Status |
|------|-------------|------|------|--------|
| bell | $2,400 - Redesign store | 22 DEC | 7:20 PM | - |
| code | New order #4845433 | 21 DEC | 11:21 PM | - |
| shopping-cart | Company server payments | 21 DEC | 9:28 PM | - |
| credit-card | New card added #4845433 | 20 DEC | 3:52 PM | - |
| unlock | Unlock folders for development | 19 DEC | 11:35 AM | - |
| credit-card | New order #48453 | 18 DEC | 4:41 PM | - |

### Timeline Structure
- **Vertical layout** with icon on left (32×32px, colored background)
- **Content area:** Description + date/time
- **Spacing:** 12px between items
- **Icon colors:** Primary/success/info depending on action type

## Design Tokens Applied

### Colors
- **Primary Accent:** `var(--color-primary)` (#cb0c9f)
- **Success:** `var(--color-success)` (#82d616)
- **Warning:** `var(--color-warning)` (#fbcf33)
- **Error:** `var(--color-error)` (#ea0606)
- **Info:** `var(--color-info)` (#17c1e8)
- **Secondary Text:** `var(--color-secondary)` (#8392ab)
- **Background:** `var(--color-background)` (#f8f9fa)
- **Surface:** `var(--color-surface)` (#ffffff)

### Spacing
- **Main padding:** `var(--spacing-8)` (32px)
- **Section gap:** `var(--spacing-6)` (24px)
- **Card padding:** `var(--spacing-5)` (20px)
- **Item spacing:** `var(--spacing-3)` (12px)

### Radius
- **Cards/Charts:** `var(--radius-2xl)` (16px)
- **Buttons:** `var(--radius-DEFAULT)` (8px)
- **Inputs:** `var(--radius-md)` (8px)
- **Pills/Badges:** `var(--radius-pill)` (100px)

### Shadows
- **Cards/Content:** `var(--shadow-md)` (0 20px 27px 0 rgba(0,0,0,0.05))
- **Hover elevation:** `var(--shadow-lg)` (increased shadow)

### Gradients
- **Primary:** `--gradient-primary` (310deg: #7928ca → #ff0080)
- **Info:** `--gradient-info` (310deg: #21d4fd → #2152ff)
- **Success:** `--gradient-success` (310deg: #98ec2d → #17ad37)
- **Warning:** `--gradient-warning` (310deg: #fbcf33 → #f53939)
- **Dark (Sidebar):** `--gradient-dark` (310deg: #141727 → #3a416f)

### Typography
- **Headers/Titles:** Bold, 18-24px, dark text
- **Values:** Bold, 20-24px, dark text
- **Body/Labels:** 14px, dark text
- **Captions:** 12px, secondary gray

## Sidebar Navigation (Fixed Left)

- **Width:** 280px
- **Height:** Full viewport
- **Background:** `--gradient-dark`
- **Position:** Fixed, left: 0
- **Z-index:** 100
- **Content:**
  - Logo/branding at top
  - Main navigation items (Dashboard, Tables, Billing, VR, RTL)
  - Account section (Profile, Sign In, Sign Up)
  - Each item: Icon (16px) + Label (14px white)
  - Active state: Highlighted with primary color
  - Hover: Subtle background change

## Top Navigation Bar

- **Height:** 64px
- **Background:** White (#ffffff)
- **Border-bottom:** 1px solid #e9ecef
- **Padding:** 12px 32px
- **Content Layout:** Flex row
  - **Left:** Breadcrumb text ("Dashboard")
  - **Right:** Search input + notification badge + user menu
- **Items:**
  - Search icon + input field (placeholder: "Search...")
  - Notification bell (with red badge count if > 0)
  - User profile avatar/dropdown

## Footer

- **Height:** 48px
- **Background:** White (#ffffff)
- **Border-top:** 1px solid #e9ecef
- **Padding:** 12px 32px
- **Content:** Centered text, flex row
- **Text:** "© 2021 Creative Tim. Built by developers for developers." (12px, secondary gray)
- **Links:** "About Us", "Blog", "License" (inline, primary color on hover)

## Responsive Behavior

**Desktop (1440px):** Full layout as described above

**Tablet (1024px):**
- Sidebar width: 240px (or collapsible hamburger)
- Stat cards: Stack to 2 columns
- Charts: Stack to 1 column
- Main content padding: 24px

**Mobile (480px):**
- Sidebar: Hidden, hamburger menu
- Main content: Full width, single column
- All sections: Full width cards
- Stat cards: 1 column
- Charts: 1 column, reduced height
- Table: Horizontal scroll or simplified view
- Padding: 16px
