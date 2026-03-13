# Visual-First Screen Extraction Agent

## Purpose

Extract layout spec AND generate HTML preview for a SINGLE screen in ONE session using a visual-first approach. All data is pre-packaged — no Figma queries needed.

**One agent per screen. N screens = N parallel agents.**

## Inputs

### Primary: Screen Package (one file)

Read the pre-packaged screen data:
```
${OUTPUT_DIR}/.cache/screen-packages/{ScreenName}.json
```

This single file contains:
- `screenName` — the screen name
- `screenshotPath` — path to Figma screenshot
- `screenLayout` — top-level sections with bounds and child summaries
- `sectionSubtrees` — full slim subtrees for all non-shell sections
- `textContent` — pre-extracted text from each section (flat list of exact Figma text)
- `sectionStyles` — pre-extracted, token-mapped CSS styles for every visual node per section
- `tokenLookup` — CSS custom property name→value mapping for all tokens
- `shellSections` — names of sections handled by shells (skip these)
- `shellHTML` — pre-built shell HTML fragments keyed by shell name
- `shellConfig` — which shells apply to this screen + shell definitions
- `tokenCSS` — all token CSS files (colors.css, typography.css, etc.)
- `designContext` — design system fingerprint
- `icons` — icon manifest entries for this screen
- `assets` — asset manifest entries for this screen

### Secondary: Screenshot (vision)

Read the Figma screenshot for visual analysis:
```
${OUTPUT_DIR}/preview/layouts/screenshots/{ScreenName}.png
```

**No Figma queries needed.** All data is pre-packaged in the screen package.

## Outputs (write all four)

- Layout spec: `${OUTPUT_DIR}/specs/layouts/{ScreenName}.md`
- Layout schema: `${OUTPUT_DIR}/specs/layouts/{ScreenName}.json`
- HTML preview: `${OUTPUT_DIR}/preview/layouts/{ScreenName}.html`
- Content data: `${OUTPUT_DIR}/preview/layouts/data/{ScreenName}.json`

## Process

### Step 1: Visual Analysis (REQUIRED FIRST)

**Before parsing any JSON, READ the Figma screenshot** to understand the visual layout.

Load: `${OUTPUT_DIR}/preview/layouts/screenshots/{ScreenName}.png`

Identify:
- Number of distinct horizontal rows
- Number of columns per row
- Which sections span multiple columns or rows
- Relative sizes (1/3, 1/2, 2/3, full-width)
- Shell elements (sidebar, navbar) — these are pre-built, just note their position

**Create a mental model of the grid before examining structured data.**

### Step 2: Read Screen Package

Read `${OUTPUT_DIR}/.cache/screen-packages/{ScreenName}.json`.

Cross-reference the visual model from Step 1 with the structured data:
- `screenLayout.sections` confirms section names, bounds, and hierarchy
- `sectionSubtrees` provides full content for each non-shell section
- `shellConfig.screenShells` tells you which shells apply

### Content Fidelity Rules (CRITICAL)

The `textContent` field in the screen package contains ALL text exactly as it appears in Figma. You MUST:

1. **NEVER invent, replace, or paraphrase text content.** Use EXACTLY the text from `textContent`.
2. **For names**: Use the exact name from the Figma data — never substitute with generic placeholders
3. **For numbers/amounts**: Use the exact values — never round, simplify, or replace with different numbers
4. **For dates**: Use the exact dates from the data — never shift to different months or years
5. **For table data**: Use the exact rows, values, and labels from `textContent` and `sectionSubtrees`
6. **If text is unclear**: Use the `characters` field from TEXT nodes in `sectionSubtrees` as ground truth

The `textContent` field provides a pre-extracted flat list of all text in each section. Cross-reference this with the screenshot to ensure nothing is missed or altered.

### Token Usage Rules (MANDATORY)

The `tokenLookup` field maps token names to their CSS values. When generating HTML/CSS:

1. **Font family**: Always use `var(--font-family-primary)`, NEVER `var(--font-family-sans)` or `system-ui`
2. **Colors**: Always use `var(--color-*)` tokens, NEVER use `--gray-*` (Tailwind convention)
3. **Gradients**: Always use `var(--gradient-*)`, NEVER hardcode gradient hex values inline
4. **Font sizes**: Always use `var(--font-size-*)`, NEVER hardcode px values for fonts
5. **Font weights**: Always use `var(--font-weight-*)`, NEVER hardcode numeric weights
6. **Spacing**: Always use `var(--spacing-*)`, NEVER hardcode px for padding/margins/gaps
7. **Effects**: Always use `var(--shadow-*)` and `var(--radius-*)`, NEVER hardcode shadows/radii

**To find the right token**: Search `tokenLookup` for the hex value from the Figma data, then use that token name.

### Asset Image Rules (MANDATORY)

The `assets` field in the screen package contains image entries for this screen. Each entry has:
- `name` — Figma node name (e.g., "home-decor-1", "curved0")
- `hasOriginal` — whether a real image was downloaded
- `relativePath` — relative path from the HTML file to the image (e.g., `../../assets/images/photos/home-decor-1.png`)
- `placeholder` — gradient fallback config

**When `hasOriginal` is true and `relativePath` is present:**
- Use `url('{relativePath}')` in CSS `background-image` or an `<img src="{relativePath}">` tag
- Match the asset to the correct section by cross-referencing the name/dimensions with the screenshot
- For hero banners/backgrounds: use as `background-image` with `background-size: cover`
- For content images (cards, photos): use as `background` or `<img>` with appropriate sizing

**Only use gradient placeholders when `hasOriginal` is false.**

### Style Fidelity Rules (CRITICAL)

The `sectionStyles` field contains pre-extracted, token-mapped CSS properties for every visual node in each section. Each entry has:
- `path` — node path within the section (e.g., `projects/Background`)
- `role` — semantic role: `card-background`, `divider`, `button`, `avatar`, `card`, `badge`, `input`, `gradient-surface`, or `element`
- `background` — token-mapped background (e.g., `var(--color-surface)` or `var(--gradient-primary)`)
- `borderRadius` — token-mapped radius (e.g., `var(--radius-card)`)
- `shadow` — token-mapped shadow (e.g., `var(--shadow-md)`)
- `border` — border string (e.g., `1px solid var(--color-border-light)`)
- `opacity` — opacity value if < 1.0

**You MUST use `sectionStyles` as the primary source for CSS visual properties:**

1. **Match entries to HTML elements by `path`** — the path segments correspond to the Figma node hierarchy
2. **Use `role` to understand element purpose:**
   - `card-background`: apply `background`, `borderRadius`, `shadow` to the card's container div
   - `divider`: use `border-bottom` with the specified color/weight, not a visible `<hr>` or background
   - `button`: apply `background`, `borderRadius`, `shadow` to button elements
   - `badge`/`avatar`/`input`: apply styles to the corresponding UI element
   - `gradient-surface`: apply the gradient `background` to the surface element
3. **Apply ALL non-null properties from each entry** — do not skip shadow, border, or opacity
4. **Only use default/fallback values when no `sectionStyles` entry exists for an element**
5. **Never guess shadow weights, border colors, or opacity** — if `sectionStyles` provides a value, use it exactly

Example: if `sectionStyles` says a card has `"shadow": "var(--shadow-md)"` and `"borderRadius": "var(--radius-card)"`, your CSS must use exactly those tokens, not `var(--shadow-sm)` or a hardcoded radius.

### Step 3: Extract Layout Structure

Using the visual analysis + structured data:

1. **Identify content container** — the shared parent of non-shell sections
2. **Extract container padding** from auto-layout properties
3. **Map sections to grid positions** using bounds relative to content area
4. **Detect layout patterns** (sidebar-content, dashboard-grid, etc.)

For each non-shell section, extract from `sectionSubtrees`:
- `name`, `type`, `pattern`
- `bounds` — { x, y, width, height }
- `gridPosition` — { column, columnSpan, row, rowSpan }
- `layout` — auto-layout properties (mode, gap, padding)
- `components` — component instances used

### Step 4: Generate Layout Schema (JSON)

Write to: `${OUTPUT_DIR}/specs/layouts/{ScreenName}.json`

```json
{
  "$schema": "semantic-layout-v1",
  "screen": "{ScreenName}",
  "figmaFrameId": "{frameId}",
  "dimensions": { "width": 1440, "height": 900, "viewport": "desktop" },
  "shells": ["sidebar", "navbar"],
  "contentArea": {
    "bounds": { "x": 296, "y": 60, "width": 1120, "height": 1100 },
    "padding": { "left": 24, "right": 24, "top": 24, "bottom": 24 },
    "effectiveWidth": 1072
  },
  "grid": { "columns": 12, "gap": 24, "margin": { "left": 32, "right": 32 } },
  "rows": [
    {
      "id": "row-1",
      "y": 100,
      "height": 220,
      "children": [
        {
          "id": "section-1",
          "name": "Credit Card",
          "gridColumn": "1 / 5",
          "gridRow": "1 / 2",
          "columnSpan": 4,
          "rowSpan": 1,
          "bounds": { "x": 32, "y": 100, "width": 428, "height": 220 }
        }
      ]
    }
  ],
  "sections": { "order": ["section-1", "section-2"] },
  "css": { "gridTemplate": "...", "containerStyles": {} }
}
```

**`shells` field:** List the shell names from `shellConfig.screenShells`.

### Step 5: Generate Layout Spec (Markdown)

Write to: `${OUTPUT_DIR}/specs/layouts/{ScreenName}.md`

Include: frame metadata, grid system, ASCII structure diagram, sections table with grid positions, CSS grid template, components used, token usage.

### Step 6: Extract Content Data

Extract text content from `sectionSubtrees` for realistic previews.

Write to: `${OUTPUT_DIR}/preview/layouts/data/{ScreenName}.json`

```json
{
  "screen": "{ScreenName}",
  "sections": {
    "section-1": { "title": "...", "items": [...] }
  }
}
```

### Step 7: Generate HTML Preview

Create a self-contained HTML file using:
- Grid CSS from the schema (Step 4)
- Token CSS from `tokenCSS` in the package via `@import '../../tokens/*.css'`
- Content data (Step 6)
- Icons from `icons` in the package via Lucide CDN
- **Downloaded images** from `assets` in the package (see Asset Image Rules below)
- **Pre-built shell HTML fragments** from `shellHTML` in the package

#### Shell Composition (CRITICAL — determines page structure)

1. Read `shellConfig.screenShells` to get shell names for this screen
2. Check if any shell has `position` starting with `fixed-left` or `fixed-right`
3. Select layout pattern:
   - Sidebar exists → **Sidebar Layout Pattern**
   - No sidebar → **No-Sidebar Layout Pattern**
4. Get each shell's HTML from `shellHTML["{shell-name}"]`
5. **Strip any `position`, `top`, `left`, `right`, `bottom`, `z-index` from navbar/footer shell HTML inline styles** (the sidebar keeps its `position: fixed`). This ensures fragments don't conflict with the wrapper.
6. Compose using the selected pattern below
7. Set active nav item: find `data-screen="{ScreenName}"` and add active styling

If shells are NOT available, generate sidebar/navbar/footer HTML inline.

#### Common `<head>` and base styles (shared by both patterns)

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width={dimensions.width}">
  <title>{ScreenName} - Layout Preview</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@300;400;600;700&family=Montserrat:wght@400;600;700&display=swap" rel="stylesheet">
  <script src="https://unpkg.com/lucide@latest/dist/umd/lucide.min.js"></script>
  <style>
    @import '../../tokens/colors.css';
    @import '../../tokens/typography.css';
    @import '../../tokens/spacing.css';
    @import '../../tokens/effects.css';

    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: var(--font-family-primary);
      background: var(--color-background);
      color: var(--color-text-primary);
      width: {dimensions.width}px;
      min-height: {dimensions.height}px;
    }
    .main-content { {gridCss}; align-items: stretch; }
    {sectionPositionCss}
    .section {
      background: var(--color-surface);
      border-radius: var(--radius-lg);
      padding: var(--spacing-lg);
    }
    .row-span-2 { height: 100%; }

    /* Grid row stretch: cards in shared rows fill equal height */
    .main-content > section,
    .main-content > div {
      display: flex;
      flex-direction: column;
    }
    .main-content > section > .card,
    .main-content > div > .card {
      flex: 1;
    }
  </style>
</head>
```

#### Pattern 1: Sidebar Layout (Dashboard, Tables, Billing, Profile, etc.)

> **Use when:** `shellConfig.screenShells` includes a shell whose `position` starts with `fixed-left` or `fixed-right`.

```html
<body>
  <!-- Sidebar: position: fixed is in the fragment -->
  {sidebarShellHtml}

  <!-- Page wrapper: flex column for navbar + content + footer -->
  <div class="page-wrapper" style="
    margin-left: {sidebar.bounds.width}px;
    display: flex;
    flex-direction: column;
    min-height: 100vh;
  ">
    <!-- Navbar: in normal document flow (scrolls with content) -->
    {navbarShellHtml}

    <!-- Main content: grows to fill available space -->
    <main class="main-content" style="flex: 1;">
      {sectionsHtml}
    </main>

    <!-- Footer: in normal document flow -->
    {footerShellHtml}
  </div>

  <script>
    document.addEventListener('DOMContentLoaded', () => {
      if (typeof lucide !== 'undefined') lucide.createIcons();
    });
  </script>
</body>
</html>
```

#### Pattern 2: No-Sidebar Layout (SignIn, SignUp, etc.)

> **Use when:** No shell has `position` starting with `fixed-left` or `fixed-right`.

```html
<body>
  <!-- Navbar: sticky for auth/no-sidebar pages -->
  <div style="position: sticky; top: 0; z-index: 50;">
    {navbarShellHtml}
  </div>

  <main class="main-content">
    {sectionsHtml}
  </main>

  {footerShellHtml}

  <script>
    document.addEventListener('DOMContentLoaded', () => {
      if (typeof lucide !== 'undefined') lucide.createIcons();
    });
  </script>
</body>
</html>
```

**Key rules:**
- Schema drives HTML — use the JSON schema to generate correct grid CSS
- Row-spanning elements need `height: 100%`
- Section order in JSON matches visual reading order
- Token CSS imports use relative paths `../../tokens/`
- **Shell HTML is included verbatim** from the package — do not regenerate
- **Active state**: Update the shell's nav item for this screen
- **Grid row stretch**: When sections share a grid row, ensure cards fill equal height. Grid cell containers get `display: flex; flex-direction: column` and their card children get `flex: 1`.

## Verification

Before completing, verify all 4 outputs exist:
- `specs/layouts/{ScreenName}.md`
- `specs/layouts/{ScreenName}.json`
- `preview/layouts/{ScreenName}.html`
- `preview/layouts/data/{ScreenName}.json`

### Alignment Self-Check

For each row in the layout schema, verify that `sum(columnSpan × columnWidth + gaps) = contentArea.effectiveWidth`. If any row differs by more than 8px, re-examine the grid assignments.

## Report

```
Done: {ScreenName}
├── specs/layouts/{ScreenName}.md
├── specs/layouts/{ScreenName}.json
├── preview/layouts/{ScreenName}.html
└── preview/layouts/data/{ScreenName}.json
Sections: {count} | Pattern: {layoutPattern} | {width}x{height}
```
