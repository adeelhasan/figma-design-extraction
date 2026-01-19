# 05 - Extract Effect Tokens

## Purpose
Extract shadow styles, blur effects, and border radius values from Figma.

## Sources in Figma

1. **Effect Styles** (shadows, blurs)
   - Access via `file.styles` where `styleType === 'EFFECT'`

2. **Corner Radius** (from nodes)
   - `cornerRadius` (uniform)
   - `rectangleCornerRadii` (individual corners)

## Process

### Step 1: Extract Effect Styles

```typescript
const effectStyles = Object.entries(file.styles)
  .filter(([id, style]) => style.styleType === 'EFFECT')
  .map(([id, style]) => ({
    id,
    name: style.name,
    description: style.description
  }));
```

For each style, get effect properties:
```typescript
const node = findNodeWithStyle(file.document, styleId);
const effects = node.effects;

for (const effect of effects) {
  if (effect.type === 'DROP_SHADOW' || effect.type === 'INNER_SHADOW') {
    shadows.push({
      name: styleName,
      type: effect.type,
      color: rgbaToString(effect.color),
      offset: { x: effect.offset.x, y: effect.offset.y },
      blur: effect.radius,
      spread: effect.spread || 0,
      inset: effect.type === 'INNER_SHADOW'
    });
  }
  
  if (effect.type === 'LAYER_BLUR') {
    blurs.push({
      name: styleName,
      radius: effect.radius
    });
  }
}
```

### Step 2: Extract Border Radius

Traverse nodes and collect corner radius values:
```typescript
function collectRadii(node: FigmaNode): number[] {
  const radii: number[] = [];
  
  if (node.cornerRadius !== undefined && node.cornerRadius > 0) {
    radii.push(node.cornerRadius);
  }
  
  if (node.rectangleCornerRadii) {
    radii.push(...node.rectangleCornerRadii.filter(r => r > 0));
  }
  
  // Recurse
  if (node.children) {
    for (const child of node.children) {
      radii.push(...collectRadii(child));
    }
  }
  
  return radii;
}
```

### Step 3: Convert Shadows to CSS

```typescript
function shadowToCSS(shadow: Shadow): string {
  const { offset, blur, spread, color, inset } = shadow;
  const parts = [
    inset ? 'inset' : '',
    `${offset.x}px`,
    `${offset.y}px`,
    `${blur}px`,
    `${spread}px`,
    color
  ].filter(Boolean);
  
  return parts.join(' ');
}
```

For layered shadows (multiple effects):
```css
--shadow-complex: 
  0 1px 2px rgba(0,0,0,0.05),
  0 4px 8px rgba(0,0,0,0.1);
```

### Step 4: Categorize Effects

**Shadows:**
```
"Shadow/Small"   → sm
"Elevation/1"    → sm
"shadow-md"      → md
"Card Shadow"    → md (infer from name)
"Modal Overlay"  → lg/xl
```

Size heuristics:
- blur < 4px → xs/sm
- blur 4-8px → sm/md
- blur 8-16px → md/lg
- blur > 16px → lg/xl

**Radii:**
- 2-4px → sm
- 6-8px → md
- 12-16px → lg
- 20px+ → xl/full

### Step 5: Deduplicate Radius Values

```typescript
// Get unique values sorted
const uniqueRadii = [...new Set(allRadii)].sort((a, b) => a - b);

// Map to scale names
const radiusScale = assignScaleNames(uniqueRadii);
// { 4: 'sm', 8: 'md', 16: 'lg', 9999: 'full' }
```

### Step 6: Generate CSS

Template: `templates/effects.template.css`

```css
/* =================================================================
   Effect Tokens
   Extracted from: {fileName}
   Generated: {date}
   ================================================================= */

:root {
  /* ---------------------------------------------------------------
     Shadows
     --------------------------------------------------------------- */
  --shadow-none: none;
  {#each shadows}
  --shadow-{name}: {cssValue};
  {/each}
  
  /* ---------------------------------------------------------------
     Border Radius
     --------------------------------------------------------------- */
  --radius-none: 0;
  {#each radii}
  --radius-{name}: {value}px;
  {/each}
  --radius-full: 9999px;
  
  /* ---------------------------------------------------------------
     Blur (if present)
     --------------------------------------------------------------- */
  {#if blurs.length}
  {#each blurs}
  --blur-{name}: blur({value}px);
  {/each}
  {/if}
}

/*
Shadow Reference
================
{#each shadows}
--shadow-{name}:
  Blur: {blur}px
  Offset: {offsetX}, {offsetY}
  Spread: {spread}px
  Color: {color}
  
{/each}

Radius Reference
================
{#each radii}
--radius-{name}: {value}px ({usage})
{/each}
*/
```

### Step 7: Detect Ring/Focus Styles

Look for focus/ring shadows:
```typescript
// Often named "Focus ring", "Focus", "Outline"
const focusEffects = shadows.filter(s => 
  s.name.toLowerCase().includes('focus') ||
  s.name.toLowerCase().includes('ring') ||
  s.name.toLowerCase().includes('outline')
);

if (focusEffects.length) {
  // Add as --ring-* tokens
  output += `
  /* Focus Ring */
  --ring-width: 2px;
  --ring-color: var(--color-primary);
  --ring-offset: 2px;
  `;
}
```

### Step 8: Update Metadata

```json
{
  "tokens": {
    "effects": {
      "count": 8,
      "hash": "{contentHash}",
      "shadows": {
        "count": 4,
        "names": ["sm", "md", "lg", "xl"]
      },
      "radii": {
        "count": 4,
        "values": [4, 8, 16, 9999],
        "names": ["sm", "md", "lg", "full"]
      },
      "styleIds": ["S:eff001", "S:eff002"]
    }
  }
}
```

### Step 9: Report

```
✓ Effects extracted

Shadows ({count}):
├── --shadow-sm: 0 1px 2px rgba(0,0,0,0.05)
├── --shadow-md: 0 4px 6px rgba(0,0,0,0.1)
├── --shadow-lg: 0 10px 15px rgba(0,0,0,0.1)
└── --shadow-xl: 0 20px 25px rgba(0,0,0,0.15)

Border Radius ({count}):
├── --radius-sm: 4px
├── --radius-md: 8px
├── --radius-lg: 16px
└── --radius-full: 9999px

{#if blurs}
Blurs ({count}):
├── --blur-sm: blur(4px)
└── --blur-md: blur(8px)
{/if}

Output: tokens/effects.css
```

## Edge Cases

### No Effect Styles
If file has no published effect styles:
```
⚠ Warning: No effect styles found.

Shadows will be inferred from node effects.
Consider publishing effect styles in Figma for consistency.
```

### Complex Multi-Layer Shadows
```css
/* Original has 3 layers */
--shadow-card: 
  0 1px 3px rgba(0,0,0,0.04),
  0 4px 6px rgba(0,0,0,0.06),
  0 8px 16px rgba(0,0,0,0.08);
```

### Very Large Radius (Pills/Circles)
```
Detected large radius values: 100px, 200px

These appear to be "pill" or "circle" shapes.
Normalized to --radius-full: 9999px
```

## Validation

Check and report:
- [ ] Has shadow scale (sm, md, lg minimum)
- [ ] Has radius scale
- [ ] Shadow colors use appropriate opacity
- [ ] No extremely large blur values (performance)
- [ ] Radius values follow consistent scale

## Fallbacks

Handle common variations gracefully:

- **No published effect styles?** Scan nodes for shadow/blur effects directly
- **No corner radii?** Common if design uses sharp corners - note but don't fail
- **Mixed blur types?** Include all (layer blur, background blur), categorize separately
- **Very large radius values?** Include as `--radius-full` for pill shapes
- **Shadows on dark backgrounds?** May have light colors - include as designed

The goal is to extract all visual effects regardless of whether they're published styles.

## Next Step
Proceed to: `extract-components.md`
