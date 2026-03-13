# Tables — Layout Specification

## Frame Metadata

| Property | Value |
|----------|-------|
| Figma Frame ID | `0:1777` |
| Dimensions | 1440 × 1262 px |
| Viewport | Desktop |
| Layout mode | None (absolute positioning) |

## Shells

| Shell | Position | Offset |
|-------|----------|--------|
| sidebar | fixed-left | 248px wide |
| navbar | sticky-top | 45px tall |
| footer | fixed-bottom | 20px tall |

## Content Area

- **Bounds**: x=248, y=45, width=1192, height=1197
- **Padding**: 24px all sides
- **Effective width**: 1144px

## Grid System

- **Columns**: 12
- **Gap**: 24px
- **Margin**: 24px left/right

## ASCII Structure Diagram

```
┌─────────────────────────────────────────────────────────┐
│  sidebar (248px fixed)  │        navbar (sticky)        │
│─────────────────────────┤─────────────────────────────── │
│                         │                               │
│  S  │  Authors Table (12 cols, full-width)              │
│  I  │  ┌──────────────────────────────────────────────┐ │
│  D  │  │ Title: "Authors Table"                        │ │
│  E  │  │ Columns: AUTHOR · FUNCTION · STATUS · EMPLOYED│ │
│  B  │  │ 6 rows with avatar, name, function, status,  │ │
│  A  │  │ email, employed-date, edit action             │ │
│  R  │  └──────────────────────────────────────────────┘ │
│     │                                                   │
│     │  Projects Table (12 cols, full-width)             │
│     │  ┌──────────────────────────────────────────────┐ │
│     │  │ Title: "Projects Table"                       │ │
│     │  │ Columns: COMPANIES · BUDGET · STATUS ·        │ │
│     │  │          COMPLETION (progress bar)            │ │
│     │  │ 6 rows with logo, name, budget, status badge, │ │
│     │  │ completion %, progress bar, more menu         │ │
│     │  └──────────────────────────────────────────────┘ │
│─────┤─────────────────────────────────────────────────── │
│                      footer                              │
└─────────────────────────────────────────────────────────┘
```

## Sections Table

| ID | Name | Pattern | Grid Column | Grid Row | Col Span | Bounds (w×h) |
|----|------|---------|-------------|----------|----------|---------------|
| table-1 | Authors Table | data-table | 1 / 13 | 1 / 2 | 12 | 1144×583 |
| table-2 | Projects Table | data-table | 1 / 13 | 2 / 3 | 12 | 1144×546 |

## CSS Grid Template

```css
.main-content {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  grid-template-rows: auto auto;
  gap: 24px;
  padding: 24px;
  margin-left: 248px;
  background: var(--color-background);
  min-height: calc(100vh - 45px - 20px);
}

#table-1 { grid-column: 1 / 13; grid-row: 1 / 2; }
#table-2 { grid-column: 1 / 13; grid-row: 2 / 3; }
```

## Section Details

### table-1 — Authors Table

- **Pattern**: Data table with header columns and data rows
- **Card**: White background (`var(--color-surface)`), `border-radius: 12px`, shadow `0px 20px 27px rgba(0,0,0,0.05)`
- **Header columns**: AUTHOR, FUNCTION, STATUS, EMPLOYED — bold, 14px, muted color
- **Row columns**: Avatar image (32×32, radius 8px), Name (semibold 16px), Job title (semibold 14px) / Department (regular 14px), Email (regular 14px), Date (regular 14px), Edit link, Status badge
- **Status badge**: Gradient pill — ONLINE uses `var(--gradient-success)` (green), OFFLINE uses `var(--gradient-secondary)` (gray)
- **Row dividers**: 1px lines, `var(--gray-light-alt)` background
- **Rows**: 6 data rows

**Row data**:
| Name | Job Title | Dept | Email | Date | Status |
|------|-----------|------|-------|------|--------|
| Michael John | Manager | Organization | michael@mail.com | 23/04/18 | ONLINE |
| Alexa Liras | Programator | Developer | alexa@mail.com | 23/12/20 | OFFLINE |
| Laure Perrier | Executive | Projects | laure@mail.com | 13/04/19 | ONLINE |
| Miriam Eric | Marketing | Organization | miriam@mail.com | 03/04/21 | ONLINE |
| Richard Gran | Manager | Organization | richard@mail.com | 23/03/20 | OFFLINE |
| John Levi | Tester | Developer | john@mail.com | 14/04/17 | OFFLINE |

### table-2 — Projects Table

- **Pattern**: Data table with company logos, budget, status badge, progress bar
- **Card**: White background (`var(--color-surface)`), `border-radius: 12px`, shadow `0px 20px 27px rgba(0,0,0,0.05)`
- **Header columns**: COMPANIES, BUDGET, STATUS, COMPLETION — bold, 14px, muted color
- **Row columns**: Company logo icon (24px), Company name (semibold 14px), Budget (semibold 14px), Status text badge (semibold 12px), Completion % (regular 14px), Progress bar (full-width, radius 1.5px), More dots menu
- **Status colors**: "working" = info blue text, "done" = success green text, "canceled" = error red text
- **Progress bars**: Background `var(--color-border)`, fill gradient varies by status: working = `var(--gradient-info)`, done = `var(--gradient-success)`, canceled = `var(--gradient-error)`
- **Row dividers**: 1px lines, `var(--gray-light-alt)` background
- **Rows**: 6 data rows

**Row data**:
| Company | Logo | Budget | Status | Completion |
|---------|------|--------|--------|-----------|
| Spotify Version | logo-spotify | $14,000 | working | 60% |
| Progress Track | logo-atlassian | $3,000 | working | 10% |
| Jira Platform Errors | logo-slack | Not Set | done | 100% |
| Launch new Mobile App | logo-spotify | $20,600 | canceled | 50% |
| Web Dev | logo-webdev | $4,000 | working | 80% |
| Redesign Online Store | logo-invision | $2,000 | canceled | 0% |

## Token Usage

| Token | Usage |
|-------|-------|
| `var(--color-surface)` | Table card backgrounds |
| `var(--color-background)` | Page background |
| `var(--color-text-primary)` | Primary text (names, dates) |
| `var(--color-text-secondary)` | Secondary text (headers, dept, email) |
| `var(--color-body)` | Body text color |
| `var(--gray-light-alt)` | Row divider background |
| `var(--color-border)` | Progress bar track |
| `var(--gradient-success)` | ONLINE status badge, done progress bar |
| `var(--gradient-secondary)` | OFFLINE status badge |
| `var(--gradient-info)` | Working project progress bars |
| `var(--gradient-error)` | Canceled project progress bars |
| `var(--font-family-primary)` | All text (Open Sans) |
| `var(--font-size-sm)` | Standard body text (14px) |
| `var(--font-size-base)` | Names (16px) |
| `var(--font-size-lg)` | Table titles (20px) |
| `var(--font-size-2xs)` | Status badges (12px) |
| `var(--font-weight-semibold)` | Names, job titles |
| `var(--font-weight-bold)` | Header columns |
| `var(--shadow-lg)` | Table card shadow |
| `var(--radius-card)` | Table card border-radius |
