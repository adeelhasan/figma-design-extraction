# Build Screen from Layout Spec

Build a complete screen/page by translating the extracted HTML preview into a React component.

## Usage

```
/build-screen <screen-name> [--path <output-path>]
/build-screen --all
```

## Arguments

- `screen-name` (required unless `--all`): Name of layout (Dashboard, Billing, Profile, Tables, SignIn, SignUp)
- `--all`: Build all screens found in `design-system/specs/layouts/`
- `--path` (optional): Output path (default: `src/app/[screen]/page.tsx`)

## Prerequisites

- Design system must be installed (`/install-design-system`)
- Components should be generated (`/gen-component --all`)

## Process

### Step 1: Gather all references

For screen `{Name}`, read these files **in this order**:

1. **`design-system/preview/layouts/{Name}.html`** — PRIMARY REFERENCE. This is the framework-neutral HTML+CSS that faithfully represents the Figma extraction. The agent's job is to **translate** this HTML/CSS into React+Tailwind, preserving structure and styles exactly.

2. **`design-system/preview/layouts/data/{Name}.json`** — Exact data values for all sections (labels, amounts, dates, names). Use these values verbatim. Do not invent data.

3. **`design-system/specs/layouts/{Name}.md`** — Component descriptions, token mappings, and the CSS Grid Template. The `## CSS Grid Template` section contains exact CSS that must be preserved in the React output.

4. **`design-system/preview/layouts/screenshots/{Name}.png`** — Visual reference. View this to understand the intended visual result.

5. **`design-system/layout-shells.json`** — Determines which shell layout to use (DashboardLayout vs AuthLayout).

6. **Existing UI components in `src/components/ui/`** — Use these where they match (Button, Input, Checkbox).

### Step 2: Determine layout wrapper

From `layout-shells.json`, check `screenShellMap`:
- If screen uses `sidebar + navbar + footer` → wrap in `DashboardLayout`
- If screen uses `navbar-auth + footer-auth` → use auth layout pattern (AuthNavbar + AuthFooter)

### Step 3: Translate HTML to React

Convert the HTML preview to React/JSX:

**CSS Grid Template — copy verbatim.** The `## CSS Grid Template` section in the markdown spec contains exact grid-template-columns, grid-template-rows, grid-column, and grid-row values. Use these as inline styles or Tailwind classes. Do not approximate or simplify the grid. Example:

```css
/* From the spec — use these values exactly */
.main-content {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  grid-template-rows: 245px 205px auto;
  gap: 24px;
}
.section-credit-card   { grid-column: 1 / 8;  grid-row: 1 / 2; display: flex; gap: var(--spacing-4); }
.section-invoices      { grid-column: 8 / 13; grid-row: 1 / 3; }
```

**Flex directions and internal layout — match the HTML.** If the HTML preview uses `display: flex` with no `flex-direction` (defaults to row), keep it as row. If it uses `flex-direction: column`, use column. Do not guess.

**Token usage — preserve exactly.** The HTML preview uses `var(--color-*)`, `var(--gradient-*)`, `var(--spacing-*)` etc. Carry these through. Do not replace tokens with hardcoded values or Tailwind approximations.

**Data — use the JSON file.** Read `data/{Name}.json` for all labels, values, dates, amounts. Use these exactly.

**Images — use `/images/` paths.** Photo assets are in `public/images/`. Reference them as `/images/{filename}.png`.

### Step 4: Visual verification (human-in-loop)

After writing the page file:

1. Tell the user the screen has been built
2. Ask: "Would you like me to screenshot this page and compare it against the Figma extraction?"
3. If yes:
   - Use Playwright to screenshot: `npx playwright screenshot --browser chromium --viewport-size 1440,2000 --full-page http://localhost:3001/{route} /tmp/screen-{name}.png`
   - Show both images (the screenshot and `design-system/preview/layouts/screenshots/{Name}.png`) to the user
   - Ask: "Here's the current build vs. the Figma extraction. Want me to adjust anything?"
4. The user decides whether to iterate or move on. Do not loop automatically.

## Key Rules

1. **The HTML preview is the source of truth for layout structure.** Read it first, translate it faithfully.
2. **The CSS Grid Template from the spec must be used verbatim.** Grid column/row placements, template-rows definitions, and explicit row heights are critical for multi-row spanning and section sizing.
3. **The data JSON is the source of truth for content.** Do not invent labels, amounts, or dates.
4. **The screenshot is the source of truth for visual intent.** If the HTML and spec disagree with what the screenshot shows, match the screenshot.
5. **Use existing UI components** from `src/components/ui/` where they match (Button, Input, Checkbox). Build other widgets inline.
6. **All styling must use design tokens** — never hardcode colors, spacing, or effects.

## Example

```
/build-screen Billing

Loading references...
✓ Read preview/layouts/Billing.html (primary layout reference)
✓ Read preview/layouts/data/Billing.json (data values)
✓ Read specs/layouts/Billing.md (spec + CSS grid template)
✓ Viewed preview/layouts/screenshots/Billing.png (visual reference)
✓ Shell map: sidebar + navbar + footer → DashboardLayout

Translating to React...
✓ Created src/app/billing/page.tsx
  - 12-column grid with explicit row heights (245px, 205px, auto)
  - Credit card group: horizontal flex (dark card + salary + paypal)
  - Invoices: spans rows 1-2 (grid-row: 1 / 3)
  - Payment method: cols 1-7, row 2
  - Billing info: cols 1-8, row 3
  - Transactions: cols 9-12, row 3

Would you like me to screenshot and compare against the extraction? [y/n]
```

## Notes

- The HTML previews are the closest representation of the Figma design — they were generated directly from the extraction pipeline
- Chart placeholders are expected — actual chart libraries (recharts, chart.js) can be added later
- The verification step is optional and human-driven — no automated convergence loop
