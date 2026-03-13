# Component Specifications

> Design system: **Soft UI Dashboard Free (Community)**
> Extracted: 2026-03-11
> Components documented: 3 (Button, Input, Checkbox)
> Total component nodes: 22

---

## Button

### Component Type
| Property | Value |
|----------|-------|
| Category | form |
| Type | Button |

### Variants

The Button has three structural kinds, each with multiple size and state variants.

#### Kind: Solid (default gradient fill)
| Property | Values | Default |
|----------|--------|---------|
| size | small, medium, large | medium |
| state | default, hover, active | default |

#### Kind: Outline
| Property | Values | Default |
|----------|--------|---------|
| state | default, hover, active | default |

#### Kind: With Icon
| Property | Values | Default |
|----------|--------|---------|
| state | default, hover | default |

#### Kind: Icon Only
| Property | Values | Default |
|----------|--------|---------|
| state | default, hover, active | default |

### Dimensions
| Size | Width | Height | Notes |
|------|-------|--------|-------|
| small | 104px | 32px | Compact action |
| medium | 104px | 40px | Standard action |
| large | 185px | 47px | Primary CTA |
| outline | 104px | 40px | Secondary action |
| with-icon | 127px | 40px | Labeled + icon |
| icon-only | 40px | 40px | Square icon button |

### Token Usage
- **Background**: `var(--gradient-primary)` — linear-gradient(135deg, #ff0080 → #7928ca) for solid buttons
- **Background**: transparent with `var(--color-primary)` (#cb0c9f) border + text for outline variant
- **Text color**: white (#ffffff) on solid; `var(--color-primary)` on outline
- **Typography**: OpenSans Bold, 14px (uppercase label text)
- **Effects**: `DROP_SHADOW` — two-layer soft shadow on all states
  - Layer 1: 0 2px 4px -1px rgba(0,0,0,0.07)
  - Layer 2: 0 4px 6px -1px rgba(0,0,0,0.12)
- **Border radius**: `var(--radius-md)` — 8px

### Slots
| Slot | Type | Required |
|------|------|----------|
| label | text (uppercase) | yes (except icon-only) |
| icon | SVG/vector (spaceship icon in prototype) | no (required for with-icon and icon-only) |

### Behavior Notes
- Hover state: slightly expanded dimensions (+2–4px) indicating scale or padding shift
- Active state: reduced opacity (~85%) on gradient layer
- Outline buttons use `var(--color-primary)` for both border stroke and label text

---

## Input

### Component Type
| Property | Value |
|----------|-------|
| Category | form |
| Type | Input |

### Variants
| Property | Values | Default |
|----------|--------|---------|
| state | default, active | default |

### Dimensions
| Size | Width | Height | Padding |
|------|-------|--------|---------|
| default | 361px | 40px | ~12px horizontal |
| active | 361px | 40px | ~12px horizontal |

### Token Usage
- **Background**: white (#ffffff) — both states
- **Border (default)**: `var(--gray-400)` (#d9d9d9) — 1px solid, muted gray
- **Border (active)**: `#e293d3` — soft primary-tinted pink (derived from `var(--color-primary)`)
- **Focus ring (active)**: `DROP_SHADOW` spread:2px, color #e293d3 at ~50% opacity — glow ring effect
- **Text (default)**: `var(--gray-400)` (#d9d9d9) — placeholder style, SemiBold weight
- **Text (active)**: `var(--color-dark)` (#252f40) — user-entered value, Regular weight
- **Typography**: OpenSans, 14px
  - Default/placeholder: weight 600 (SemiBold), color `var(--gray-400)`
  - Active/value: weight 400 (Regular), color `var(--color-dark)`
- **Effects**: `DROP_SHADOW` — primary-colored glow on active state only
- **Border radius**: `var(--radius-DEFAULT)` — 6px

### Slots
| Slot | Type | Required |
|------|------|----------|
| placeholder | text | no |
| value | text | no |

### Behavior Notes
- Active state shows a primary-tinted border and glow shadow — distinctly soft-UI focus indicator
- No icon slots observed in these component variants (icon inputs likely composed separately)

---

## Checkbox

### Component Type
| Property | Value |
|----------|-------|
| Category | form |
| Type | Checkbox |

### Variants
| Property | Values | Default |
|----------|--------|---------|
| state | active (checked) | active |

> Note: Only the `active` (checked) state is defined in the Symbols page. A `default` (unchecked) state is implied but not packaged.

### Dimensions
| Size | Width | Height |
|------|-------|--------|
| default | 20px | 20px |

### Token Usage
- **Background (checked)**: `var(--color-dark)` (#252f40) — dark fill indicates selected state
- **Check mark**: white (#ffffff) stroke, round cap/join — vector path
- **Border (unchecked, implied)**: `var(--gray-400)` (#d9d9d9)
- **Typography**: none — standalone control
- **Effects**: none observed
- **Border radius**: 4px (slightly rounded square — `var(--radius-sm)` equivalent)

### Slots
| Slot | Type | Required |
|------|------|----------|
| check mark | vector/SVG | shown when active |

### Behavior Notes
- Uses `var(--color-dark)` for the checked background rather than `var(--color-primary)` — intentional dark/neutral choice
- Check mark is a vector path with `strokeCap: ROUND` and `strokeJoin: ROUND` for a smooth tick
- Typical usage: paired with a label text node (not part of this component)

---

## Design Context

### Color Tokens (referenced above)
| Token | Hex | Role |
|-------|-----|------|
| `--color-primary` | #cb0c9f | Brand primary — CTAs, toggles, active states |
| `--color-dark` | #252f40 | Dark text, checked states, headings |
| `--color-body` | #67748e | Body text, descriptions |
| `--color-secondary` | #8392ab | Muted labels, borders |
| `--color-success` | #82d616 | Success indicators |
| `--color-warning` | #fbcf33 | Warning indicators |
| `--color-error` | #ea0606 | Error/destructive |
| `--color-info` | #17c1e8 | Info states |
| `--gray-400` | #d2d6da | Input borders (default), placeholder text |

### Gradient Tokens
| Token | Stops | Usage |
|-------|-------|-------|
| `--gradient-primary` | #ff0080 → #7928ca (135deg) | Solid buttons, primary CTAs |
| `--gradient-dark` | #3a416f → #141727 (135deg) | Dark surfaces, sidebar |
| `--gradient-info` | #21d4fd → #2152ff (135deg) | Info cards |
| `--gradient-success` | #98ec2d → #17ad37 (135deg) | Success indicators |
| `--gradient-warning` | #fbcf33 → #f53939 (135deg) | Warning elements |
| `--gradient-error` | #ff667c → #ea0606 (135deg) | Error/destructive |
| `--gradient-secondary` | #a8b8d8 → #627594 (135deg) | Secondary buttons |
| `--gradient-light` | #ebeff4 → #ced4da (135deg) | Light backgrounds |

### Radius Tokens
| Token | Value | Used by |
|-------|-------|---------|
| `--radius-sm` / 4px | 4px | Checkbox |
| `--radius-DEFAULT` / 6px | 6px | Input fields |
| `--radius-md` / 8px | 8px | Buttons |
| `--radius-2xl` / 16px | 16px | Cards |
| `--radius-pill` / 35px | 35px | Pill badges |

### Shadow Tokens
| Token | CSS | Used by |
|-------|-----|---------|
| `--shadow-sm` (button) | 0 2px 4px -1px rgba(0,0,0,.07), 0 4px 6px -1px rgba(0,0,0,.12) | All button states |
| `--shadow-focus-primary` | 0 0 0 2px rgba(226,147,211,0.5) | Input active focus ring |
| `--shadow-soft` | 0 20px 27px 0 rgba(0,0,0,0.05) | Cards |
| `--shadow-card` | 0 2px 6px rgba(0,0,0,0.05) | Card surfaces |
