# Generate Design Reference

Synthesize extraction outputs into a compact, platform-neutral design reference document.

## Inputs

Read these files from `${OUTPUT_DIR}`:

1. `design-system-context.json` — semantic color mappings, gradient rules, shadow style, surface colors, radius hints
2. `tokens/colors.css` — all color tokens (primitives, semantic, gradients)
3. `tokens/typography.css` — font families, sizes, weights, line heights, composite styles
4. `tokens/spacing.css` — spacing scale, component/card/section/page spacing
5. `tokens/effects.css` — shadows, border radii, blurs, transitions
6. `specs/components.md` — Button, Input, Checkbox specifications

## Output

Write a single file: `${OUTPUT_DIR}/design-reference.md`

Target: 200-300 lines, under 400 lines maximum.

## Document Structure

Use this exact structure. Every value must come from the input files — do not invent values.

```markdown
# {designSystemName} — Design Reference

> Extracted from Figma. Platform-neutral values with CSS variable annotations.

## Identity

- **Name**: {from design-system-context.json figmaFile}
- **Style**: {from designSystemType}
- **Primary Font**: {from typography.css --font-family-primary}
- **Icon Font**: {from typography.css --font-family-icons, if present}
- **Characteristics**: {from metadata.indicators, summarize 2-3 key traits}

## Color Palette

### Semantic Colors

| Name | Hex | CSS Variable | Usage |
|------|-----|-------------|-------|
| Primary | {hex} | `--color-primary` | {role from context.json} |
| Secondary | {hex} | `--color-secondary` | {role} |
| Success | {hex} | `--color-success` | {role} |
| Warning | {hex} | `--color-warning` | {role} |
| Error | {hex} | `--color-error` | {role} |
| Info | {hex} | `--color-info` | {role} |

### Gray Scale

| Name | Hex | CSS Variable |
|------|-----|-------------|
{gray-100 through gray-900 from context.json grayScaleMapping}

### Surface & Text Colors

| Name | Hex | CSS Variable | Usage |
|------|-----|-------------|-------|
| Background | {hex} | `--color-background` | Page background |
| Surface | {hex} | `--color-surface` | Card/container fills |
| Text Primary | {hex} | `--color-text-primary` | Headings, body |
| Text Secondary | {hex} | `--color-text-secondary` | Descriptions, labels |
| Text Muted | {hex} | `--color-text-muted` | Placeholders, hints |
| Text Inverse | {hex} | `--color-text-inverse` | On dark backgrounds |
| Border | {hex} | `--color-border` | Default borders |
| Input Border | {hex} | `--color-border-input` | Form field borders |

### Gradients

All gradients use **{primaryAngle}** angle.

| Name | Stops | CSS Variable | Usage |
|------|-------|-------------|-------|
{for each gradient in context.json gradientRules.semanticMapping}

## Typography

**Font**: {primary font family} | **Weights**: {list weights found}

### Type Scale

| Name | Size | Weight | Line Height | CSS Variables |
|------|------|--------|-------------|---------------|
| H1 | {px value} | {weight} | {ratio} | `--text-h1-*` |
| H2 | {px} | {weight} | {ratio} | `--text-h2-*` |
| H3 | {px} | {weight} | {ratio} | `--text-h3-*` |
| H4 | {px} | {weight} | {ratio} | `--text-h4-*` |
| H5 | {px} | {weight} | {ratio} | `--text-h5-*` |
| H6 | {px} | {weight} | {ratio} | `--text-h6-*` |
| Body Large | {px} | {weight} | {ratio} | `--text-body-lg-*` |
| Body | {px} | {weight} | {ratio} | `--text-body-*` |
| Body Small | {px} | {weight} | {ratio} | `--text-body-sm-*` |
| Button | {px} | {weight} | — | `--text-button-*` |
| Label | {px} | {weight} | — | `--text-label-*` |
| Caption | {px} | {weight} | — | `--text-caption-*` |

### Letter Spacing

Default: `{value from --font-letter-spacing-tight}` (tight, modern)

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
| Signature | {multi-layer value} | `--shadow-sm` | Cards, default elevation |
| Soft | {soft value} | `--shadow-md` | Hover states, elevated cards |
| Button | {value} | `--shadow-button` | Button resting state |
| Input Focus | {value} | `--shadow-input-focus` | Focused form fields |

### Border Radius

| Name | Value | CSS Variable | Usage |
|------|-------|-------------|-------|
| Card | {px} | `--radius-card` | Cards, containers |
| Button | {px} | `--radius-button` | Buttons |
| Input | {px} | `--radius-input` | Form inputs |
| Badge | {px} | `--radius-badge` | Badges, tags |
| Pill | {px} | `--radius-pill` | Pill shapes |
| Full | 9999px | `--radius-full` | Avatars, circles |

### Transitions

| Speed | Value | CSS Variable | Usage |
|-------|-------|-------------|-------|
| Fast | {ms} | `--transition-fast` | Hover, focus |
| Base | {ms} | `--transition-base` | General |
| Slow | {ms} | `--transition-slow` | Panels, modals |

## Components

### Button

- **Intent**: Primary action trigger
- **Background**: Gradient (`--gradient-primary`) or solid dark fill
- **Radius**: {px} (`--radius-button`)
- **Shadow**: Multi-layer signature (`--shadow-button`)
- **Text**: {size}px, weight {weight}, mixed case
- **Sizes**: Small ({h}px), Medium ({h}px), Large ({h}px)
- **Padding**: {vertical} {horizontal} (scales with size)
- **States**: Default → Hover (shadow lift + slight scale) → Active (pressed)
- **Variants**: Default, Outline (border only), With Icon, Icon Only ({size}px square)

### Input

- **Intent**: Text entry field
- **Background**: White (`--color-surface`)
- **Border**: 1px `--color-border-input`, focus: primary color accent
- **Radius**: {px} (`--radius-input`)
- **Height**: {px}
- **Text**: {size}px, weight {weight}
- **Placeholder**: `--color-text-muted`
- **Focus**: Primary border + `--shadow-input-focus` glow
- **Padding**: {vertical} {horizontal}

### Checkbox

- **Intent**: Boolean toggle
- **Size**: {px} visual, {px} touch target
- **Unchecked**: White fill, light border
- **Checked**: Dark fill (`--color-primary`), white checkmark
- **Radius**: {px} (`--radius-badge`)
- **Border**: 2px

## Design Conventions

{Write ~12-18 bullet points capturing reusable patterns from the design system.
Pull these from the input files — context.json indicators, component specs patterns, token usage.
Each bullet should be actionable for someone building a new screen.}

Examples of what to include:
- Card styling pattern (background, radius, shadow, padding)
- Active/selected state pattern (color, border changes)
- Dark section styling (gradient background, inverse text)
- Status color mapping (online/success, error/danger, etc.)
- Icon container pattern (if present — size, background, radius)
- Text hierarchy (heading + muted description pattern)
- Form layout (label position, gap between fields, input height)
- Sidebar conventions (if dark sidebar detected)
- Mobile adaptation hints (if detectable from spacing)
- Gradient usage rules (when gradient vs solid)
```

## Rules

1. **Values only from inputs** — never invent hex codes, sizes, or names
2. **Platform neutral** — use px and hex, add CSS variable names as annotations
3. **Compact** — one line per token/property, no verbose paragraphs
4. **Tables for data** — use markdown tables for all token listings
5. **Bullets for conventions** — use bullet lists for design patterns
6. **Skip empty sections** — if a token category has no data, omit it
7. **No screen layouts** — this document covers tokens, components, and conventions only
