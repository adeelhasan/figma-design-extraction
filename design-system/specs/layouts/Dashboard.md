# Dashboard Layout

> Frame: Dashboard-sidebar transparent
> Dimensions: 1440×1584px
> Pattern: sidebar-content (dashboard-grid)
> Figma Node ID: 0:263

## Structure

```
┌─────────────────────────────────────────────────────────────────┐
│  Navbar (search, user profile, settings)                        │
├──────────┬──────────────────────────────────────────────────────┤
│          │  ┌──────────┐┌──────────┐┌──────────┐┌──────────┐   │
│          │  │ Stat 1   ││ Stat 2   ││ Stat 3   ││ Stat 4   │   │
│          │  │ $53,000  ││ 2,300    ││ +3,462   ││ $103,430 │   │
│ Sidebar  │  └──────────┘└──────────┘└──────────┘└──────────┘   │
│          │                                                      │
│ • Dashboard │  ┌─────────────────────┐┌────────────────────┐   │
│ • Tables   │  │ Built by developers  ││ Work with rockets  │   │
│ • Billing  │  │ (Promo Card)         ││ (Feature Card)     │   │
│ • VR       │  └─────────────────────┘└────────────────────┘   │
│ • RTL      │                                                    │
│          │  ┌─────────────────────┐┌────────────────────┐      │
│ ACCOUNT  │  │ Bar Chart           ││ Line Chart         │      │
│ • Profile│  │ Active Users: 3.6K  ││ Sales Overview     │      │
│ • Sign In│  └─────────────────────┘└────────────────────┘      │
│ • Sign Up│                                                      │
│          │  ┌─────────────────────┐┌────────────────────┐      │
│          │  │ Projects Table      ││ Orders History     │      │
│          │  │ (6 rows)            ││ (5 items)          │      │
│          │  └─────────────────────┘└────────────────────┘      │
├──────────┴──────────────────────────────────────────────────────┤
│  Footer (© Creative Tim | About Us | Blog)                      │
└─────────────────────────────────────────────────────────────────┘
```

## Sections

### Top-Level Structure

| Section | Type | Dimensions | Notes |
|---------|------|------------|-------|
| sidebar | navigation | 248×1002 | Fixed left navigation |
| navbar | header | 1085×45 | Top bar with search and user menu |
| content | main | 1188×1443 | Scrollable content area |
| footer | footer | 1116×20 | Copyright and links |

### Content Sections (depth 2-3)

| Section | Type | Pattern | Children | Actions |
|---------|------|---------|----------|---------|
| stat-cards-row | card-row | stat-card ×4 | 4 cards | - |
| welcome-card | promo-card | - | Text + CTA | Read More |
| rocket-card | feature-card | - | Image + CTA | Read More |
| chart-bar | chart | bar-chart | Stats below | - |
| chart-line | chart | line-chart | Legend | - |
| projects-table | table | table-row ×6 | 6 rows | - |
| orders-history | list | order-item ×5 | 5 items | VIEW ALL |

## Stat Cards Row

The top row contains 4 stat cards showing key metrics:

| Card | Icon | Value | Label | Change |
|------|------|-------|-------|--------|
| Today's Money | wallet | $53,000 | Today's Money | +55% |
| Today's Users | globe | 2,300 | Today's Users | +3% |
| New Clients | document | +3,462 | New Clients | -2% |
| Sales | cart | $103,430 | Sales | +5% |

**Pattern:** stat-card
- Icon in gradient box (40×40px)
- Large value text (20px, bold)
- Small label text (14px, muted)
- Change indicator with color (green/red)

## Charts Section

### Bar Chart (Active Users)
- Chart type: Vertical bars
- Data points: 12 months
- Stats below: Active Users (3.6K), Clicks (2m), Sales ($772)

### Line Chart (Sales Overview)
- Chart type: Multi-line
- Data series: 2 lines (comparison)
- Time range: Jan-Dec

## Projects Table

| Column | Width | Content |
|--------|-------|---------|
| COMPANIES | ~200px | Logo + company name |
| MEMBERS | ~150px | Avatar stack |
| BUDGET | ~100px | Dollar amount |
| COMPLETION | ~150px | Progress bar with % |

## Orders History

List with date groupings:
- Section header with "VIEW ALL" action
- Items grouped by date
- Each item: icon + description + amount + status

## Component Instances Used

- Stat Card ×4
- Info Card ×2
- Chart Card ×2
- Table Component ×1
- List Component ×1
- Navigation Item ×10
- Button ×2

## Token Usage

| Element | Token | Value |
|---------|-------|-------|
| Page background | `--color-background` | #f8f9fa |
| Sidebar background | `--color-surface` | #ffffff |
| Card background | `--color-surface` | #ffffff |
| Stat icon bg | `--gradient-primary` | linear-gradient |
| Card shadow | `--shadow-card` | 0 20px 27px rgba(0,0,0,0.05) |
| Card radius | `--radius-xl` | 12px |
| Section gap | `--spacing-6` | 24px |
| Card padding | `--spacing-4` | 16px |

## Responsive Behavior

No mobile variants found. Suggested breakpoints:

| Breakpoint | Changes |
|------------|---------|
| < 1280px | Reduce stat card width, stack charts |
| < 1024px | Collapsible sidebar |
| < 768px | Stack all content, hide sidebar |
| < 640px | Full-width cards |
