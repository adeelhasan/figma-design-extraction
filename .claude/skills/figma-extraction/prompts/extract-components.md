# Extract Component Specifications

## Purpose
Document component structures, variants, token usage, and component types from a pre-packaged component data file.

## Input

Read the pre-packaged component data:
```
${OUTPUT_DIR}/.cache/components-package.json
```

This single file contains:
- `designContext` — the design system fingerprint (color palette, naming conventions)
- `tokenSummary` — unique colors, text styles, effects, radii counts
- `components[]` — all COMPONENT and COMPONENT_SET nodes with:
  - `name`, `type`, `dimensions`, `subtree` (slim Figma node tree)
  - For sets: `variants[]`, `variantProperties`, `totalVariants`
  - For standalone: `fills`, `effects`, `cornerRadius`, `layoutMode`, `childNames`

**No Figma queries needed.** All data is pre-packaged.

## Output

Write to: `${OUTPUT_DIR}/specs/components.md`

## Process

### Step 1: Read Package

Read `${OUTPUT_DIR}/.cache/components-package.json`. This gives you everything.

### Step 2: Classify Each Component

For each component, determine its type using name matching:

| Pattern | Category | Type |
|---------|----------|------|
| /button\|btn/i | form | Button |
| /input\|text-field/i | form | Input |
| /select\|dropdown/i | form | Select |
| /checkbox/i | form | Checkbox |
| /switch\|toggle/i | form | Switch |
| /card/i | card | Card |
| /stat-card/i | card | StatCard |
| /table/i | data | Table |
| /avatar/i | data | Avatar |
| /badge\|tag\|chip/i | data | Badge |
| /tab\|tabs/i | navigation | Tabs |
| /sidebar/i | layout | Sidebar |
| /navbar/i | layout | Navbar |
| /modal\|dialog/i | overlay | Modal |
| /tooltip/i | overlay | Tooltip |

If name doesn't match, infer from structure (dimensions, children, fills).

### Step 3: Generate Markdown

For each component, document:

```markdown
## {ComponentName}

### Component Type
| Property | Value |
|----------|-------|
| Category | {category} |
| Type | {type} |

### Variants (if component set)
| Property | Values | Default |
|----------|--------|---------|
| {prop} | {values} | {first value} |

### Dimensions
| Size | Width | Height | Padding |
|------|-------|--------|---------|
| {size} | {w} | {h} | {padding} |

### Token Usage
- Colors: {extracted from fills in subtree}
- Typography: {extracted from TEXT nodes in subtree}
- Effects: {extracted from effects in subtree}
- Border radius: {cornerRadius values}

### Slots
| Slot | Type | Required |
|------|------|----------|
| {name} | {icon/text/image} | {yes/no} |
```

### Step 4: Write File

Write the complete markdown to `${OUTPUT_DIR}/specs/components.md`.

Use the `designContext` for semantic naming (e.g., map hex colors to token names like `--color-primary`).

## Verification

Verify `specs/components.md` exists and contains documentation for all components from the package.

## Report

```
Done: Components
├── specs/components.md
├── Components documented: {count}
└── Types: {list of unique types}
```
