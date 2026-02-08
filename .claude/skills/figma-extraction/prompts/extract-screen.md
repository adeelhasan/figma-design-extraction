# Unified Screen Extraction Agent

## Purpose

Extract layout spec AND generate HTML preview for a SINGLE screen in ONE session. This eliminates information loss between separate layout extraction and preview generation phases.

**One agent per screen. N screens = N parallel agents.**

## Inputs (read these yourself)

- Figma screenshot: `${OUTPUT_DIR}/preview/layouts/screenshots/{ScreenName}.png`
- Essentials file: `${OUTPUT_DIR}/figma-essentials.json`
- Design context: `${OUTPUT_DIR}/design-system-context.json`
- Token CSS files: `${OUTPUT_DIR}/tokens/*.css`
- Icon manifest: `${OUTPUT_DIR}/assets/icon-manifest.json`
- Asset manifest: `${OUTPUT_DIR}/assets/asset-manifest.json`
- **Shell definitions (if exists)**: `${OUTPUT_DIR}/layout-shells.json`
- **Shell HTML fragments (if exists)**: `${OUTPUT_DIR}/preview/layouts/shells/*.html`

### Figma Query Tool

**DO NOT read the full cache file.** Use the query tool to fetch screen data incrementally:

```bash
QUERY="python3 .claude/skills/figma-extraction/scripts/figma-query.py --cache ${OUTPUT_DIR}/.cache/figma-file.json"

# Step 1: Get top-level layout (~2-15KB)
$QUERY screen-layout "{ScreenName}"

# Step 2: Get individual sections as needed (~5-80KB each)
$QUERY section "{ScreenName}" "sidebar"
$QUERY section "{ScreenName}" "navbar"
$QUERY section "{ScreenName}" "content"

# Step 3: For large sections, drill into children
$QUERY section "{ScreenName}" "content/Widget-1"
```

Query incrementally — start with `screen-layout`, then fetch sections one at a time. Only fetch sub-sections if the parent section is too large.

### Pre-Built Shells (Phase 5a output)

**Before querying Figma**, check if `${OUTPUT_DIR}/layout-shells.json` exists. If it does:

1. Read it and look up `screenShellMap["{ScreenName}"]` to get this screen's shell list.
2. For each shell name in the list, read the corresponding HTML fragment from `${OUTPUT_DIR}/preview/layouts/shells/{shell-name}.html`.
3. **Skip querying Figma for shell sections.** Do NOT run `$QUERY section "{ScreenName}" "sidebar"` or similar for sections covered by shells. Only query the **content sections** that are NOT shells.
4. Record shell metadata in the layout schema (see Step 3).

If `layout-shells.json` does not exist, proceed with the full extraction as before (query all sections including sidebar/navbar/footer).

## Outputs (write all four)

- Layout spec: `${OUTPUT_DIR}/specs/layouts/{ScreenName}.md`
- Layout schema: `${OUTPUT_DIR}/specs/layouts/{ScreenName}.json`
- HTML preview: `${OUTPUT_DIR}/preview/layouts/{ScreenName}.html`
- Content data: `${OUTPUT_DIR}/preview/layouts/data/{ScreenName}.json`

## Process

### Step 0: Visual Analysis (REQUIRED)

**Before parsing any JSON, READ the Figma screenshot** to understand the visual layout.

Load: `${OUTPUT_DIR}/preview/layouts/screenshots/{ScreenName}.png`

Identify:
- Number of distinct horizontal rows
- Number of columns per row
- Which sections span multiple columns or rows
- Relative sizes (1/3, 1/2, 2/3, full-width)

**Create a mental model of the grid before examining JSON.**

### Step 1: Query Screen Layout

Use the query tool to get the top-level structure:

```bash
$QUERY screen-layout "{ScreenName}"
```

This returns section names, types, bounds, and first-level children (~2-15KB) — NOT the full subtree.

### Step 2: Extract Layout Structure

Using visual analysis from Step 0 and the screen-layout query, extract sections.

**If pre-built shells are available:** Skip querying sections that are covered by shells (e.g., don't query "sidebar" or "navbar" if they're in `screenShellMap`). Only query the content sections.

For each non-shell section that needs detail, query it individually:

```bash
$QUERY section "{ScreenName}" "content"    # May be large — check children first
```

For large sections, drill into specific children:

```bash
$QUERY section "{ScreenName}" "content/Widget-1"   # ~15-30KB per widget
```

#### Container Detection (REQUIRED before grid mapping)

Before mapping sections to grid positions, identify the **content container** — the shared parent of all non-sidebar, non-footer sections. Query its layout properties:

```bash
$QUERY section "{ScreenName}" "content"
```

Extract the container's padding:
- **Auto-layout frames**: Use `paddingLeft`, `paddingRight`, `paddingTop`, `paddingBottom` from the node summary.
- **Non-auto-layout frames**: Infer padding as the gap between the container's bounding box and the bounds of the first/last child.

Record this as a `contentArea` object in the layout schema (see Step 3). All subsequent grid-column calculations MUST use `contentArea.effectiveWidth` (= container width − left padding − right padding) as the denominator for column spans. This ensures every row's content spans the same width and edges align vertically.

Extract from the JSON:

1. **Identify major sections** — Top-level children of the screen frame
2. **Detect layout type** — sidebar-content, dashboard-grid, split-screen, etc.
3. **Extract grid configuration** — columns, gaps, margins from layoutGrids
4. **Identify content container** — Shared parent of main content sections, with padding
5. **Map sections to grid positions** — Using bounding boxes relative to `contentArea`, NOT absolute page coordinates

For each section, extract:
- `id`, `name`, `type`, `pattern`
- `bounds` — { x, y, width, height }
- `gridPosition` — { column, columnSpan, row, rowSpan }
- `layout` — Auto-layout properties (mode, gap, padding)
- `components` — Component instances used

### Step 3: Generate Layout Schema (JSON)

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

**`shells` field:** List the shell names from `layout-shells.json` that apply to this screen. If no shells exist, omit this field or set to `[]`.

### Step 4: Generate Layout Spec (Markdown)

Write to: `${OUTPUT_DIR}/specs/layouts/{ScreenName}.md`

Include: frame metadata, grid system, ASCII structure diagram, sections table with grid positions, CSS grid template, components used, token usage.

### Step 5: Extract Content Data

Extract text content from the screen for realistic previews.

Write to: `${OUTPUT_DIR}/preview/layouts/data/{ScreenName}.json`

```json
{
  "screen": "{ScreenName}",
  "sections": {
    "section-1": { "title": "...", "items": [...] }
  }
}
```

### Step 6: Generate HTML Preview

Create a self-contained HTML file using:
- Grid CSS from the schema (Step 3)
- Token CSS files via `@import '../../tokens/*.css'`
- Content data (Step 5)
- Icons from icon-manifest.json via Lucide CDN
- Asset placeholders from asset-manifest.json
- **Pre-built shell HTML fragments** (if available from Phase 5a)

#### Shell Composition

If `layout-shells.json` exists and this screen has shells:

1. Read each shell HTML fragment from `${OUTPUT_DIR}/preview/layouts/shells/{shell-name}.html`
2. Insert shell HTML into `<body>` **before** `<main class="main-content">`
3. Apply `mainContentOffset` CSS from `layout-shells.json` to `.main-content` (e.g., `margin-left: 273px` for a fixed sidebar)
4. Set the active nav item: in the sidebar shell HTML, find the nav item with `data-screen="{ScreenName}"` and add an active class/style

If shells are NOT available, generate sidebar/navbar/footer HTML inline as before.

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width={dimensions.width}">
  <title>{ScreenName} - Layout Preview</title>
  <script src="https://unpkg.com/lucide@latest/dist/umd/lucide.min.js"></script>
  <style>
    @import '../../tokens/colors.css';
    @import '../../tokens/typography.css';
    @import '../../tokens/spacing.css';
    @import '../../tokens/effects.css';

    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: var(--font-family-sans, system-ui);
      background: var(--color-background);
      color: var(--color-text-primary);
      width: {dimensions.width}px;
      min-height: {dimensions.height}px;
    }
    /* mainContentOffset from layout-shells.json applied here */
    .main-content { {gridCss}; {mainContentOffsetCss} }
    {sectionPositionCss}
    .section {
      background: var(--color-surface);
      border-radius: var(--radius-lg);
      padding: var(--spacing-lg);
    }
    .row-span-2 { height: 100%; }
  </style>
</head>
<body>
  {shellsHtml}
  <main class="main-content">{sectionsHtml}</main>
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
- **Shell HTML is included verbatim** — do not regenerate sidebar/navbar if shells exist
- **Active state**: Update the shell's nav item for this screen to show as active

## Verification

Before completing, verify all 4 outputs exist:
- `specs/layouts/{ScreenName}.md`
- `specs/layouts/{ScreenName}.json`
- `preview/layouts/{ScreenName}.html`
- `preview/layouts/data/{ScreenName}.json`

### Alignment Self-Check

For each row in the layout schema, verify that `sum(columnSpan × columnWidth + gaps) = contentArea.effectiveWidth`. If any row differs by more than 8px, re-examine the grid assignments — the sections likely have inconsistent column calculations relative to the content container.

## Report

```
Done: {ScreenName}
├── specs/layouts/{ScreenName}.md
├── specs/layouts/{ScreenName}.json
├── preview/layouts/{ScreenName}.html
└── preview/layouts/data/{ScreenName}.json
Sections: {count} | Pattern: {layoutPattern} | {width}x{height}
```
