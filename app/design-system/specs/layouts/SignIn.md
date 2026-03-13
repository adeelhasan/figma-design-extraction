# Sign In — Layout Spec

## Frame Metadata

| Property | Value |
|----------|-------|
| Figma Frame ID | `0:2957` |
| Dimensions | 1440 × 1137 px |
| Viewport | Desktop |
| Layout Pattern | Two-column split (form + image) |
| Shells | `navbar-auth`, `footer-auth` |

---

## Grid System

| Property | Value |
|----------|-------|
| Columns | 2 (equal halves, 1fr each) |
| Gap | 0 |
| Margin | 0 |
| Column Width | ~720px each |

---

## ASCII Structure Diagram

```
┌─────────────────────────────────────────────────────────────┐
│  [navbar-auth] Soft UI Dashboard | Dashboard Profile Sign Up Sign In | FREE DOWNLOAD  │
├─────────────────────────────────┬───────────────────────────┤
│                                 │                           │
│   form-area (col 1)             │   image (col 2)           │
│                                 │                           │
│   Sign In  ← gradient heading   │   [curved6.png]           │
│   Enter your email and          │   colorful abstract       │
│   password to sign in           │   wave image              │
│                                 │                           │
│   Email ← label                 │                           │
│   ┌─────────────────────────┐   │                           │
│   │ Email          (active)  │   │                           │
│   └─────────────────────────┘   │                           │
│                                 │                           │
│   Password ← label              │                           │
│   ┌─────────────────────────┐   │                           │
│   │ Password      (default) │   │                           │
│   └─────────────────────────┘   │                           │
│                                 │                           │
│   [●] Remember me               │                           │
│                                 │                           │
│   ┌─────────────────────────┐   │                           │
│   │       SIGN IN           │   │                           │
│   └─────────────────────────┘   │                           │
│                                 │                           │
│   Don't have an account? Sign Up│                           │
│                                 │                           │
├─────────────────────────────────┴───────────────────────────┤
│  [footer-auth]  ◎ 🐦 📌 🐙 | Company  About Us  Team  Products  Blog  Pricing  │
│                 Copyright © 2021 Soft by Creative Tim.       │
└─────────────────────────────────────────────────────────────┘
```

---

## Sections Table

| Section | Grid Column | Grid Row | x | y | Width | Height | Description |
|---------|-------------|----------|---|---|-------|--------|-------------|
| form-area | 1 / 2 | 1 / 2 | 0 | 34 | 720 | 970 | Sign-in heading, subtitle, email/password inputs, toggle, button, sign-up link |
| image | 2 / 3 | 1 / 2 | 720 | 0 | 720 | 1137 | Decorative abstract wave image (curved6.png), full-height |

**Shells (excluded from content grid):**

| Shell | Position | Height | Description |
|-------|----------|--------|-------------|
| navbar-auth | sticky-top | 34px | Translucent pill navbar — brand name, nav links, FREE DOWNLOAD button |
| footer-auth | bottom | 132px | Social icons row + footer nav links + copyright |

---

## Content Details

### form-area

- **Heading:** "Sign In" — `font-size: var(--font-size-3xl)` (36px), `font-weight: var(--font-weight-bold)`, gradient fill `var(--gradient-info)` (cyan→blue, 135deg)
- **Subtitle:** "Enter your email and password to sign in" — `font-size: var(--font-size-lg)` (20px), `color: var(--color-text-muted)`
- **Email Input (active state):**
  - Label: "Email" — 12px semibold
  - Input: white background, `border-radius: 6px`, pink focus ring `box-shadow: 0 0 0 2px rgba(226,147,211,0.50)`, `border: 1px solid #e293d3`
  - Placeholder: "Email"
- **Password Input (default state):**
  - Label: "Password" — 12px semibold
  - Input: white background, `border-radius: 6px`, `border: 1px solid var(--color-divider)`
  - Placeholder: "Password"
- **Toggle:** "Remember me" — pill toggle (active/on), dark navy track `#3a416f`, white thumb
- **Button:** "SIGN IN" — full-width, `background: var(--gradient-info)`, `border-radius: 8px`, white bold text, `box-shadow: var(--shadow-sm), var(--shadow-md)`
- **Footer link:** "Don't have an account?" (semibold, muted) + "Sign Up" (bold, gradient text)

### image

- **Asset:** `curved6.png` — full-height abstract colorful wave photo
- **Path:** `../../assets/images/photos/curved6.png`
- `background-size: cover`, `background-position: center`
- Masked/clipped to the right half of the frame

---

## CSS Grid Template

```css
.main-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  min-height: calc(100vh - 34px);
  width: 1440px;
}
```

---

## Components Used

| Component | Instances | Source |
|-----------|-----------|--------|
| input/active | 1 | form — email field (focused state) |
| input/default | 1 | form — password field (default state) |
| switch/on | 1 | form — remember me toggle |
| button/default | 1 | form — SIGN IN button with gradient |
| navbar-auth | 1 | Shell — sticky translucent navbar |
| footer-auth | 1 | Shell — social icons + footer links |

---

## Token Usage

### Colors
| Token | Value | Usage |
|-------|-------|-------|
| `var(--gradient-info)` | `linear-gradient(135deg, #21d4fd 0%, #2152ff 100%)` | "Sign In" heading text fill, SIGN IN button background |
| `var(--color-text-muted)` | `#67748e` | Subtitle text, "Don't have an account?" text |
| `var(--color-text-primary)` | `#252f40` | "Remember me" label |
| `var(--color-surface)` | `#ffffff` | Input backgrounds, form area background |
| `var(--color-divider)` | `#d9d9d9` | Default input border |
| `var(--shadow-focus)` | `0 0 0 2px rgba(226,147,211,0.50)` | Active input focus ring |

### Typography
| Token | Value | Usage |
|-------|-------|-------|
| `var(--font-family-primary)` | `'Open Sans', sans-serif` | All text |
| `var(--font-size-3xl)` | `2.25rem` / 36px | "Sign In" heading |
| `var(--font-size-lg)` | `1.25rem` / 20px | Subtitle text |
| `var(--font-size-sm)` | `0.875rem` / 14px | Input placeholder, button text, footer link |
| `var(--font-size-2xs)` | `0.75rem` / 12px | Input labels |
| `var(--font-weight-bold)` | `700` | Heading, button text, "Sign Up" link |
| `var(--font-weight-semibold)` | `600` | Input labels, "Don't have an account?" |
| `var(--font-weight-regular)` | `400` | Subtitle, input placeholder |

### Spacing
| Token | Value | Usage |
|-------|-------|-------|
| `var(--spacing-6)` | `1.5rem` / 24px | Form section horizontal padding |
| `var(--spacing-4)` | `1rem` / 16px | Gap between form elements |
| `var(--spacing-8)` | `2rem` / 32px | Top padding of form content |

### Effects
| Token | Value | Usage |
|-------|-------|-------|
| `var(--radius-DEFAULT)` | `6px` | Input border radius |
| `var(--radius-button)` | `8px` | Button border radius |
| `var(--shadow-sm)` | `0 2px 4px -1px rgba(0,0,0,0.07)` | Button shadow layer 1 |
| `var(--shadow-md)` | `0 4px 6px -1px rgba(0,0,0,0.12)` | Button shadow layer 2 |
