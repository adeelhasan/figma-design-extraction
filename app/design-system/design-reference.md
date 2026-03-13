# Soft UI Dashboard Free — Design Reference

> Extracted from Figma. Platform-neutral values with CSS variable annotations.

## Identity

- **Name**: Soft UI Dashboard Free (Community)
- **Style**: Soft UI — subtle, diffused shadows with floating card appearance
- **Primary Font**: Open Sans, sans-serif
- **Characteristics**: Multi-layer soft shadows on all cards, 135deg gradient system across semantic colors, glassmorphic floating sidebar with backdrop blur

## Color Palette

### Semantic Colors

| Name | Hex | CSS Variable | Usage |
|------|-----|-------------|-------|
| Primary | #cb0c9f | `--color-primary` | Brand primary, CTAs, toggles, active nav, accent text |
| Secondary | #8392ab | `--color-secondary` | Secondary text, muted labels, table headers, borders |
| Success | #82d616 | `--color-success` | Success states, positive indicators, completion badges |
| Warning | #fbcf33 | `--color-warning` | Warning states, caution indicators |
| Error | #ea0606 | `--color-error` | Error states, destructive actions, negative indicators |
| Info | #17c1e8 | `--color-info` | Info states, informational badges, secondary accents |

### Gray Scale

| Name | Hex | CSS Variable |
|------|-----|-------------|
| Gray 50 | #fafafa | `--gray-50` |
| Gray 100 | #f8f9fa | `--gray-100` |
| Gray 200 | #f0f0f0 | `--gray-200` |
| Gray 300 | #e9ecef | `--gray-300` |
| Gray 400 | #d2d6da | `--gray-400` |
| Gray 500 | #adb5bd | `--gray-500` |
| Gray 600 | #8392ab | `--gray-600` |
| Gray 700 | #67748e | `--gray-700` |
| Gray 800 | #344767 | `--gray-800` |
| Gray 900 | #252f40 | `--gray-900` |

### Surface & Text Colors

| Name | Hex | CSS Variable | Usage |
|------|-----|-------------|-------|
| Background | #f8f9fa | `--color-background` | Page background |
| Surface | #ffffff | `--color-surface` | Card/container fills |
| Text Primary | #252f40 | `--color-text-primary` | Headings, body copy |
| Text Secondary | #8392ab | `--color-text-secondary` | Descriptions, labels |
| Text Muted | #67748e | `--color-text-muted` | Placeholders, hints |
| Border | #e9ecef | `--color-border` | Default borders |

### Gradients

All gradients use **135deg** angle.

| Name | Stops | CSS Variable | Usage |
|------|-------|-------------|-------|
| Primary | #ff0080 → #7928ca | `--gradient-primary` | Primary buttons, accent elements, active indicators |
| Secondary | #a8b8d8 → #627594 | `--gradient-secondary` | Secondary buttons, muted elements |
| Info | #21d4fd → #2152ff | `--gradient-info` | Info cards, stat boxes |
| Success | #98ec2d → #17ad37 | `--gradient-success` | Success indicators, positive stat cards |
| Warning | #fbcf33 → #f53939 | `--gradient-warning` | Warning indicators, caution elements |
| Error | #ff667c → #ea0606 | `--gradient-error` | Error indicators, destructive elements |
| Dark | #3a416f → #141727 | `--gradient-dark` | Dark backgrounds, sidebar, dark cards |
| Light | #ebeff4 → #ced4da | `--gradient-light` | Light backgrounds, disabled states |

## Typography

**Font**: Open Sans | **Weights**: 400 (Regular), 600 (SemiBold), 700 (Bold)

### Type Scale

| Name | Size | Weight | Line Height | CSS Variables |
|------|------|--------|-------------|---------------|
| H1 | 48px | 400 | 1.17 | `--h1-*` |
| H2 | 36px | 400 | 1.17 | `--h2-*` |
| H3 | 30px | 400 | 1.17 | `--h3-*` |
| H4 | 24px | 400 | 1.17 | `--h4-*` |
| H5 | 20px | 400 | 1.17 | `--h5-*` |
| H6 | 16px | 400 | 1.175 | `--h6-*` |
| Body Large | 16px | 400 | 1.625 | `--body-lg-*` |
| Body | 14px | 400 | 1.36 | `--body-base-*` |
| Body Small | 13px | 400 | 1.17 | `--body-sm-*` |
| Button | 14px | 700 | — | `--label-*` |
| Label | 13px | 700 | 1.17 | `--label-*` |
| Caption | 9px | 600 | 1.167 | `--caption-*` |

### Letter Spacing

Default: `-0.033em` (tight, modern aesthetic)

## Spacing

**Base unit**: 4px

### Scale

| Token | Value | Common Usage |
|-------|-------|-------------|
| `--spacing-1` | 4px | Icon gaps, micro spacing |
| `--spacing-2` | 8px | Button padding, small gaps |
| `--spacing-3` | 12px | Input padding, card padding |
| `--spacing-4` | 16px | Section spacing, standard padding |
| `--spacing-6` | 24px | Major sections, page margins |
| `--spacing-8` | 32px | Page padding, large gaps |
| `--spacing-12` | 48px | Major layout divisions |

## Effects

### Shadows

| Name | Value | CSS Variable | Usage |
|------|-------|-------------|-------|
| Small | 0 2px 4px -1px rgba(0,0,0,0.07) | `--shadow-sm` | Buttons, default elevation |
| Medium | 0 4px 6px -1px rgba(0,0,0,0.12) | `--shadow-md` | Hover states, elevated cards |
| Large | 0 20px 27px rgba(0,0,0,0.05) | `--shadow-lg` | Cards, floating elements |
| Focus Ring | 0 0 0 2px rgba(226,147,211,0.50) | `--shadow-focus` | Focused form fields |

### Border Radius

| Name | Value | CSS Variable | Usage |
|------|-------|-------------|-------|
| Small | 4px | `--radius-sm` | Checkboxes, tags |
| Default | 8px | `--radius-DEFAULT` | Buttons, inputs |
| Medium | 8px | `--radius-md` | Buttons |
| Card | 16px | `--radius-card` | Cards, containers |
| Pill | 35px | `--radius-pill` | Pill shapes, badges |
| Full | 9999px | `--radius-full` | Avatars, circles |

## Components

### Button

- **Intent**: Primary action trigger
- **Background**: Gradient (`--gradient-primary`) for solid; transparent with primary border for outline
- **Radius**: 8px (`--radius-md`)
- **Shadow**: Two-layer soft shadow — 0 2px 4px -1px rgba(0,0,0,0.07), 0 4px 6px -1px rgba(0,0,0,0.12)
- **Text**: 14px Bold, uppercase label
- **Sizes**: Small (32px), Medium (40px), Large (47px)
- **States**: Default → Hover (shadow lift) → Active (reduced opacity ~85%)
- **Variants**: Solid gradient, Outline (border + text in primary), With Icon, Icon Only (40px square)

### Input

- **Intent**: Text entry field
- **Background**: White (`--color-surface`)
- **Border**: 1px `--color-border-input` (default); soft primary tint (#e293d3) on active
- **Radius**: 6px (`--radius-DEFAULT`)
- **Height**: 40px
- **Text**: 14px, placeholder weight 600 in gray-400, active value weight 400 in dark
- **Focus**: Primary-tinted border + glow ring (0 0 0 2px rgba(226,147,211,0.50))
- **Padding**: ~12px horizontal

### Checkbox

- **Intent**: Boolean toggle
- **Size**: 20px visual, 20px touch target
- **Unchecked**: White fill, light gray border (#d9d9d9)
- **Checked**: Dark fill (`--color-dark` #252f40), white checkmark
- **Radius**: 4px (`--radius-sm`)
- **Border**: 2px

## Design Conventions

- **Card Pattern**: White surface (`--color-surface`) with 16px radius, multi-layer soft shadow (sm + md), 16-24px padding — creates floating appearance without harsh depth
- **Active/Selected States**: Use `--color-primary` (#cb0c9f) for borders and text, paired with soft primary-tinted glow on inputs
- **Dark Surfaces**: Apply `--gradient-dark` (#3a416f → #141727) with 135deg angle; use `--color-text-inverse` for text contrast
- **Status Color Mapping**: Success (#82d616), Warning (#fbcf33), Error (#ea0606), Info (#17c1e8) — never override with other colors
- **Gradient Usage**: All semantic gradients use 135deg consistently; apply to buttons, backgrounds, and accent elements — solid colors only for text and borders
- **Text Hierarchy**: Headings in 48-16px range with tight line-height (1.17); body copy at 14-16px with relaxed line-height (1.36-1.625) — use weight 400 for body, 700 for labels/buttons
- **Form Layout**: Input height 40px, padding 12px horizontal; label above with 8px gap; 16px gap between adjacent fields
- **Sidebar Convention**: Floating effect with backdrop blur (10px); uses `--gradient-dark` background; semi-transparent white overlay for glassmorphic appearance
- **Icon & Avatar Sizing**: 40px squares for icon buttons; 48-56px for user avatars with `--radius-full` (9999px) — scale proportionally in lists
- **Spacing Consistency**: Use 16px (`--spacing-4`) for section gaps, 24px (`--spacing-6`) for major layout divisions, 8px (`--spacing-2`) for component internal padding
- **Focus & Hover**: All interactive elements respond with shadow lift and/or color shift — buttons scale slightly (+2-4px), inputs show primary-tinted glow ring
- **Placeholder Text**: Use `--color-text-muted` (#67748e) with weight 600 for semantic distinction from entered values
- **Disabled States**: Reduce opacity to ~50%, use `--gray-300` or `--gray-400` for backgrounds and borders
- **Border Color**: Default `--color-border` (#e9ecef); input-specific `--color-border-input` (#d9d9d9) for form consistency
