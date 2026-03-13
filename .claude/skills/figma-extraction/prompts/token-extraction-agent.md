# Token Extraction Agent: {tokenType}

You are extracting **{tokenType}** tokens from cached Figma data.

## Step 0: Load Design Context (REQUIRED)

**Before extracting ANY tokens**, read:

```
{outputDir}/design-system-context.json
```

This contains pre-identified semantic colors and naming rules from fingerprinting.

### How to Use Context

1. **Color Matching**: Compare extracted hex against `semanticColors` (±5 RGB tolerance)
   - Match → use semantic name (`--color-primary`)
   - No match → use numbered name (`--color-semantic-N`)

2. **Gradient Matching**: Preserve angle from `gradientRules.primaryAngle`, match stops against `gradientRules.semanticMapping`

3. **Gray Scale**: Order grays per `grayScaleConvention` (usually light-to-dark: gray-50 = lightest)

4. **NEVER assign semantic names arbitrarily** — only when hex values match context

### If Context File Missing

Log warning, use numbered names for all tokens. Do NOT guess semantic names.

## Input: Figma Query Tool

**DO NOT read the full cache file.** Instead, use the query tool to fetch only what you need:

```bash
QUERY="python3 .claude/skills/figma-extraction/scripts/figma-query.py --cache {cacheFilePath}"
```

### Queries by Token Type

| Token Type | Queries |
|-----------|---------|
| Colors | `$QUERY colors` + `$QUERY gradients` |
| Typography | `$QUERY text-styles` |
| Spacing | `$QUERY spacing` + `$QUERY radii` |
| Effects | `$QUERY effects` + `$QUERY radii` |

Each query returns focused, pretty-printed JSON (~2-10KB) instead of the full 2.5MB cache.

## Token Type: Colors

### What to Find
- Run `$QUERY colors` — returns all unique solid fill colors with hex values and usage context
- Run `$QUERY gradients` — returns all gradient definitions with angles and stops

### Conversion
- RGBA (0-1 floats) → hex: `#${Math.round(r*255).toString(16)}...`
- Alpha < 1 → use `rgba()`
- Gradients → `linear-gradient({angle}deg, {stops})`

### Categorization (Using Design Context)
- **Semantic**: Match against `semanticColors` → `--color-primary`, `--color-error`, etc.
- **Gray Scale**: Match against `grayScaleMapping`, order per convention
- **Gradients**: Match against `gradientRules.semanticMapping`
- **Fallback**: `--color-semantic-N`, `--gradient-N`

### Output Format
```css
:root {
  /* Primitive Colors */
  --gray-100: #f8f9fa;
  /* ... */

  /* Semantic Colors */
  --color-primary: #344767;
  --color-secondary: #7b809a;
  --color-success: #82d616;
  --color-error: #ea0606;
  --color-warning: #fbcf33;
  --color-info: #17c1e8;

  /* Background / Surface */
  --color-background: #f0f2f5;
  --color-surface: #ffffff;

  /* Text */
  --color-text-primary: #344767;
  --color-text-secondary: #7b809a;
  --color-text-muted: #8392ab;

  /* Gradients */
  --gradient-dark: linear-gradient(135deg, #3a416f 0%, #141727 100%);
  --gradient-primary: linear-gradient(90deg, #7928ca 0%, #ff0080 100%);
}
```

## Token Type: Typography

### What to Find
- Run `$QUERY text-styles` — returns all unique font/size/weight/lineHeight combos with examples

### Conversion
- Font size → rem (÷16), line height → unitless ratio, letter spacing → em

### Output Format
```css
:root {
  --font-family-primary: 'Open Sans', sans-serif;
  --font-size-xs: 0.75rem;    /* 12px */
  --font-size-sm: 0.875rem;   /* 14px */
  --font-size-base: 1rem;     /* 16px */
  /* ... through 5xl */
  --font-weight-light: 300;
  --font-weight-regular: 400;
  --font-weight-bold: 700;
  --line-height-tight: 1.25;
  --line-height-normal: 1.5;
}
```

## Token Type: Spacing

### What to Find
- Run `$QUERY spacing` — returns auto-layout spacing values (itemSpacing, padding)
- Run `$QUERY radii` — returns corner radius values (also used for radius tokens in Effects)
- If spacing query returns empty, infer a scale pattern from common UI conventions (4px base: 4, 8, 12, 16, 24, 32, 48, 64)

### Output Format
```css
:root {
  --spacing-1: 0.25rem;   /* 4px */
  --spacing-2: 0.5rem;    /* 8px */
  /* ... */
  --spacing-xs: var(--spacing-1);
  --spacing-sm: var(--spacing-2);
  --spacing-md: var(--spacing-4);
  --spacing-lg: var(--spacing-6);
  --spacing-xl: var(--spacing-8);
}
```

## Token Type: Effects

### What to Find
- Run `$QUERY effects` — returns all shadow and blur definitions with CSS equivalents
- Run `$QUERY radii` — returns all corner radius values with context

### Output Format
```css
:root {
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  /* ... */
  --radius-sm: 0.25rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
  --radius-full: 9999px;
  --blur-sm: 4px;
  --blur-md: 12px;
}
```

## Output Files

- CSS tokens: `{outputPath}`
- Metadata: `{metaOutputPath}` (JSON with tokenType, count, categories, warnings)

## Rules

1. Load context FIRST (Step 0)
2. Match before naming — only use semantic names when hex values match
3. Use kebab-case: `--color-primary` not `--colorPrimary`
4. Include comments grouping tokens by category
5. Preserve original values — don't normalize unless documented
6. Handle duplicates — log warning, use first occurrence
7. Gray scale ordering follows `grayScaleConvention`
8. Gradient angles preserved from `gradientRules.primaryAngle`
