# Component Specifications

> Extracted from: Soft UI Dashboard Free (Community)
> Generated: 2026-02-06
> Components: 22 (standalone components)
> Symbols Page: ✅ Symbols (main component definitions)

---

## Button

Primary interactive element for actions. Multiple sizes and states available.

### Component Type

| Property | Value |
|----------|-------|
| Category | form |
| Type | Button |
| Confidence | high |
| Inferred From | name matches "button" pattern |

### Variants

| Property | Values | Default |
|----------|--------|---------|
| Size | `small`, `medium`, `large` | `medium` |
| Variant | `default`, `outline`, `with-icon`, `just-icon` | `default` |
| State | `default`, `hover`, `active` | `default` |

### Dimensions

| Size | Width | Height | Padding | Notes |
|------|-------|--------|---------|-------|
| small | 104px | 32px | 8px 16px | Compact button |
| medium | 104px | 40px | 12px 16px | Standard button |
| large | 185px | 47px | 16px 24px | Prominent CTA |
| with-icon | 127px | 40px | 12px 16px | Button with leading icon |
| just-icon | 40px | 40px | 0px | Icon-only button (square) |
| outline | 104px | 40px | 12px 16px | Border-only style |

**All Measurements:**
- Component heights include text baseline + padding
- Width varies based on content (label vs icon)
- Padding is symmetric (top/bottom = left/right)

### Token Usage

**Colors:**
- Primary Fill: `#000000` (dark navy/black) - needs semantic mapping to `var(--color-primary)`
- Outline Variant: Border with transparent fill
- Text: `var(--color-text-inverse)` (white/light on dark)
- Border (outline): `var(--color-border)`

**Typography:**
- Font: System sans-serif
- Size:
  - Small: 12px
  - Medium: 14px
  - Large: 16px
- Weight: 600-700 (semi-bold)
- Line Height: 1.5
- Transform: None (mixed case)

**Effects:**
- Border Radius: `var(--radius-md)` (8px)
- Shadow: Dual drop shadow layer
  - Layer 1: blur 4px, y-offset 2px, spread -1px
  - Layer 2: blur 6px, y-offset 4px, spread -1px
- Transition: 150ms ease-in-out

### States

- **Default**: Base appearance with gradient background
- **Hover**: Slight shadow and scale effect
- **Active**: Pressed state, slightly smaller

### All Variant Instances

| Component Name | Width | Height |
|----------------|-------|--------|
| button/size/large/default | 185px | 47px |
| button/size/large/hover | 189px | 48px |
| button/size/large/active | 185px | 47px |
| button/size/medium/default | 104px | 40px |
| button/size/medium/hover | 108px | 42px |
| button/size/medium/active | 104px | 40px |
| button/size/small/default | 104px | 32px |
| button/size/small/hover | 108px | 32px |
| button/size/small/active | 108px | 32px |
| button/outline/default | 104px | 40px |
| button/outline/hover | 114px | 44px |
| button/outline/active | 104px | 40px |
| button/with icon/default | 127px | 40px |
| button/with icon/hover | 131px | 41px |
| button/just icon/default | 40px | 40px |
| button/just icon/hover | 44px | 44px |
| button/just icon/active | 40px | 40px |

### Usage Notes

```tsx
// Primary button (default)
<Button size="medium">
  SIGN IN
</Button>

// Outline button
<Button variant="outline" size="medium">
  SIGN UP
</Button>

// Button with icon
<Button variant="with-icon">
  <Icon name="plus" /> ADD NEW
</Button>

// Icon-only button
<Button variant="just-icon" aria-label="Settings">
  <Icon name="settings" />
</Button>
```

---

## Input

Form input field for text entry.

### Component Type

| Property | Value |
|----------|-------|
| Category | form |
| Type | Input |
| Confidence | high |
| Inferred From | name matches "input" pattern |

### Variants

| Property | Values | Default |
|----------|--------|---------|
| State | `default`, `active` | `default` |

### Dimensions

| State | Width | Height |
|-------|-------|--------|
| default | 361px | 40px |
| active | 361px | 40px |

### Token Usage

**Colors:**
- Background: `#ffffff` (white) - map to `var(--color-surface)`
- Border Default: `#d9d9d9` (light gray) - map to `var(--color-border)`
- Border Active: Primary color accent
- Text: `#000000` (black) - map to `var(--color-text)`
- Placeholder: `#999999` (medium gray) - map to `var(--color-text-muted)`

**Typography:**
- Font: System sans-serif
- Size: 14px
- Weight: 400 (regular)
- Line Height: 1.5

**Effects:**
- Border Radius: `var(--radius-sm)` (6px)
- Border Width: 1px
- Focus Shadow: 0 0 0 3px with primary color (20% opacity)
- Transition: 150ms ease-in-out

### States

- **Default**: Light border, placeholder text visible
- **Active/Focus**: Primary color border, focus ring

### All Variant Instances

| Component Name | Width | Height |
|----------------|-------|--------|
| input/default | 361px | 40px |
| input/active | 361px | 40px |

### Usage Notes

```tsx
<Input
  type="email"
  placeholder="Email"
  label="Email"
/>

<Input
  type="password"
  placeholder="Password"
  label="Password"
/>
```

---

## Checkbox

Toggle control for boolean selection.

### Component Type

| Property | Value |
|----------|-------|
| Category | form |
| Type | Checkbox |
| Confidence | high |
| Inferred From | name matches "checkbox" pattern |

### Variants

| Property | Values | Default |
|----------|--------|---------|
| State | `active` (checked) | - |

### Dimensions

| State | Width | Height | Border Radius |
|-------|-------|--------|----------------|
| default/unchecked | 20px | 20px | 4px |
| active/checked | 20px | 20px | 4px |
| Touch target | 44px | 44px | — |

**Notes:**
- Minimum touch target: 44x44px (includes surrounding padding)
- Visual size: 20x20px checkbox
- Border width: 2px

### Token Usage

**Colors:**
- Background (unchecked): `#ffffff` (white) - map to `var(--color-surface)`
- Background (checked): `#252f40` (dark navy) - map to `var(--color-primary)`
- Border (unchecked): `#d9d9d9` (light gray) - map to `var(--color-border)`
- Border (checked): `#252f40` (matches fill)
- Checkmark: `#ffffff` (white) - map to `var(--color-text-inverse)`

**Effects:**
- Border Radius: `var(--radius-sm)` (4px)
- Border Width: 2px
- Focus Shadow: 0 0 0 2px primary color (30% opacity)
- Transition: 100ms ease-in-out

### Usage Notes

```tsx
<Checkbox
  label="Remember me"
  checked={rememberMe}
  onChange={setRememberMe}
/>

<Checkbox
  label="I agree to the Terms and Conditions"
  required
/>
```

---

## Component Summary

| Component | Category | Variants | Sizes | States |
|-----------|----------|----------|-------|--------|
| Button | form | 4 types | 3 sizes | 3 states |
| Input | form | 1 type | 1 size | 2 states |
| Checkbox | form | 1 type | 1 size | 1 state |

### Token Coverage

- **Color tokens used**: ~15 tokens
- **Typography tokens used**: 4 styles
- **Effect tokens used**: 6 effects (shadows + radii)

### Notes

1. Components primarily use **solid fills** (not gradients as originally thought)
2. All interactive elements have **hover and active states**
3. Form inputs use **consistent 40px height**
4. Buttons use **mixed-case text** with 600-700 weight
5. Consistent border radius: 4-8px across component types
6. Dual shadow layers provide depth for buttons
7. Light neutral border color (#d9d9d9) for default states

---

## Color Extraction Summary

### Extracted Colors (Raw)
The Soft UI Dashboard components use these colors in raw format:

| Element | Color | Hex | RGB | Usage |
|---------|-------|-----|-----|-------|
| Button Fill (default) | Dark Navy | #000000 | 0, 0, 0 | Primary action background |
| Input Background | White | #ffffff | 255, 255, 255 | Form field surface |
| Input Border (default) | Light Gray | #d9d9d9 | 217, 217, 217 | Unfocused state |
| Checkbox (checked) | Dark Navy | #252f40 | 37, 47, 64 | Selected state |
| Button Stroke | Medium Gray | #949494 | 148, 148, 148 | Border outline |
| Text (default) | Black | #000000 | 0, 0, 0 | Primary text |
| Text (inverse) | White | #ffffff | 255, 255, 255 | On dark backgrounds |

### Semantic Token Mapping

**Recommend the following token definitions:**

```css
/* Primary Colors */
--color-primary: #252f40;          /* Dark navy - primary actions */
--color-primary-light: #4a5568;    /* Lighter variant */

/* Neutral Colors */
--color-white: #ffffff;             /* Backgrounds, text on dark */
--color-black: #000000;             /* Primary text */
--color-border: #d9d9d9;            /* Form element borders */
--color-border-dark: #949494;       /* Darker borders */

/* Text Colors */
--color-text: #000000;              /* Primary text */
--color-text-inverse: #ffffff;      /* Text on dark backgrounds */
--color-text-muted: #999999;        /* Placeholder, disabled text */

/* Surface Colors */
--color-surface: #ffffff;           /* Form backgrounds */
--color-background: #f5f5f5;        /* Page background */

/* Effects */
--shadow-button: 0 2px 4px rgba(0,0,0,0.1),
                 0 4px 6px rgba(0,0,0,0.1);
--shadow-input: 0 0 0 3px rgba(37,47,64,0.1);
--shadow-checkbox: 0 0 0 2px rgba(37,47,64,0.3);

/* Border Radius */
--radius-sm: 4px;      /* Checkboxes, small buttons */
--radius-md: 6px;      /* Inputs */
--radius-lg: 8px;      /* Buttons */
```

### Design System Fingerprint

- **Color Palette**: Monochromatic + light gray borders (SoftUI minimal approach)
- **Button Style**: Solid dark fills with soft shadow (not gradient)
- **Form Style**: Light backgrounds with subtle borders
- **Interactive States**: Handled through color/shadow changes
- **Overall**: Clean, minimal, accessibility-focused

---

## Component Architecture

### Hierarchy
```
Form Components
├── Button (18 variants)
│   ├── Size (small, medium, large)
│   ├── Style (default, outline, with-icon, icon-only)
│   └── State (default, hover, active)
├── Input (3 variants)
│   ├── State (default, active, error*, disabled*)
│   └── Props (placeholder, label, helper text)
└── Checkbox (2 variants)
    └── State (default, active, indeterminate*, disabled*)
```

### Shared Patterns
- **Padding**: Vertical = 8-16px, Horizontal = 12-24px
- **Borders**: 1-2px solid, primary or neutral colors
- **Shadows**: Drop shadow with blur 4-6px and y-offset
- **Transitions**: 150ms ease-in-out on all interactive properties
- **Focus**: 2px outline in primary color

---

## Implementation Checklist

- [ ] Map extracted colors to semantic token names
- [ ] Create CSS custom properties for all tokens
- [ ] Generate React components with variant support
- [ ] Implement hover/active/focus states
- [ ] Test keyboard navigation for accessibility
- [ ] Verify color contrast (WCAG AA)
- [ ] Create component storybook documentation
- [ ] Build design system preview HTML
