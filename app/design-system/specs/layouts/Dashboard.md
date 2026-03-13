# Dashboard — Layout Specification

## Frame Metadata

| Property | Value |
|----------|-------|
| Screen Name | Dashboard-sidebar transparent |
| Figma Frame ID | 0:263 |
| Dimensions | 1440 × 1584 px |
| Viewport | Desktop |
| Shells | sidebar, navbar, footer |

## Content Area

| Property | Value |
|----------|-------|
| Offset X (after sidebar) | 248px |
| Offset Y (after navbar) | 45px |
| Width | 1192px |
| Padding | 24px all sides |
| Effective Content Width | 1144px |

## Grid System

| Property | Value |
|----------|-------|
| Columns | 12 |
| Column Width | ~77px |
| Gap | 24px |
| Margin | 24px left/right |

## Layout Pattern

4-row dashboard grid: stats row → info cards → charts → table+timeline

## ASCII Structure

```
┌─────────────────────────────────────────────────────────────────┐
│ NAVBAR (sticky, 1440px wide)                                     │
├────────┬────────────────────────────────────────────────────────┤
│        │ row-1: Stats Widgets                                    │
│ SIDE   │ [Widget-1 3col][Widget-2 3col][Widget-3 3col][Widget-4 3col]│
│ BAR    ├────────────────────────────────────────────────────────┤
│ 248px  │ row-2: Info Cards                                       │
│        │ [Card-1  ──── 7 cols ──── ][Card-2 ── 5 cols ──]       │
│        ├────────────────────────────────────────────────────────┤
│        │ row-3: Charts                                           │
│        │ [Chart-1 ─ 5 cols ─ ][Chart-2 ──── 7 cols ────]       │
│        ├────────────────────────────────────────────────────────┤
│        │ row-4: Table + Timeline                                 │
│        │ [Table-1 ──────── 8 cols ──────── ][Timeline 4 cols]   │
├────────┴────────────────────────────────────────────────────────┤
│ FOOTER (full width)                                              │
└─────────────────────────────────────────────────────────────────┘
```

## Sections Table

| ID | Section | Grid Column | Grid Row | Col Span | Width | Height | Description |
|----|---------|-------------|----------|----------|-------|--------|-------------|
| widget-1 | Widget-1 | 1 / 4 | 1 / 2 | 3 | 296px | 117px | Today's Money stat card |
| widget-2 | Widget-2 | 4 / 7 | 1 / 2 | 3 | 305px | 106px | Today's Users stat card |
| widget-3 | Widget-3 | 7 / 10 | 1 / 2 | 3 | 310px | 106px | New Clients stat card |
| widget-4 | Widget-4 | 10 / 13 | 1 / 2 | 3 | 308px | 106px | Sales stat card |
| card-1 | Card-1 | 1 / 8 | 2 / 3 | 7 | 710px | 277px | Built by Developers promo card |
| card-2 | Card-2 | 8 / 13 | 2 / 3 | 5 | 498px | 277px | Work with the Rockets promo card |
| chart-1 | Chart-1 | 1 / 6 | 3 / 4 | 5 | 518px | 469px | Active Users bar chart |
| chart-2 | Chart-2 | 6 / 13 | 3 / 4 | 7 | 691px | 469px | Sales Overview line chart |
| table-1 | Table-1 | 1 / 9 | 4 / 5 | 8 | 796px | 580px | Projects data table |
| timeline-1 | Timeline | 9 / 13 | 4 / 5 | 4 | 404px | 580px | Orders History timeline |

## CSS Grid Template

```css
.main-content {
  margin-left: 248px;
  padding: 24px;
  background: var(--color-background);
  min-height: 100vh;
}
.content-grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 24px;
}
#widget-1   { grid-column: 1 / 4;  grid-row: 1 / 2; }
#widget-2   { grid-column: 4 / 7;  grid-row: 1 / 2; }
#widget-3   { grid-column: 7 / 10; grid-row: 1 / 2; }
#widget-4   { grid-column: 10 / 13; grid-row: 1 / 2; }
#card-1     { grid-column: 1 / 8;  grid-row: 2 / 3; }
#card-2     { grid-column: 8 / 13; grid-row: 2 / 3; }
#chart-1    { grid-column: 1 / 6;  grid-row: 3 / 4; }
#chart-2    { grid-column: 6 / 13; grid-row: 3 / 4; }
#table-1    { grid-column: 1 / 9;  grid-row: 4 / 5; }
#timeline-1 { grid-column: 9 / 13; grid-row: 4 / 5; }
```

## Components Used

| Component | Section | Description |
|-----------|---------|-------------|
| Stat Card | Widget-1..4 | White card with gradient icon box, metric label, value, and percentage tag |
| Promo Card | Card-1, Card-2 | Dark gradient info card with illustration and CTA |
| Bar Chart | Chart-1 | Active Users chart with stat summary row (Users, Clicks, Sales, Items) |
| Line Chart | Chart-2 | Sales Overview line chart with axis labels |
| Data Table | Table-1 | Projects table with company logo, member avatars, budget, and progress bar |
| Timeline | Timeline | Orders History vertical timeline with gradient icon dots |

## Token Usage

| Token | Usage |
|-------|-------|
| `var(--color-background)` | Page background (#f8f9fa) |
| `var(--color-surface)` | Card backgrounds (white) |
| `var(--color-text-primary)` | Main headings and values |
| `var(--color-text-secondary)` | Labels and meta text |
| `var(--color-body)` | Body text |
| `var(--color-success)` | Positive percentage tags (green) |
| `var(--color-error)` | Negative percentage tag (red) |
| `var(--gradient-primary)` | Stat widget icon boxes, Card-1 background |
| `var(--gradient-dark)` | Chart-1 background, sidebar doc card |
| `var(--gradient-info)` | Progress bars (Chart-1 stat icon) |
| `var(--gradient-warning)` | Widget icon variant |
| `var(--gradient-error)` | Timeline icon |
| `var(--shadow-lg)` | Card drop shadows (0 20px 27px rgba(0,0,0,0.05)) |
| `var(--shadow-sm)` | Gradient icon box shadow |
| `var(--radius-card)` | Card border radius (1rem / 16px) |
| `var(--radius-md)` | Icon box border radius (8px) |
| `var(--spacing-4)` | Standard padding (1rem) |
| `var(--spacing-6)` | Large gap (1.5rem) |
| `var(--font-family-primary)` | Body text (Open Sans) |
| `var(--font-family-secondary)` | Headings (Montserrat) |
| `var(--font-weight-bold)` | Values and highlighted text |
| `var(--font-weight-semibold)` | Labels |
| `var(--font-size-sm)` | Body/label text (0.875rem) |
| `var(--font-size-2xs)` | Small meta text (0.75rem) |
