# 03 - Extract Typography Tokens

## Purpose
Extract all typography styles from Figma and generate CSS custom properties.

## Sources in Figma

**Text Styles** (primary source)
- Published text styles
- Access via `file.styles` where `styleType === 'TEXT'`

## Process

### Step 1: Get Text Styles

```typescript
const textStyles = Object.entries(file.styles)
  .filter(([id, style]) => style.styleType === 'TEXT')
  .map(([id, style]) => ({
    id,
    name: style.name,
    description: style.description
  }));
```

For each style, find a node using it to get properties:
```typescript
const node = findNodeWithStyle(file.document, styleId);
const typeStyle = node.style;

typography = {
  fontFamily: typeStyle.fontFamily,
  fontWeight: typeStyle.fontWeight,
  fontSize: typeStyle.fontSize,
  lineHeight: calculateLineHeight(typeStyle),
  letterSpacing: typeStyle.letterSpacing,
  textCase: typeStyle.textCase // UPPER, LOWER, TITLE, ORIGINAL
};
```

### Step 2: Calculate Line Height

Figma stores line height in multiple formats:
```typescript
function calculateLineHeight(style): string | number {
  if (style.lineHeightUnit === 'PIXELS') {
    return `${style.lineHeightPx}px`;
  }
  if (style.lineHeightUnit === 'FONT_SIZE_%') {
    return style.lineHeightPercentFontSize / 100; // e.g., 1.5
  }
  if (style.lineHeightUnit === 'INTRINSIC_%') {
    return 'normal';
  }
  return 'normal';
}
```

### Step 3: Categorize Typography

**Pattern Detection:**
```
"Heading/H1"        → category: "heading", level: 1
"Display Large"     → category: "display", size: "large"
"Body/Regular"      → category: "body", variant: "regular"
"Caption"           → category: "caption"
"Label/Small"       → category: "label", size: "small"
"Code/Inline"       → category: "code", variant: "inline"
```

**Categories:**
- **Display**: Large hero text
- **Heading**: H1-H6 equivalents
- **Body**: Paragraph text
- **Label**: UI labels, buttons
- **Caption**: Small descriptive text
- **Code**: Monospace text

### Step 4: Detect Font Families

Group unique font families:
```typescript
const fontFamilies = new Set(styles.map(s => s.fontFamily));

// Common mapping
{
  "Inter": "sans",
  "SF Pro": "sans", 
  "Roboto": "sans",
  "Georgia": "serif",
  "Merriweather": "serif",
  "Fira Code": "mono",
  "JetBrains Mono": "mono"
}
```

### Step 5: Generate CSS

Template: `templates/typography.template.css`

```css
/* =================================================================
   Typography Tokens
   Extracted from: {fileName}
   Generated: {date}
   ================================================================= */

:root {
  /* ---------------------------------------------------------------
     Font Families
     --------------------------------------------------------------- */
  --font-family-sans: '{sansFontFamily}', system-ui, sans-serif;
  --font-family-serif: '{serifFontFamily}', Georgia, serif;
  --font-family-mono: '{monoFontFamily}', 'Courier New', monospace;
  
  /* ---------------------------------------------------------------
     Font Sizes
     --------------------------------------------------------------- */
  {#each sizes}
  --font-size-{name}: {value}px;
  {/each}
  
  /* ---------------------------------------------------------------
     Font Weights
     --------------------------------------------------------------- */
  --font-weight-normal: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;
  
  /* ---------------------------------------------------------------
     Line Heights
     --------------------------------------------------------------- */
  {#each lineHeights}
  --font-line-height-{name}: {value};
  {/each}
  
  /* ---------------------------------------------------------------
     Letter Spacing
     --------------------------------------------------------------- */
  {#each letterSpacings}
  --font-letter-spacing-{name}: {value}em;
  {/each}
  
  /* ---------------------------------------------------------------
     Composite Styles (for reference)
     --------------------------------------------------------------- */
  /*
  {#each styles}
  {name}:
    font-family: var(--font-family-{family});
    font-size: var(--font-size-{size});
    font-weight: var(--font-weight-{weight});
    line-height: var(--font-line-height-{lineHeight});
    letter-spacing: var(--font-letter-spacing-{letterSpacing});
  {/each}
  */
}
```

### Step 6: Generate Type Scale Reference

Create a comment block showing the full scale:
```css
/*
Typography Scale Reference
==========================

Display Large:  48px / 1.1 / 700
Display Medium: 36px / 1.2 / 700

Heading 1: 32px / 1.25 / 600
Heading 2: 24px / 1.3  / 600
Heading 3: 20px / 1.4  / 600
Heading 4: 18px / 1.4  / 600

Body Large:   18px / 1.6 / 400
Body Regular: 16px / 1.6 / 400
Body Small:   14px / 1.5 / 400

Caption:  12px / 1.4 / 400
Overline: 12px / 1.4 / 600 (uppercase)
*/
```

### Step 7: Update Metadata

```json
{
  "tokens": {
    "typography": {
      "count": 12,
      "hash": "{contentHash}",
      "fontFamilies": ["Inter", "Fira Code"],
      "categories": ["heading", "body", "caption"],
      "styleIds": ["S:typ001", "S:typ002"]
    }
  }
}
```

### Step 8: Report

```
✓ Typography extracted

Found {count} text styles:
├── Font families: {familyList}
├── Categories:
│   ├── Display: {count} styles
│   ├── Heading: {count} styles (H1-H{n})
│   ├── Body: {count} styles
│   ├── Caption: {count} styles
│   └── Code: {count} styles
│
└── Size range: {minSize}px - {maxSize}px

Output: tokens/typography.css
```

## Edge Cases

### Variable Fonts
If font has variable weight:
```css
--font-weight-{name}: {weightValue}; /* Variable: 100-900 */
```

### Custom/Local Fonts
Note fonts that may not be web-available:
```
⚠ Warning: Font "{fontName}" may not be available on web.
  Consider using a web-safe alternative or hosting the font.
  
  Suggestions:
  - Google Fonts alternative: {suggestion}
  - System font fallback included
```

### Missing Styles
If standard categories not found:
```
⚠ Warning: No heading styles detected.
  Consider adding styles like "Heading/H1", "H1", or "Title"
```

## Validation

Check and report:
- [ ] Has heading styles
- [ ] Has body text style
- [ ] Font sizes follow a reasonable scale
- [ ] Line heights are appropriate (1.2-1.8 for body)
- [ ] Weights are standard values (400, 500, 600, 700)

## Fallbacks

Handle common variations gracefully:

- **No published text styles?** Scan TEXT nodes for unique font/size/weight combinations
- **Unknown font family?** Use as-is, categorize as "custom" (not an error)
- **Variable fonts?** Note weight range, use midpoint as default weight
- **Non-standard sizes?** Include all found, sort by size for scale naming
- **Missing heading/body distinction?** Infer from font size (larger = heading)

The goal is to capture typography as designed, even if organization differs from conventions.

## Next Step
Proceed to: `extract-spacing.md`
