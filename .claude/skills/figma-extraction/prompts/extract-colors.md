# 02 - Extract Color Tokens

## Purpose
Extract all color values from Figma and generate CSS custom properties.

## Sources in Figma

1. **Color Styles** (primary source)
   - Published fill styles
   - Access via `file.styles` where `styleType === 'FILL'`

2. **Direct Fills** (secondary, for coverage)
   - Fill properties on nodes
   - Used to detect colors not in styles

## Process

### Step 1: Get Color Styles

From Figma API response:
```typescript
const colorStyles = Object.entries(file.styles)
  .filter(([id, style]) => style.styleType === 'FILL')
  .map(([id, style]) => ({
    id,
    name: style.name,
    description: style.description
  }));
```

For each style, find a node using it to get the actual color value:
```typescript
// Find node with this style applied
const node = findNodeWithStyle(file.document, styleId);
const fill = node.fills[0]; // Primary fill

if (fill.type === 'SOLID') {
  color = {
    r: fill.color.r,  // 0-1
    g: fill.color.g,
    b: fill.color.b,
    a: fill.opacity ?? 1
  };
}
```

### Step 2: Convert to Hex

```typescript
function rgbaToHex(r: number, g: number, b: number, a: number): string {
  const toHex = (n: number) => Math.round(n * 255).toString(16).padStart(2, '0');
  const hex = `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  if (a < 1) {
    return `${hex}${toHex(a)}`;
  }
  return hex;
}
```

### Step 3: Categorize Colors

Analyze style names to categorize:

**Pattern Detection:**
```
"Primary/500"       → category: "primary", shade: "500"
"primary-500"       → category: "primary", shade: "500"
"Colors/Blue/500"   → category: "blue", shade: "500"
"Text/Primary"      → category: "text", variant: "primary"
"Background/Surface"→ category: "background", variant: "surface"
"Error"             → category: "semantic", variant: "error"
```

**Categories:**
- **Primitives**: Raw color scales (blue-50, gray-900)
- **Semantic**: Purpose-based (primary, secondary, error, success)
- **Surface**: Backgrounds (surface, surface-elevated, overlay)
- **Text**: Text colors (text-primary, text-muted)
- **Border**: Border colors (border, border-muted)

**If naming is unclear**, use color analysis:
- Saturated blues/purples → likely primary
- Reds → likely error/destructive
- Greens → likely success
- Grays → likely neutral/surface/text
- Near-white → likely background
- Near-black → likely text

### Step 4: Generate CSS

Template: `templates/colors.template.css`

```css
/* =================================================================
   Color Tokens
   Extracted from: {fileName}
   Generated: {date}
   ================================================================= */

:root {
  /* ---------------------------------------------------------------
     Primitives
     --------------------------------------------------------------- */
  {#each primitives by category}
  /* {category} */
  {#each shades}
  --color-{category}-{shade}: {hex};
  {/each}
  
  {/each}
  
  /* ---------------------------------------------------------------
     Semantic
     --------------------------------------------------------------- */
  --color-primary: var(--color-{primaryRef});
  --color-primary-hover: var(--color-{primaryHoverRef});
  --color-secondary: var(--color-{secondaryRef});
  --color-error: {errorHex};
  --color-warning: {warningHex};
  --color-success: {successHex};
  --color-info: {infoHex};
  
  /* ---------------------------------------------------------------
     Surface
     --------------------------------------------------------------- */
  --color-surface: {surfaceHex};
  --color-surface-elevated: {surfaceElevatedHex};
  --color-surface-overlay: {overlayHex};
  
  /* ---------------------------------------------------------------
     Text
     --------------------------------------------------------------- */
  --color-text-primary: {textPrimaryHex};
  --color-text-secondary: {textSecondaryHex};
  --color-text-muted: {textMutedHex};
  --color-text-inverse: {textInverseHex};
  
  /* ---------------------------------------------------------------
     Border
     --------------------------------------------------------------- */
  --color-border: {borderHex};
  --color-border-muted: {borderMutedHex};
}
```

### Step 5: Update Metadata

Add to `extraction-meta.json`:
```json
{
  "tokens": {
    "colors": {
      "count": 24,
      "hash": "{contentHash}",
      "categories": ["primary", "neutral", "semantic"],
      "styleIds": ["S:abc123", "S:def456"]
    }
  }
}
```

### Step 6: Report

```
✓ Colors extracted

Found {count} color tokens:
├── Primitives: {primitiveCount}
│   ├── {category1}: {count} shades
│   ├── {category2}: {count} shades
│   └── ...
├── Semantic: {semanticCount}
│   ├── primary, secondary
│   └── error, warning, success, info
├── Surface: {surfaceCount}
├── Text: {textCount}
└── Border: {borderCount}

Output: tokens/colors.css
```

## Gradient Extraction

### Step 1: Identify Gradient Fills

Look for fills with type `GRADIENT_LINEAR`, `GRADIENT_RADIAL`, `GRADIENT_ANGULAR`, or `GRADIENT_DIAMOND`:

```typescript
const gradientFills = node.fills.filter(fill =>
  fill.type.startsWith('GRADIENT_')
);
```

### Step 2: Extract Gradient Data

For each gradient fill:
```typescript
{
  type: 'GRADIENT_LINEAR' | 'GRADIENT_RADIAL' | etc,
  gradientHandlePositions: [
    { x: 0, y: 0.5 },   // Start point (normalized 0-1)
    { x: 1, y: 0.5 }    // End point
  ],
  gradientStops: [
    { position: 0, color: { r, g, b, a } },
    { position: 1, color: { r, g, b, a } }
  ]
}
```

### Step 3: Calculate CSS Angle

For linear gradients, calculate angle from handle positions:
```typescript
function calculateGradientAngle(handles: Point[]): number {
  const dx = handles[1].x - handles[0].x;
  const dy = handles[1].y - handles[0].y;
  // Figma uses top-left origin, CSS uses bottom-left
  const angle = Math.atan2(-dy, dx) * (180 / Math.PI) + 90;
  return Math.round(angle);
}
```

### Step 4: Convert to CSS

```typescript
function gradientToCSS(fill: GradientFill): string {
  const angle = calculateGradientAngle(fill.gradientHandlePositions);
  const stops = fill.gradientStops
    .map(stop => {
      const hex = rgbaToHex(stop.color.r, stop.color.g, stop.color.b, stop.color.a);
      const pos = Math.round(stop.position * 100);
      return `${hex} ${pos}%`;
    })
    .join(', ');

  if (fill.type === 'GRADIENT_RADIAL') {
    return `radial-gradient(circle, ${stops})`;
  }
  return `linear-gradient(${angle}deg, ${stops})`;
}
```

### Step 5: Name Gradients

Extract name from:
1. Style name if it's a published style
2. Parent frame name (e.g., "Gradients/Primary" → "primary")
3. Semantic inference from colors (pink/purple → primary, blue → info, etc.)

### Step 6: Output in colors.css

Add gradients section after solid colors:

```css
/* ===========================================
   GRADIENTS
   =========================================== */
--gradient-primary: linear-gradient(310deg, #7928CA 0%, #FF0080 100%);
--gradient-secondary: linear-gradient(310deg, #627594 0%, #A8B8D8 100%);
--gradient-info: linear-gradient(310deg, #2152FF 0%, #21D4FD 100%);
--gradient-success: linear-gradient(310deg, #17AD37 0%, #98EC2D 100%);
--gradient-warning: linear-gradient(310deg, #F53939 0%, #FBCF33 100%);
--gradient-danger: linear-gradient(310deg, #EA0606 0%, #FF667C 100%);
--gradient-dark: linear-gradient(310deg, #141727 0%, #3A416F 100%);
--gradient-light: linear-gradient(310deg, #EBEFF4 0%, #CED4DA 100%);
```

### Report Gradients

Include in extraction report:
```
├── Gradients: {gradientCount}
│   ├── primary (linear, 310deg)
│   ├── secondary (linear, 310deg)
│   ├── info (linear, 310deg)
│   └── ...
```

---

## Edge Cases

### Transparency
Include alpha in output:
```css
--color-overlay: rgba(0, 0, 0, 0.5);
/* or */
--color-overlay: #00000080;
```

### Missing Semantic Colors
If standard semantic colors not found:
```
⚠ Warning: Could not identify the following semantic colors:
  - error (no red-ish color found)
  - success (no green-ish color found)

These have been omitted. Add manually or update Figma styles.
```

## Validation

Check and report:
- [ ] Has at least one primary color
- [ ] Has surface/background colors
- [ ] Has text colors
- [ ] No duplicate names
- [ ] Contrast ratios for text/surface pairs

## Fallbacks

Handle common variations gracefully:

- **No published color styles?** Scan all nodes for unique fill colors, then categorize by hue/usage
- **Non-standard naming?** Use color analysis to categorize (blues→primary, reds→error, grays→neutral)
- **Missing semantic colors?** Warn but continue - document what's missing for manual addition
- **Gradients without names?** Infer name from containing frame or color semantics
- **Duplicate colors?** Deduplicate by hex value, keep most descriptive name

The goal is to extract everything found, categorize intelligently, and report gaps clearly.

## Next Step
Proceed to: `extract-typography.md`
