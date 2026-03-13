# Shell Detection & Extraction Agent (Phase 5a)

## Purpose

Generate shell HTML fragments and layout-shells.json from pre-packaged shell detection data. The heavy lifting (vision detection, Figma section mapping, section subtree extraction) is already done by `prepare-shells.py`.

**One agent, runs sequentially before Phase 5b screen agents.**

## Input

Read the pre-packaged shell data:
```
${OUTPUT_DIR}/.cache/shells-package.json
```

This single file contains:
- `visionDetection` — whether vision succeeded, shell count
- `designContext` — design system fingerprint (colors, naming)
- `tokenCSS` — all token CSS files (colors.css, typography.css, etc.)
- `iconManifest` — icon mappings for Lucide icons
- `shellMappings[]` — each detected shell with:
  - `shellKey`, `position`, `bounds`, `screens`, `confidence`
  - `representativeScreen`, `figmaSectionName`
  - `figmaSubtree` — the full slim Figma subtree for this shell
- `screenShellMap` — which shells apply to each screen
- `screenshotPaths` — paths to screenshots for visual reference

Also read screenshots for visual reference:
- `${OUTPUT_DIR}/preview/layouts/screenshots/{RepresentativeScreen}.png`

**No Figma queries needed.** All data is pre-packaged.

## Outputs

- Shell definitions: `${OUTPUT_DIR}/layout-shells.json`
- Shell HTML fragments: `${OUTPUT_DIR}/preview/layouts/shells/{shell-name}.html`

## Process

### Step 1: Read Package + Screenshots

Read `${OUTPUT_DIR}/.cache/shells-package.json`.

For each shell mapping, read the screenshot of the representative screen to understand the visual layout. This helps generate accurate HTML.

### Step 2: Generate Shell HTML

For each shell in `shellMappings`, generate a self-contained HTML fragment using:
- The `figmaSubtree` for content structure (nav items, logo, user info)
- The `tokenCSS` for CSS custom property references
- The `iconManifest` for Lucide icon names
- The `designContext` for semantic color mapping

**Sidebar example (`shells/sidebar.html`):**
```html
<!-- Shell: sidebar | Source: {representativeScreen} -->
<nav class="shell-sidebar" style="
  position: fixed;
  left: 0;
  top: 0;
  width: {bounds.width}px;
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
  <!-- Shell content extracted from Figma subtree -->
</nav>
```

**Navbar example (`shells/navbar.html`):**
```html
<!-- Shell: navbar | Source: {representativeScreen} -->
<header class="shell-navbar" style="
  height: {bounds.height}px;
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  padding: 0 var(--spacing-6);
  display: flex;
  align-items: center;
  justify-content: space-between;
">
  <!-- Shell content extracted from Figma subtree -->
</header>
```

**Footer example (`shells/footer.html`):**
```html
<!-- Shell: footer | Source: {representativeScreen} -->
<footer class="shell-footer" style="
  height: {bounds.height}px;
  background: var(--color-surface);
  padding: 0 var(--spacing-6);
  display: flex;
  align-items: center;
  justify-content: space-between;
">
  <!-- Shell content extracted from Figma subtree -->
</footer>
```

**Rules:**
- Use CSS custom properties from tokens (never hardcode colors, spacing)
- Use inline styles on the shell root element for positioning
- Include realistic content from the Figma subtree data
- Icons: use Lucide icon names from the icon manifest
- Mark nav items with `data-screen="{ScreenName}"` for active state switching
- Include a `<!-- Shell: {name} | Source: {screen} -->` comment
- **Shell HTML fragments for navbar and footer must NOT include `position`, `top`/`left`/`right`/`bottom`, or `z-index`.** The sidebar fragment keeps `position: fixed` since it's always fixed. Navbar/footer positioning is applied by the screen composition step based on layout context.

#### Design-Context-Aware Styling (IMPORTANT)

Before generating shell HTML, read `designContext` from the package and apply these rules:

1. **Glassmorphic sidebars**: Check `designContext` for glassmorphic/blur hints. If the sidebar uses backdrop blur or transparency:
   - Use `backdrop-filter: blur(10px)` + `background: rgba(255, 255, 255, 0.8)` (NOT solid white)
   - Or if the sidebar uses a dark gradient, use `background: var(--gradient-dark)` with white text

2. **Transparent navbars**: If the navbar sits within the content area (not full-width), use transparent/translucent background, NOT opaque white. Check the Figma subtree background fills.

3. **Auth page navbars**: If a shell key contains "-auth", the navbar likely has a pill/rounded shape:
   - Use large `border-radius` (e.g., `35px`)
   - Add `margin` to float it above the background
   - Check for frosted glass appearance

4. **Sidebar content**: Always include:
   - Brand logo/name at top (from Figma subtree)
   - Navigation items with correct screen names and icons
   - Active state styling (gradient background on icon, bold text)
   - Any utility card at the bottom (e.g., "Need Help?" with gradient background)

5. **Footer variants**: App footer (simple one-line) vs auth footer (multi-row with social icons) should have different styling. Check the Figma subtree structure to determine which.

### Step 3: Write layout-shells.json

```json
{
  "$schema": "layout-shells-v1",
  "shells": {
    "{shellKey}": {
      "sourceScreen": "{representativeScreen}",
      "sectionName": "{figmaSectionName}",
      "position": "{position}",
      "bounds": { ... },
      "htmlFragment": "preview/layouts/shells/{shellKey}.html",
      "screens": [...],
      "cssClass": "shell-{shellKey}",
      "mainContentOffset": {
        "marginLeft": "{bounds.width}px"  // for fixed-left sidebar
      },
      "visionConfidence": {confidence}
    }
  },
  "screenShellMap": { ... }  // copy from package
}
```

`mainContentOffset` rules:
- `fixed-left` sidebar: `{ "marginLeft": "{width}px" }`
- `fixed-right` sidebar: `{ "marginRight": "{width}px" }`
- `fixed-top`/`sticky-top` navbar: `{}` (sticky doesn't need offset)
- `fixed-bottom` footer: `{}` (usually no offset needed)

> **Note:** The screen agent uses the presence of a `fixed-left`/`fixed-right` sidebar to determine the page wrapper structure. See `extract-screen.md` Step 7 for the two canonical layout patterns (Sidebar Layout vs No-Sidebar Layout).

### Step 4: Handle Edge Cases

- **No shells detected** (visionDetection.shellCount === 0): Write empty layout-shells.json with `"shells": {}` and all screens mapped to `[]`. This is valid — Phase 5b will extract everything inline.
- **Vision failed but fallback worked**: Shells will have `confidence: 0.7` from name-matching. Proceed normally.
- **Missing figmaSubtree**: Skip HTML generation for this shell, note in report.

## Verification

- `${OUTPUT_DIR}/layout-shells.json` exists and is valid JSON
- Each shell in `shells` has a corresponding HTML fragment in `preview/layouts/shells/`
- Every screen from the package appears in `screenShellMap`

## Report

```
Done: Shell Detection
├── layout-shells.json
├── Detection method: {vision-first | name-matching fallback | no shells}
├── Shells detected: {count}
│   {for each: name (position) — used by N screens, confidence={score}}
├── Screens with shells: {list}
└── Screens without shells: {list}
```
