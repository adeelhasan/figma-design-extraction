# Tables Layout

> Frame: Tables
> Dimensions: 1440×1262px
> Pattern: sidebar-content
> Figma Node ID: 0:1777

## Structure

```
┌─────────────────────────────────────────────────────────────────┐
│  Navbar (breadcrumb: Pages > Tables)                            │
├──────────┬──────────────────────────────────────────────────────┤
│          │                                                      │
│ Sidebar  │  ┌────────────────────────────────────────────────┐ │
│          │  │ Authors Table                                   │ │
│ • Dashboard │  │ (6 rows with avatars, roles, status)         │ │
│ • Tables ◄│  └────────────────────────────────────────────────┘ │
│ • Billing │                                                     │
│ • VR      │  ┌────────────────────────────────────────────────┐ │
│ • RTL     │  │ Projects Table                                 │ │
│          │  │ (6 rows with logos, budgets, progress)         │ │
│ ACCOUNT  │  └────────────────────────────────────────────────┘ │
│ • Profile│                                                      │
│ • Sign In│                                                      │
│ • Sign Up│                                                      │
├──────────┴──────────────────────────────────────────────────────┤
│  Footer                                                         │
└─────────────────────────────────────────────────────────────────┘
```

## Sections

| Section | Type | Dimensions | Notes |
|---------|------|------------|-------|
| sidebar | navigation | 267×1022 | Left navigation |
| navbar | header | 1085×45 | Breadcrumb navigation |
| table-1 | table | 1173×583 | Authors Table |
| table-2 | table | 1157×546 | Projects Table |
| footer | footer | 1116×20 | Copyright |

## Authors Table

Full-featured data table with user information.

### Columns

| Column | Width | Content | Sortable |
|--------|-------|---------|----------|
| AUTHOR | ~250px | Avatar + Name + Email | Yes |
| FUNCTION | ~150px | Role + Department badge | Yes |
| STATUS | ~100px | Online/Offline badge | Yes |
| EMPLOYED | ~120px | Date | Yes |
| (actions) | ~80px | Edit link | No |

### Row Data

| Author | Function | Status | Employed |
|--------|----------|--------|----------|
| Michael John | Manager / Organization | ONLINE | 23/04/18 |
| Alexa Liras | Programator / Developer | OFFLINE | 11/01/19 |
| Laura Perner | Executive / Projects | ONLINE | 04/05/21 |
| Miriam Eric | Programator / Developer | OFFLINE | 14/09/20 |
| Richard Gran | Manager / Executive | ONLINE | 04/10/21 |
| John Levi | Programator / Developer | ONLINE | 14/09/20 |

### Status Badges

- **ONLINE:** Green background (`--color-status-online`)
- **OFFLINE:** Gray background (`--color-status-offline`)

## Projects Table

Project tracking table with budget and completion status.

### Columns

| Column | Width | Content |
|--------|-------|---------|
| COMPANIES | ~200px | Logo + Project name |
| BUDGET | ~120px | Dollar amount |
| STATUS | ~100px | Status text |
| COMPLETION | ~200px | Progress bar |
| (actions) | ~60px | More options |

### Row Data

| Project | Budget | Status | Completion |
|---------|--------|--------|------------|
| Spotify Version | $2,500 | working | 60% |
| Progress Track | $5,000 | cancelled | 10% |
| Jira Platform Errors | Not set | done | 100% |
| Launch new Mobile App | $20,000 | done | 100% |
| Web Dev | $5,000 | working | 80% |
| Redesign Online Store | $2,000 | cancelled | 0% |

### Status Colors

- **working:** Blue (`--color-status-working`)
- **done:** Green (`--color-status-done`)
- **cancelled:** Gray (`--color-status-cancelled`)

## Component Usage

- Table Card ×2
- Avatar ×6
- Status Badge ×12
- Progress Bar ×6
- Navigation Item ×10

## Token Usage

| Element | Token | Value |
|---------|-------|-------|
| Table header text | `--color-text-muted` | #8392ab |
| Table row border | `--color-border-light` | #e9ecef |
| Badge radius | `--radius-sm` | 4px |
| Progress bar bg | `--color-gray-200` | #f0f0f0 |
| Progress bar fill | `--gradient-info` | blue gradient |

## Table Styling

```css
/* Table card */
.table-card {
  background: var(--color-surface);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-card);
  padding: var(--spacing-4);
}

/* Table header */
.table-header {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Table row */
.table-row {
  border-bottom: 1px solid var(--color-border-light);
  padding: var(--spacing-3) 0;
}
```
