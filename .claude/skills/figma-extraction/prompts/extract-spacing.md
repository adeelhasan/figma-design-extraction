# 04 - Extract Spacing Tokens

## Purpose
Detect spacing patterns from Figma auto-layout properties and generate a consistent spacing scale.

## Sources in Figma

Unlike colors and typography, Figma doesn't have "spacing styles." We infer spacing from:

1. **Auto-layout gaps** (`itemSpacing`)
2. **Auto-layout padding** (`paddingTop`, `paddingRight`, `paddingBottom`, `paddingLeft`)
3. **Frame dimensions** (common widths, heights)

## Process

### Step 1: Collect Spacing Values

Traverse all nodes with auto-layout:
```typescript
function collectSpacingValues(node: FigmaNode): number[] {
  const values: number[] = [];
  
  if (node.layoutMode && node.layoutMode !== 'NONE') {
    // Gap between items
    if (node.itemSpacing) values.push(node.itemSpacing);
    
    // Padding
    if (node.paddingTop) values.push(node.paddingTop);
    if (node.paddingRight) values.push(node.paddingRight);
    if (node.paddingBottom) values.push(node.paddingBottom);
    if (node.paddingLeft) values.push(node.paddingLeft);
  }
  
  // Recurse to children
  if (node.children) {
    for (const child of node.children) {
      values.push(...collectSpacingValues(child));
    }
  }
  
  return values;
}
```

### Step 2: Analyze Frequency

Count occurrences of each value:
```typescript
const frequency = new Map<number, number>();
for (const value of allValues) {
  frequency.set(value, (frequency.get(value) || 0) + 1);
}

// Sort by frequency
const sorted = [...frequency.entries()]
  .sort((a, b) => b[1] - a[1]);
```

### Step 3: Detect Scale

Look for common spacing scales:

**4px base (most common):**
```
4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96
```

**8px base:**
```
8, 16, 24, 32, 48, 64, 96
```

**Tailwind-like:**
```
4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96
(named: 1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24)
```

Detection logic:
```typescript
function detectScale(values: number[]): SpacingScale {
  const uniqueValues = [...new Set(values)].sort((a, b) => a - b);
  
  // Check if values follow 4px grid
  const follows4px = uniqueValues.every(v => v % 4 === 0);
  
  // Check if values follow 8px grid
  const follows8px = uniqueValues.every(v => v % 8 === 0);
  
  // Find the base unit
  const base = follows8px ? 8 : follows4px ? 4 : detectGCD(uniqueValues);
  
  return {
    base,
    values: uniqueValues,
    grid: follows4px ? '4px' : follows8px ? '8px' : 'irregular'
  };
}
```

### Step 4: Map to Named Scale

Assign semantic names based on value:
```typescript
const SCALE_NAMES = {
  4: 'xs',    // or '1'
  8: 'sm',    // or '2'
  12: 'md',   // or '3' (if 4px grid)
  16: 'md',   // or '4' (if 8px grid)
  20: 'lg',   // or '5'
  24: 'lg',   // or '6'
  32: 'xl',   // or '8'
  40: '2xl',  // or '10'
  48: '2xl',  // or '12'
  64: '3xl',  // or '16'
  80: '4xl',  // or '20'
  96: '5xl',  // or '24'
};
```

### Step 5: Categorize by Usage

Analyze where spacing values are used:
```typescript
{
  componentGaps: [8, 12, 16],      // Gaps within components
  sectionPadding: [24, 32, 48],    // Padding on sections/pages
  layoutGaps: [16, 24, 32],        // Gaps between major elements
  inlineSpacing: [4, 8],           // Small inline gaps
}
```

### Step 6: Generate CSS

Template: `templates/spacing.template.css`

```css
/* =================================================================
   Spacing Tokens
   Extracted from: {fileName}
   Generated: {date}
   
   Base unit: {base}px
   Grid: {grid}
   ================================================================= */

:root {
  /* ---------------------------------------------------------------
     Spacing Scale
     --------------------------------------------------------------- */
  --spacing-px: 1px;
  --spacing-0: 0;
  {#each scale}
  --spacing-{name}: {value}px;  /* {remValue}rem */
  {/each}
  
  /* ---------------------------------------------------------------
     Semantic Spacing (aliases)
     --------------------------------------------------------------- */
  /* Component internal */
  --spacing-component-xs: var(--spacing-{componentXs});
  --spacing-component-sm: var(--spacing-{componentSm});
  --spacing-component-md: var(--spacing-{componentMd});
  --spacing-component-lg: var(--spacing-{componentLg});
  
  /* Section/Container */
  --spacing-section-sm: var(--spacing-{sectionSm});
  --spacing-section-md: var(--spacing-{sectionMd});
  --spacing-section-lg: var(--spacing-{sectionLg});
  
  /* Page level */
  --spacing-page-gutter: var(--spacing-{pageGutter});
  --spacing-page-margin: var(--spacing-{pageMargin});
}

/*
Spacing Scale Reference
=======================
{#each scale}
--spacing-{name}: {value}px ({usageHint})
{/each}

Detected from {sampleCount} auto-layout instances.
Most common values: {topValues}
*/
```

### Step 7: Update Metadata

```json
{
  "tokens": {
    "spacing": {
      "count": 12,
      "hash": "{contentHash}",
      "base": 4,
      "grid": "4px",
      "scale": [4, 8, 12, 16, 24, 32, 48, 64],
      "detected": true
    }
  }
}
```

### Step 8: Report

```
✓ Spacing extracted

Analyzed {nodeCount} auto-layout nodes

Detected scale (base: {base}px):
├── {value}px ({name}) - used {count} times
├── {value}px ({name}) - used {count} times
└── ...

Scale pattern: {grid} grid
Common usage:
├── Component gaps: {range}
├── Section padding: {range}
└── Layout spacing: {range}

Output: tokens/spacing.css
```

## Edge Cases

### No Auto-Layout
If file doesn't use auto-layout:
```
⚠ Warning: Limited auto-layout usage detected.

Spacing values were inferred from frame dimensions instead.
Consider using auto-layout in Figma for more accurate extraction.

Fallback scale applied:
4, 8, 16, 24, 32, 48, 64
```

### Irregular Values
If values don't follow a grid:
```
⚠ Warning: Irregular spacing values detected.

Found values: 5, 7, 13, 17, 23

These don't follow a standard 4px or 8px grid.
Normalized to nearest 4px values:
5 → 4, 7 → 8, 13 → 12, 17 → 16, 23 → 24

Original values preserved as comments.
```

### Many Unique Values
If too many unique values (over-specified):
```
⚠ Warning: {count} unique spacing values found.

This may indicate inconsistent spacing in the design.
Consolidated to {reducedCount} values based on frequency.

Rarely used values omitted:
- {value}px (used {count} times)
- ...
```

## Validation

Check and report:
- [ ] Scale follows a consistent grid (4px or 8px)
- [ ] Has small/medium/large coverage
- [ ] Values are reasonable (not too small/large)
- [ ] No excessive unique values (< 15 is good)

## Fallbacks

Handle common variations gracefully:

- **No auto-layout in file?** Apply standard defaults (4, 8, 12, 16, 24, 32, 48), note in report
- **Non-standard scale (not 4px/8px)?** Detect actual GCD of values used, note the base
- **Irregular values?** Include as-is with note, don't force into grid
- **Very few spacing values?** Supplement with common values for completeness
- **Too many unique values?** Group similar values, note the consolidation

The goal is to provide a usable spacing scale that reflects actual design usage.

## Next Step
Proceed to: `extract-effects.md`
