# Component Specifications

> Extracted from: Soft UI Dashboard Free (Community)
> Generated: 2026-01-18
> Components: 22 (standalone components)

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

| Size | Width | Height | Notes |
|------|-------|--------|-------|
| small | 104-108px | 32px | Compact button |
| medium | 104-108px | 40-42px | Standard button |
| large | 185-189px | 47-48px | Prominent CTA |
| with-icon | 127-131px | 40-41px | Button with leading icon |
| just-icon | 40-44px | 40-44px | Icon-only button (square) |
| outline | 104-114px | 40-44px | Border-only style |

### Token Usage

**Colors:**
- Background: `var(--gradient-primary)` or `var(--color-surface)`
- Text: `var(--color-text-inverse)` (filled), `var(--color-text-primary)` (outline)
- Border: `var(--color-primary)` (outline variant)

**Typography:**
- Font: `var(--font-family-sans)`
- Size: `var(--font-size-sm)` (12px)
- Weight: `var(--font-weight-bold)` (700)
- Transform: uppercase

**Effects:**
- Border radius: `var(--radius-DEFAULT)` (6px)
- Shadow: `var(--shadow-button)` on hover

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
- Background: `var(--color-surface)`
- Border: `var(--color-border-input)` (default), `var(--color-primary)` (active)
- Text: `var(--color-text-primary)`
- Placeholder: `var(--color-text-muted)`

**Typography:**
- Font: `var(--font-family-sans)`
- Size: `var(--font-size-base)` (14px)
- Weight: `var(--font-weight-regular)` (400)

**Effects:**
- Border radius: `var(--radius-md)` (8px)
- Focus shadow: `var(--shadow-input-focus)`

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

| State | Width | Height |
|-------|-------|--------|
| active | 20px | 20px |

### Token Usage

**Colors:**
- Background (checked): `var(--gradient-primary)`
- Checkmark: `var(--color-text-inverse)`
- Border (unchecked): `var(--color-border)`

**Effects:**
- Border radius: `var(--radius-sm)` (4px)

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

1. Components use **gradient backgrounds** for primary actions (Soft UI signature style)
2. All interactive elements have **hover and active states**
3. Form inputs use **consistent 40px height**
4. Buttons use **uppercase text** with bold weight
5. Border radius is consistent across component types
