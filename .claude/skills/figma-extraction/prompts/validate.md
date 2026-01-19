# 08 - Validate Extraction

## Purpose
Run quality checks on extracted tokens, components, and layouts. Generate validation report.

## Behavior

**IMPORTANT**: Validation is advisory only. The extraction ALWAYS proceeds to the next step (09-preview.md) regardless of validation results.

- Errors are logged but do **not** block completion
- Warnings are informational
- The `extraction-report.md` is always generated
- Proceed to preview generation after validation completes

## Validation Categories

### 1. Naming Consistency

**Rules:**
- All token names use kebab-case
- No spaces, underscores (except semantic meaning)
- No duplicate names
- Semantic names where appropriate

**Checks:**
```typescript
function validateNaming(tokens: Token[]): ValidationResult[] {
  const results: ValidationResult[] = [];
  const names = new Set<string>();
  
  for (const token of tokens) {
    // Check format
    if (!/^[a-z][a-z0-9-]*$/.test(token.name)) {
      results.push({
        level: 'warning',
        category: 'naming',
        message: `Token "${token.name}" doesn't follow kebab-case`,
        suggestion: toKebabCase(token.name)
      });
    }
    
    // Check duplicates
    if (names.has(token.name)) {
      results.push({
        level: 'error',
        category: 'naming',
        message: `Duplicate token name: "${token.name}"`,
        suggestion: 'Rename in Figma or manually in output'
      });
    }
    names.add(token.name);
  }
  
  return results;
}
```

### 2. Color Contrast (WCAG)

**Rules:**
- Text on backgrounds must meet AA (4.5:1 normal, 3:1 large)
- UI elements must meet 3:1 contrast
- Provide AAA recommendations (7:1)

**Checks:**
```typescript
function validateContrast(colors: ColorTokens): ValidationResult[] {
  const results: ValidationResult[] = [];
  
  // Get text/background pairs
  const pairs = [
    { text: 'text-primary', bg: 'surface' },
    { text: 'text-secondary', bg: 'surface' },
    { text: 'text-muted', bg: 'surface' },
    { text: 'text-inverse', bg: 'primary' },
  ];
  
  for (const pair of pairs) {
    const textColor = colors[pair.text];
    const bgColor = colors[pair.bg];
    
    if (!textColor || !bgColor) continue;
    
    const ratio = calculateContrastRatio(textColor, bgColor);
    
    if (ratio < 4.5) {
      results.push({
        level: 'error',
        category: 'contrast',
        message: `Insufficient contrast: ${pair.text} on ${pair.bg} (${ratio.toFixed(2)}:1)`,
        suggestion: `Minimum 4.5:1 required for WCAG AA. Current: ${ratio.toFixed(2)}:1`
      });
    } else if (ratio < 7) {
      results.push({
        level: 'info',
        category: 'contrast',
        message: `${pair.text} on ${pair.bg}: ${ratio.toFixed(2)}:1 (AA pass, AAA fail)`,
        suggestion: 'Consider increasing contrast for AAA compliance'
      });
    }
  }
  
  return results;
}

function calculateContrastRatio(color1: string, color2: string): number {
  const l1 = relativeLuminance(parseHex(color1));
  const l2 = relativeLuminance(parseHex(color2));
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}
```

### 3. Spacing Scale

**Rules:**
- Values should follow consistent scale (4px or 8px base)
- Scale should have reasonable progression
- No irregular/one-off values

**Checks:**
```typescript
function validateSpacing(spacing: SpacingTokens): ValidationResult[] {
  const results: ValidationResult[] = [];
  const values = Object.values(spacing).map(v => parseInt(v));
  
  // Check grid alignment
  const base = detectBaseUnit(values);
  const offGrid = values.filter(v => v % base !== 0 && v !== 0);
  
  if (offGrid.length > 0) {
    results.push({
      level: 'warning',
      category: 'spacing',
      message: `Values not aligned to ${base}px grid: ${offGrid.join(', ')}`,
      suggestion: `Normalize to nearest ${base}px increment`
    });
  }
  
  // Check scale progression
  const sorted = [...new Set(values)].sort((a, b) => a - b);
  const gaps = [];
  for (let i = 1; i < sorted.length; i++) {
    gaps.push(sorted[i] - sorted[i-1]);
  }
  
  const irregularGaps = gaps.filter(g => g !== base && g !== base * 2);
  if (irregularGaps.length > sorted.length / 2) {
    results.push({
      level: 'info',
      category: 'spacing',
      message: 'Spacing scale has irregular progression',
      suggestion: 'Consider using a more consistent scale like 4, 8, 12, 16, 24, 32, 48, 64'
    });
  }
  
  return results;
}
```

### 4. Typography Scale

**Rules:**
- Should have clear hierarchy
- Line heights should be appropriate (1.2-1.8 for body)
- Font weights should be standard values

**Checks:**
```typescript
function validateTypography(typography: TypographyTokens): ValidationResult[] {
  const results: ValidationResult[] = [];
  
  // Check line heights
  for (const style of typography) {
    const lh = parseFloat(style.lineHeight);
    if (lh < 1.1) {
      results.push({
        level: 'warning',
        category: 'typography',
        message: `Line height too tight: ${style.name} (${lh})`,
        suggestion: 'Minimum 1.2 recommended for readability'
      });
    }
    if (style.category === 'body' && (lh < 1.4 || lh > 2)) {
      results.push({
        level: 'info',
        category: 'typography',
        message: `Body text line height: ${style.name} (${lh})`,
        suggestion: '1.5-1.7 recommended for body text'
      });
    }
  }
  
  // Check font size hierarchy
  const sizes = typography.map(t => t.fontSize).sort((a, b) => b - a);
  const ratio = sizes[0] / sizes[sizes.length - 1];
  if (ratio > 8) {
    results.push({
      level: 'info',
      category: 'typography',
      message: `Large size range: ${sizes[sizes.length-1]}px to ${sizes[0]}px (${ratio.toFixed(1)}x)`,
      suggestion: 'Verify this range is intentional'
    });
  }
  
  return results;
}
```

### 5. Component Completeness

**Rules:**
- Interactive components should have hover/pressed/disabled states
- Required tokens should be present
- Variants should be consistent

**Checks:**
```typescript
function validateComponents(components: ComponentSpec[]): ValidationResult[] {
  const results: ValidationResult[] = [];
  
  for (const component of components) {
    // Check for interactive states
    const isInteractive = ['button', 'input', 'link', 'checkbox', 'toggle']
      .some(type => component.name.toLowerCase().includes(type));
    
    if (isInteractive) {
      const hasHover = component.variants.some(v => 
        v.properties.State?.toLowerCase() === 'hover'
      );
      const hasDisabled = component.variants.some(v => 
        v.properties.State?.toLowerCase() === 'disabled'
      );
      
      if (!hasHover) {
        results.push({
          level: 'warning',
          category: 'components',
          message: `"${component.name}" missing hover state`,
          suggestion: 'Add hover variant for better UX'
        });
      }
      if (!hasDisabled) {
        results.push({
          level: 'info',
          category: 'components',
          message: `"${component.name}" missing disabled state`,
          suggestion: 'Add disabled variant for accessibility'
        });
      }
    }
    
    // Check description
    if (!component.description) {
      results.push({
        level: 'info',
        category: 'components',
        message: `"${component.name}" has no description`,
        suggestion: 'Add description in Figma for documentation'
      });
    }
  }
  
  return results;
}
```

### 6. Token Coverage

**Rules:**
- Components should use design tokens, not hard-coded values
- High coverage indicates consistent system

**Checks:**
```typescript
function validateCoverage(components: ComponentSpec[], tokens: AllTokens): ValidationResult[] {
  const results: ValidationResult[] = [];
  
  for (const component of components) {
    const colorCoverage = component.tokens.colors.length / tokens.colors.length;
    
    if (component.tokens.colors.length === 0) {
      results.push({
        level: 'warning',
        category: 'coverage',
        message: `"${component.name}" uses no color tokens`,
        suggestion: 'Verify colors are from styles, not hard-coded'
      });
    }
  }
  
  return results;
}
```

## Generate Report

Output to `extraction-report.md`:

```markdown
# Extraction Report

> Generated: {date}
> File: {fileName}
> URL: {figmaUrl}

## Extraction Summary

What was found in Figma vs. what was extracted:

| Category | Found | Extracted | Notes |
|----------|-------|-----------|-------|
| Colors | {foundColors} | {extractedColors} | {colorNotes} |
| Gradients | {foundGradients} | {extractedGradients} | {gradientNotes} |
| Typography | {foundText} | {extractedText} | {textNotes} |
| Spacing | {foundSpacing} | {extractedSpacing} | {spacingNotes} |
| Effects | {foundEffects} | {extractedEffects} | {effectNotes} |
| Components | {foundComponents} | {extractedComponents} | {componentNotes} |
| Layouts | {foundScreens} | {extractedLayouts} | {layoutNotes} |

### Extraction Notes

{{#each extractionNotes}}
- {note}
{{/each}}

---

## Validation Summary

| Category | Errors | Warnings | Info |
|----------|--------|----------|------|
| Naming | {n} | {n} | {n} |
| Contrast | {n} | {n} | {n} |
| Spacing | {n} | {n} | {n} |
| Typography | {n} | {n} | {n} |
| Components | {n} | {n} | {n} |
| Coverage | {n} | {n} | {n} |
| **Total** | **{n}** | **{n}** | **{n}** |

## Status: {PASS | WARNINGS | ERRORS}

---

## Errors (Must Fix)

{#each errors}
### ❌ {message}

**Category:** {category}
**Suggestion:** {suggestion}

{/each}

---

## Warnings (Should Fix)

{#each warnings}
### ⚠️ {message}

**Category:** {category}
**Suggestion:** {suggestion}

{/each}

---

## Info (Consider)

{#each infos}
### ℹ️ {message}

**Category:** {category}
**Suggestion:** {suggestion}

{/each}

---

## Validation Details

### Color Contrast Matrix

| Text | Surface | Ratio | Status |
|------|---------|-------|--------|
| text-primary | surface | {ratio} | {status} |
| text-secondary | surface | {ratio} | {status} |
| text-inverse | primary | {ratio} | {status} |

### Spacing Scale Analysis

Detected base: {base}px
Grid alignment: {percentage}%

| Value | On Grid | Usage Count |
|-------|---------|-------------|
| {value}px | {yes/no} | {count} |

### Component State Coverage

| Component | Hover | Pressed | Disabled | Focus |
|-----------|-------|---------|----------|-------|
| Button | ✓ | ✓ | ✓ | ✓ |
| Input | ✓ | - | ✓ | ✓ |

---

## Gaps / Manual Fixes Needed

Items that couldn't be automatically extracted or categorized:

{{#if gaps}}
{{#each gaps}}
- ⚠ {description}
{{/each}}
{{else}}
✓ No gaps identified - extraction was complete.
{{/if}}

---

## Next Steps

1. **Review tokens** - Check `tokens/*.css` files for any values that need adjustment
2. **Check component specs** - Review `specs/components.md` for completeness
3. **Run preview** - Use `/preview-tokens` to visually verify extraction
4. **Install to app** - Run `/install-design-system [path]` when ready

---

## Recommendations

{{#each recommendations}}
{index}. **{priority}**: {description}
{{/each}}
```

## Report Output

Console output after validation:

```
✓ Extraction complete

Summary:
┌──────────────┬───────┬───────────┬─────────────────────────┐
│ Category     │ Found │ Extracted │ Notes                   │
├──────────────┼───────┼───────────┼─────────────────────────┤
│ Colors       │ {n}   │ {n}       │ {notes}                 │
│ Typography   │ {n}   │ {n}       │ {notes}                 │
│ Spacing      │ {n}   │ {n}       │ {notes}                 │
│ Effects      │ {n}   │ {n}       │ {notes}                 │
│ Components   │ {n}   │ {n}       │ {notes}                 │
│ Layouts      │ {n}   │ {n}       │ {notes}                 │
└──────────────┴───────┴───────────┴─────────────────────────┘

Validation: {PASS | WARNINGS | ERRORS}
├── Errors: {n}
├── Warnings: {n}
└── Info: {n}

{{#if gaps}}
Gaps requiring manual attention:
{{#each gaps (first 3)}}
  ⚠ {description}
{{/each}}
{{/if}}

Full report: extraction-report.md
```

## Next Step
Proceed to: `preview.md`
