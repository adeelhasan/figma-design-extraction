# Preview Design Tokens

Display a visual preview of extracted design tokens.

## Usage

```
/preview-tokens [category]
```

## Arguments

- `category` (optional): Filter to specific token type
  - `colors` — Color tokens only
  - `typography` — Typography tokens only
  - `spacing` — Spacing scale only
  - `effects` — Shadows and radii only
  - (none) — Show all tokens

## Process

1. **Load tokens**
   - Read from `design-system/tokens/`

2. **Generate preview**
   - Create inline React artifact
   - Show visual representation

3. **Display**
   - Render in conversation as interactive artifact

## Preview Contents

### Colors
- Primitive color scales (swatches)
- Semantic colors (labeled swatches)
- Text/surface combinations (contrast demo)

### Typography
- Font family samples
- Size scale with sample text
- Weight variations

### Spacing
- Visual bars showing scale
- Common usage examples

### Effects
- Shadow elevation examples
- Border radius samples

## Example

```
/preview-tokens colors

[Artifact: Color Token Preview]

┌─────────────────────────────────────────────────┐
│ Color Tokens                                     │
├─────────────────────────────────────────────────┤
│                                                  │
│ Primitives                                       │
│ ┌─────────────────────────────────────────────┐ │
│ │ primary  [50][100][200]...[800][900]        │ │
│ │ neutral  [50][100][200]...[800][900]        │ │
│ └─────────────────────────────────────────────┘ │
│                                                  │
│ Semantic                                         │
│ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐       │
│ │ pri │ │ sec │ │ err │ │warn │ │succ │       │
│ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘       │
│                                                  │
│ Text on Surface                                  │
│ ┌─────────────────────────────────────────────┐ │
│ │ Primary text      ✓ 12.5:1                  │ │
│ │ Secondary text    ✓ 7.2:1                   │ │
│ │ Muted text        ✓ 4.8:1                   │ │
│ └─────────────────────────────────────────────┘ │
│                                                  │
└─────────────────────────────────────────────────┘
```

## Notes

- Quick way to verify extraction results
- Use before/after sync to compare changes
- Contrast ratios shown for accessibility validation
