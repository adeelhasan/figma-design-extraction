# Tables Layout

> Frame: Tables
> Dimensions: 1440×1262px
> Pattern: sidebar-content
> Figma Node ID: 0:1777

## Structure

```
┌─────────────────────────────────────────────────────────────────┐
│  Navbar (Pages / Sign In)                                       │
├──────────┬──────────────────────────────────────────────────────┤
│          │                                                      │
│ Sidebar  │  ┌────────────────────────────────────────────────┐ │
│          │  │ Authors Table                                   │ │
│ • Dashboard │  │ (5 rows with avatars, roles, status)         │ │
│ • Tables ◄│  └────────────────────────────────────────────────┘ │
│          │                                                     │
│          │  ┌────────────────────────────────────────────────┐ │
│          │  │ Projects Table                                 │ │
│          │  │ (6 rows with names, budgets, progress)         │ │
│          │  └────────────────────────────────────────────────┘ │
├──────────┴──────────────────────────────────────────────────────┤
│  Footer                                                         │
└─────────────────────────────────────────────────────────────────┘
```

## Sections

| Section | Type | Dimensions | Notes |
|---------|------|------------|-------|
| sidebar | navigation | 267×1022 | Left navigation with gradient background |
| navbar | header | 1085×45 | Breadcrumb and user navigation |
| table-1 | table | 1173×583 | Authors Table (user/author data) |
| table-2 | table | 1157×546 | Projects Table (project tracking) |
| footer | footer | 1116×20 | Copyright information |

## Authors Table

Full-featured data table with user information and contact details.

### Columns

| Column | Width | Content |
|--------|-------|---------|
| AUTHOR | ~280px | Avatar + Name (32px circle) + Email (secondary) |
| FUNCTION | ~200px | Role + Department |
| STATUS | ~120px | Status badge (ONLINE/OFFLINE) |
| EMPLOYED | ~120px | Employment date (DD/MM/YY) |
| (action) | ~80px | Edit link |

### Row Data (Extracted from Figma)

| # | Author | Function | Status | Employed | Action |
|---|--------|----------|--------|----------|--------|
| 1 | Michael John | Manager / Organization | ONLINE | 23/04/18 | Edit |
| 2 | Alexa Liras | Programator / Developer | OFFLINE | 23/12/20 | Edit |
| 3 | Laure Perrier | Executive / Projects | ONLINE | 13/04/19 | Edit |
| 4 | Miriam Eric | Marketing / Organization | ONLINE | 03/04/21 | Edit |
| 5 | John Murphy | Sales | OFFLINE | 10/02/22 | Edit |

### Status Badges

- **ONLINE:** Green background (#82d616), white text, pill-shaped (border-radius: 100px)
- **OFFLINE:** Gray background (#8392ab), white text, pill-shaped

### Styling Details

- **Avatar:** 32px circular with initials or thumbnail
- **Name:** 14px, bold, dark gray (#344767)
- **Email:** 13px, regular, medium gray (#8392ab)
- **Row padding:** 12px vertical, 16px horizontal
- **Row border:** Light gray (#e9ecef) divider

## Projects Table

Project tracking table with budget allocation and progress metrics.

### Columns

| Column | Width | Content |
|--------|-------|---------|
| COMPANIES | ~280px | Project logo + Project name |
| BUDGET | ~120px | Dollar amount or "Not Set" |
| STATUS | ~120px | Status badge (working/done/canceled) |
| COMPLETION | ~200px | Progress bar with percentage |
| (action) | ~80px | More options / menu |

### Row Data (Extracted from Figma)

| # | Project | Budget | Status | Completion | Action |
|---|---------|--------|--------|------------|--------|
| 1 | Spotify Version | $14,000 | working | 60% | Menu |
| 2 | Progress Track | $3,000 | working | 10% | Menu |
| 3 | Jira Platform Errors | Not Set | done | 100% | Menu |
| 4 | Launch new Mobile App | $20,600 | canceled | 50% | Menu |
| 5 | Web Dev | $4,000 | working | 80% | Menu |
| 6 | Redesign Online Store | $2,000 | canceled | 0% | Menu |

### Status Badges

- **working:** Cyan background (#17c1e8), white text, 8px border-radius
- **done:** Green background (#82d616), white text, 8px border-radius
- **canceled:** Red background (#ea0606), white text, 8px border-radius

### Progress Bar

- **Background:** Light gray (#e9ecef)
- **Fill color:** Matches status color (blue for working, green for done)
- **Height:** 4px
- **Border-radius:** 2px
- **Percentage label:** Right-aligned, 13px text

### Styling Details

- **Logo:** 24px square or circular
- **Project name:** 14px, bold, dark gray (#344767)
- **Budget:** 13px, regular, medium gray (#8392ab)
- **Row padding:** 12px vertical, 16px horizontal
- **Row border:** Light gray (#e9ecef) divider

## Design Tokens

| Element | Token | Value |
|---------|-------|-------|
| Table card background | `--color-card` | #ffffff |
| Table card radius | `--radius-2xl` | 16px |
| Table card shadow | `--shadow-md` | 0 2px 4px -1px rgba(0,0,0,0.07), 0 4px 6px -1px rgba(0,0,0,0.12) |
| Page background | `--color-background` | #f8f9fa |
| Table header text | `--color-secondary` | #8392ab |
| Table header bg | `--color-background` | #f8f9fa |
| Table text | `--color-text` | #344767 |
| Table border | `--color-secondary` | #e9ecef |
| Status ONLINE | `--color-success` | #82d616 |
| Status OFFLINE | `--color-secondary` | #8392ab |
| Status working | `--color-info` | #17c1e8 |
| Status done | `--color-success` | #82d616 |
| Status canceled | `--color-error` | #ea0606 |

## Component Usage

- Table Card ×2 (16px radius, soft shadow)
- Avatar ×5 (32px circle)
- Status Badge ×11 (pill and rectangular shapes)
- Progress Bar ×6
- Navigation Items in Sidebar
- Navbar with breadcrumb
