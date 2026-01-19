# Layout Specifications

> Extracted from: Soft UI Dashboard Free (Community)
> Generated: 2026-01-18
> Screens: 6 (unique layouts)
> Mode: --thorough (10-level deep traversal)

## Available Screens

| Screen | Dimensions | Pattern | Sections | Details |
|--------|------------|---------|----------|---------|
| [Dashboard](layouts/Dashboard.md) | 1440×1584 | sidebar-content | 9 | Main dashboard with stats, charts, tables |
| [Tables](layouts/Tables.md) | 1440×1262 | sidebar-content | 4 | Authors table + Projects table |
| [Billing](layouts/Billing.md) | 1440×1204 | sidebar-content | 9 | Credit card, payment methods, transactions |
| [Profile](layouts/Profile.md) | 1440×1409 | sidebar-content | 7 | Profile header, settings, projects |
| [SignUp](layouts/SignUp.md) | 1440×1252 | split-screen | 5 | Registration form with hero background |
| [SignIn](layouts/SignIn.md) | 1440×1137 | split-screen | 4 | Login form with hero background |

## Common Patterns Found

### Sidebar-Content Layout
**Description:** Fixed left sidebar with scrollable main content area
**Used in:** Dashboard, Tables, Billing, Profile

Structure:
```
┌────────────────────────────────────────────────────┐
│  Navbar                                            │
├──────────┬─────────────────────────────────────────┤
│          │                                         │
│  Sidebar │  Content                                │
│  (248px) │  (scrollable)                           │
│          │                                         │
├──────────┴─────────────────────────────────────────┤
│  Footer                                            │
└────────────────────────────────────────────────────┘
```

### Split-Screen Auth Layout
**Description:** Form on left/center, decorative hero image on right
**Used in:** SignIn, SignUp

Structure:
```
┌────────────────────────────────────────────────────┐
│  Navbar (centered links)                           │
├───────────────────────┬────────────────────────────┤
│                       │                            │
│  Form Card            │  Hero Image               │
│  (centered)           │  (gradient wave)          │
│                       │                            │
├───────────────────────┴────────────────────────────┤
│  Footer (links + social icons)                     │
└────────────────────────────────────────────────────┘
```

## Grid System

All dashboard screens use a consistent grid:
- **Container width:** 1440px
- **Sidebar width:** 248-294px
- **Content area:** ~1120px
- **Gutter:** 24px
- **Section gaps:** 24-32px

## Token Usage

| Element | Token |
|---------|-------|
| Background | `var(--color-background)` (#f8f9fa) |
| Sidebar bg | `var(--color-surface)` (#ffffff) |
| Card bg | `var(--color-surface)` (#ffffff) |
| Section gap | `var(--spacing-6)` (24px) |
| Card padding | `var(--spacing-4)` to `var(--spacing-6)` |
| Card radius | `var(--radius-xl)` (12px) |
| Card shadow | `var(--shadow-card)` |

## Responsive Notes

The extracted designs are desktop-first at 1440px width. No mobile/tablet variants were found in this Figma file. Consider implementing:

- **< 1024px:** Collapsible sidebar
- **< 768px:** Hidden sidebar with hamburger menu
- **< 640px:** Stacked card layouts

## Navigation Structure

### Main Sidebar Navigation
1. Dashboard (active state)
2. Tables
3. Billing
4. Virtual Reality (not in free version)
5. RTL (not in free version)

### Account Pages
1. Profile
2. Sign In
3. Sign Up
