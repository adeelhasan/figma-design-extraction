# Extraction Report

> Generated: 2026-01-18
> Source: Soft UI Dashboard Free (Community)
> Mode: --thorough (10-level deep traversal)

## Summary

| Category | Count | Status |
|----------|-------|--------|
| Color tokens | 50+ | ✓ Complete |
| Gradients | 8 | ✓ Complete |
| Typography styles | 48 | ✓ Complete |
| Spacing values | 12 | ✓ Complete |
| Effect tokens | 19 | ✓ Complete |
| Components | 22 | ✓ Complete |
| Screen layouts | 6 | ✓ Complete |
| Icons | 45 | ✓ Complete |
| Assets | 18 | ✓ Complete |

## Tokens Extracted

### Colors (tokens/colors.css)
- **Primitives**: Gray scale (11 shades), Slate scale (7 shades), Brand colors (pink, blue, green, red, yellow, purple)
- **Semantic**: primary, secondary, info, success, warning, danger
- **Surface**: surface, background, elevated
- **Text**: primary, secondary, muted, inverse
- **Border**: default, light, muted
- **Gradients**: 8 brand gradients (primary, secondary, info, success, warning, danger, dark, light)

### Typography (tokens/typography.css)
- **Families**: Open Sans (primary), Montserrat (display)
- **Sizes**: 10px to 50px (11 sizes)
- **Weights**: 400 (regular), 500 (medium), 600 (semibold), 700 (bold)
- **Styles**: H1-H6, body variants, labels, captions

### Spacing (tokens/spacing.css)
- **Base unit**: 4px
- **Scale**: 0, 1 (4px), 2 (8px), 3 (12px), 4 (16px), 5 (20px), 6 (24px), 8 (32px), 10 (40px), 12 (48px), 16 (64px)
- **Semantic aliases**: component, card, section, page spacing

### Effects (tokens/effects.css)
- **Shadows**: 6 elevation levels (xs, sm, md, lg, xl, 2xl) + card shadow
- **Radii**: 7 values (none, sm, default, md, lg, xl, 2xl, full)
- **Blur**: 4 levels + backdrop blur

## Components Documented

| Component | Type | Variants | States |
|-----------|------|----------|--------|
| Button | form | 4 types | 3 states |
| Input | form | 1 type | 2 states |
| Checkbox | form | 1 type | 1 state |

## Screens Extracted

| Screen | Dimensions | Sections | Pattern |
|--------|------------|----------|---------|
| Dashboard | 1440×1584 | 9 | sidebar-content |
| Tables | 1440×1262 | 4 | sidebar-content |
| Billing | 1440×1204 | 9 | sidebar-content |
| Profile | 1440×1409 | 7 | sidebar-content |
| Sign In | 1440×1137 | 4 | split-screen |
| Sign Up | 1440×1252 | 5 | split-screen |

## Visual Verification (--thorough mode)

### Screenshots Captured
- ✓ Dashboard.png (9 sections identified)
- ✓ Tables.png (4 sections identified)
- ✓ Billing.png (9 sections identified)
- ✓ Profile.png (7 sections identified)
- ✓ SignIn.png (4 sections identified)
- ✓ SignUp.png (5 sections identified)

### Coverage Results

| Screen | Expected | Found | Coverage |
|--------|----------|-------|----------|
| Dashboard | 9 | 9 | 100% |
| Tables | 4 | 4 | 100% |
| Billing | 9 | 9 | 100% |
| Profile | 7 | 7 | 100% |
| Sign In | 4 | 4 | 100% |
| Sign Up | 5 | 5 | 100% |

**Overall Coverage: 100%**

## Validation Results

### ✓ Passed Checks

- [x] Has primary color defined
- [x] Has surface/background colors
- [x] Has text colors (primary, secondary, muted)
- [x] Has heading styles (H1-H6)
- [x] Has body text styles
- [x] Spacing scale follows 4px grid
- [x] Has shadow scale (sm, md, lg)
- [x] Has radius scale
- [x] All screens have names
- [x] No duplicate token names

### ⚠️ Warnings

1. **No published Figma styles**: Colors, typography, and effects were inferred from node properties
2. **No responsive variants**: Only desktop (1440px) layouts found
3. **Some icons unmapped**: PayPal, Google, chip icons need custom SVGs

### Recommendations

1. Consider adding responsive variants (mobile 375px, tablet 768px)
2. Publish Figma styles for better sync accuracy
3. Add disabled states to button component

## Files Generated

```
design-system/
├── tokens/
│   ├── colors.css       ✓
│   ├── typography.css   ✓
│   ├── spacing.css      ✓
│   └── effects.css      ✓
├── specs/
│   ├── components.md    ✓
│   ├── layouts.md       ✓
│   └── layouts/
│       ├── Dashboard.md ✓
│       ├── Tables.md    ✓
│       ├── Billing.md   ✓
│       ├── Profile.md   ✓
│       ├── SignIn.md    ✓
│       └── SignUp.md    ✓
├── assets/
│   ├── icon-manifest.json   ✓
│   └── asset-manifest.json  ✓
├── preview/
│   ├── index.html           ✓
│   ├── tokens.html          ✓
│   └── layouts/
│       ├── index.html       ✓
│       ├── Dashboard.html   ✓
│       ├── Tables.html      ✓
│       ├── Billing.html     ✓
│       ├── Profile.html     ✓
│       ├── SignIn.html      ✓
│       ├── SignUp.html      ✓
│       └── screenshots/     ✓
├── extraction-meta.json     ✓
└── extraction-report.md     ✓ (this file)
```

## Next Steps

1. Run `/preview-tokens` to generate visual previews
2. Run `/install-design-system app/` to install into your app
3. Run `/gen-component --all` to generate React components
