# Shell Detection & Extraction Agent (Phase 5a)

## Purpose

Detect layout shells (sidebar, navbar, footer) shared across multiple screens and extract them once. This prevents N screen agents from redundantly extracting the same shell elements, ensuring visual consistency and reducing token usage.

**One agent, runs sequentially before Phase 5b screen agents.**

## Inputs (read these yourself)

- Essentials file: `${OUTPUT_DIR}/figma-essentials.json`
- Design context: `${OUTPUT_DIR}/design-system-context.json`
- Token CSS files: `${OUTPUT_DIR}/tokens/*.css`
- Screenshots: `${OUTPUT_DIR}/preview/layouts/screenshots/*.png`

### Figma Query Tool

```bash
QUERY="python3 .claude/skills/figma-extraction/scripts/figma-query.py --cache ${OUTPUT_DIR}/.cache/figma-file.json"
```

## Outputs

- Shell definitions: `${OUTPUT_DIR}/layout-shells.json`
- Shell HTML fragments: `${OUTPUT_DIR}/preview/layouts/shells/{shell-name}.html`

## Process

### Step 1: Collect Screen Layouts

Read `figma-essentials.json` to get the list of all screens. For each screen, query the top-level layout:

```bash
$QUERY screen-layout "{ScreenName}"
```

Collect the top-level section names, types, bounds, and layout properties for every screen.

### Step 2: Identify Shared Sections

Compare top-level sections across all screens using **name matching**:

1. For each screen, list top-level section names (lowercased, trimmed).
2. Group sections that appear in 2+ screens by matching names. Common shell names include:
   - Sidebar variants: `sidebar`, `side-bar`, `left-nav`, `navigation`, `nav`, `menu`
   - Header variants: `navbar`, `nav-bar`, `header`, `top-bar`, `topbar`, `app-bar`
   - Footer variants: `footer`, `bottom-bar`, `status-bar`
3. For each group, verify consistency:
   - **Position**: All instances are in approximately the same position (within 20px tolerance)
   - **Dimensions**: All instances are approximately the same size (within 20px tolerance)
   - If a "matching" section varies significantly in size/position, it may not be the same shell — exclude it from the group.

A section is a **shared shell** if it appears in ≥50% of screens with consistent position and dimensions.

### Step 3: Pick Representative Screens

For each shared shell group:

1. Pick the **first screen alphabetically** as the representative.
2. Query the full section data from that screen:

```bash
$QUERY section "{RepresentativeScreen}" "{sectionName}"
```

3. Also read the screenshot of the representative screen for visual reference.

### Step 4: Extract Shell HTML/CSS

For each shared shell, generate a self-contained HTML fragment:

**Sidebar example (`shells/sidebar.html`):**
```html
<!-- Shell: sidebar | Source: Dashboard -->
<nav class="shell-sidebar" style="
  position: fixed;
  left: 0;
  top: 0;
  width: {width}px;
  height: 100vh;
  background: var(--color-surface);
  border-right: 1px solid var(--color-border);
  padding: var(--spacing-6) var(--spacing-4);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
  overflow-y: auto;
  z-index: 100;
">
  <!-- Shell content here -->
</nav>
```

**Rules for shell HTML:**
- Use CSS custom properties from tokens (never hardcode colors, spacing, etc.)
- Use inline styles on the shell root element for positioning
- Include realistic content (nav items, logo, user info) from the Figma data
- Icons: use Lucide icon names from the icon manifest
- Mark the active nav item with a data attribute: `data-active="true"`
- Include a `<!-- Shell: {name} | Source: {screen} -->` comment at the top

**Navbar example (`shells/navbar.html`):**
```html
<!-- Shell: navbar | Source: Dashboard -->
<header class="shell-navbar" style="
  position: sticky;
  top: 0;
  height: {height}px;
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  padding: 0 var(--spacing-6);
  display: flex;
  align-items: center;
  justify-content: space-between;
  z-index: 50;
">
  <!-- Shell content here -->
</header>
```

### Step 5: Write layout-shells.json

Write the shell definitions to `${OUTPUT_DIR}/layout-shells.json`:

```json
{
  "$schema": "layout-shells-v1",
  "shells": {
    "sidebar": {
      "sourceScreen": "Dashboard",
      "sectionName": "sidebar",
      "position": "fixed-left",
      "bounds": { "x": 0, "y": 0, "width": 273, "height": 900 },
      "htmlFragment": "preview/layouts/shells/sidebar.html",
      "screens": ["Dashboard", "Profile", "Billing", "Tables", "SignIn"],
      "cssClass": "shell-sidebar",
      "mainContentOffset": {
        "marginLeft": "273px"
      }
    },
    "navbar": {
      "sourceScreen": "Dashboard",
      "sectionName": "navbar",
      "position": "sticky-top",
      "bounds": { "x": 273, "y": 0, "width": 1167, "height": 60 },
      "htmlFragment": "preview/layouts/shells/navbar.html",
      "screens": ["Dashboard", "Profile", "Billing", "Tables"],
      "cssClass": "shell-navbar",
      "mainContentOffset": {}
    }
  },
  "screenShellMap": {
    "Dashboard": ["sidebar", "navbar"],
    "Profile": ["sidebar", "navbar"],
    "Billing": ["sidebar", "navbar"],
    "Tables": ["sidebar", "navbar"],
    "SignIn": [],
    "SignUp": []
  }
}
```

**Key fields:**
- `shells`: Each detected shell with its source, position, bounds, and which screens use it
- `mainContentOffset`: CSS properties the `.main-content` container needs to accommodate this shell (e.g., `marginLeft` for a fixed sidebar)
- `screenShellMap`: Quick lookup — which shells apply to each screen. Screens with no shells get an empty array.

### Step 6: Handle Edge Cases

- **Screens with no shared shells** (e.g., login/signup): `screenShellMap` entry is `[]`. These screens get full-page extraction in Phase 5b.
- **Partial shell sharing** (e.g., only some screens have a footer): Include the shell but only list the screens that have it in `screens` array.
- **Active state**: The sidebar nav item for the current screen should be marked. In the shell HTML, use `data-screen="{ScreenName}"` on each nav item so Phase 5b agents can set the active state.

## Verification

Before completing, verify:
- `${OUTPUT_DIR}/layout-shells.json` exists and is valid JSON
- Each shell referenced in `shells` has a corresponding HTML fragment in `preview/layouts/shells/`
- Every screen from `figma-essentials.json` appears in `screenShellMap`

## Report

```
Done: Shell Detection
├── layout-shells.json
├── Shells detected: {count}
│   {for each shell: name (position) — used by N/M screens}
├── Screens with shells: {list}
└── Screens without shells: {list}
```
