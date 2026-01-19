# Design System Skill: {{projectName}}

> **Source:** [{{fileName}}]({{figmaUrl}})  
> **Extracted:** {{extractionDate}}  
> **Last Synced:** {{lastSyncDate}}

## Overview

This skill contains design tokens, component specifications, and layout patterns extracted from Figma. Use these as the source of truth when generating UI code.

## Quick Start

### 1. Import Tokens

Add to your global CSS (e.g., `src/app/globals.css`):

```css
@import 'design-system/tokens/colors.css';
@import 'design-system/tokens/typography.css';
@import 'design-system/tokens/spacing.css';
@import 'design-system/tokens/effects.css';
```

Or with Tailwind, extend your config:

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: 'var(--color-primary)',
        secondary: 'var(--color-secondary)',
        // ... see tokens/colors.css for full list
      },
      spacing: {
        // ... see tokens/spacing.css
      },
      // ...
    }
  }
}
```

### 2. Use Tokens in Components

```tsx
// Always use CSS custom properties
<button className="bg-[var(--color-primary)] text-[var(--color-text-inverse)] rounded-[var(--radius-md)] px-[var(--spacing-md)] py-[var(--spacing-sm)]">
  Click me
</button>

// Or with Tailwind (if configured)
<button className="bg-primary text-white rounded-md px-4 py-2">
  Click me
</button>
```

### 3. Reference Components

Before building a component, check `components.md` for:
- Variant specifications
- Dimension constraints
- Token usage requirements
- State definitions

---

## Token Categories

### Colors (`tokens/colors.css`)

| Category | Tokens | Usage |
|----------|--------|-------|
| Primitives | `--color-{hue}-{shade}` | Raw color values, rarely used directly |
| Semantic | `--color-primary`, `--color-error`, etc. | Brand and feedback colors |
| Surface | `--color-surface`, `--color-surface-elevated` | Backgrounds |
| Text | `--color-text-primary`, `--color-text-muted` | Text colors |
| Border | `--color-border`, `--color-border-muted` | Border colors |

### Typography (`tokens/typography.css`)

| Token | Usage |
|-------|-------|
| `--font-family-sans` | Primary UI font |
| `--font-size-{scale}` | Font sizes (xs, sm, base, lg, xl, 2xl...) |
| `--font-weight-{name}` | Font weights (normal, medium, semibold, bold) |
| `--font-leading-{name}` | Line heights (tight, normal, relaxed) |

### Spacing (`tokens/spacing.css`)

| Token | Value | Usage |
|-------|-------|-------|
| `--spacing-xs` | {{spacingXs}}px | Tight gaps, inline elements |
| `--spacing-sm` | {{spacingSm}}px | Component internal spacing |
| `--spacing-md` | {{spacingMd}}px | Default spacing |
| `--spacing-lg` | {{spacingLg}}px | Section spacing |
| `--spacing-xl` | {{spacingXl}}px | Page-level spacing |

### Effects (`tokens/effects.css`)

| Token | Usage |
|-------|-------|
| `--shadow-sm` | Subtle elevation (buttons, inputs) |
| `--shadow-md` | Medium elevation (cards, dropdowns) |
| `--shadow-lg` | High elevation (modals, popovers) |
| `--radius-sm` | Subtle rounding |
| `--radius-md` | Default rounding |
| `--radius-lg` | Prominent rounding |
| `--radius-full` | Pills, avatars |

---

## Component Reference

See `components.md` for detailed specifications including:
- All variants and their properties
- Exact dimensions and spacing
- Token usage mapping
- Interactive states

**Quick links:**
{{#each components}}
- [{{name}}](components.md#{{slug}})
{{/each}}

---

## Layout Reference

See `layouts.md` for screen specifications including:
- Grid system details
- Section structure
- Responsive breakpoints
- Component placement

**Screens:**
{{#each screens}}
- [{{name}}](layouts.md#{{slug}})
{{/each}}

---

## Rules for Code Generation

When generating UI code, Claude MUST follow these rules:

### ✅ DO

1. **Always use design tokens** — Never hardcode colors, spacing, or other values
2. **Check component specs** — Before building, read the spec in `components.md`
3. **Follow layout patterns** — Match the structure defined in `layouts.md`
4. **Maintain token names** — Use exact token names from the CSS files
5. **Include all states** — Implement hover, focus, disabled states as specified

### ❌ DON'T

1. **Never hardcode colors** — Use `var(--color-primary)`, not `#3b82f6`
2. **Never hardcode spacing** — Use `var(--spacing-md)`, not `16px`
3. **Never invent new tokens** — Only use tokens defined in this skill
4. **Never skip states** — All interactive components need state handling
5. **Never ignore specs** — Component dimensions and spacing are intentional

### Example: Correct vs Incorrect

```tsx
// ❌ WRONG - hardcoded values
<button style={{ backgroundColor: '#3b82f6', padding: '12px 24px', borderRadius: '8px' }}>

// ✅ CORRECT - using tokens
<button style={{ 
  backgroundColor: 'var(--color-primary)', 
  padding: 'var(--spacing-sm) var(--spacing-md)', 
  borderRadius: 'var(--radius-md)' 
}}>
```

---

## Sync & Updates

### Check for Changes
```
/sync --check
```

### Sync Specific Items
```
/sync-tokens              # Update all tokens
/sync-component Button    # Update Button spec
/sync-screen Dashboard    # Update Dashboard layout
```

### Full Re-extraction
```
/sync --all
```

---

## Files in This Skill

```
design-system/
├── SKILL.md                 ← You are here
├── tokens/
│   ├── colors.css           — Color tokens
│   ├── typography.css       — Typography tokens
│   ├── spacing.css          — Spacing tokens
│   └── effects.css          — Shadow, radius, etc.
├── components.md            — Component specifications
├── layouts.md               — Screen/page layouts
├── extraction-meta.json     — Sync metadata
├── extraction-report.md     — Validation report
└── preview/
    └── index.html           — Visual preview
```

---

## Validation Status

{{#if validationPassed}}
✅ **All checks passed**
{{else}}
⚠️ **{{validationWarnings}} warnings, {{validationErrors}} errors**

See `extraction-report.md` for details.
{{/if}}

---

*This skill was generated by the figma-extraction skill. Run `/sync --check` to check for updates.*
