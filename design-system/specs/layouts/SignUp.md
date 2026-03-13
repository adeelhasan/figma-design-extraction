# Sign Up Layout

> Frame: Sign Up
> Dimensions: 1440×1252px
> Pattern: full-header auth (stacked)
> Figma Node ID: 0:2877

## Structure

```
┌─────────────────────────────────────────────────────────────────┐
│  Navbar (logo + links: Dashboard, Profile, Sign Up, Sign In)    │
│                                            [FREE DOWNLOAD]       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│        ┌──────────────────────────────────────────────┐        │
│        │            Gradient Wave Background           │        │
│        │                                              │        │
│        │               Sign Up                        │        │
│        │    Use these awesome forms to login or      │        │
│        │    create new account in your project        │        │
│        │                                              │        │
│        └──────────────────────────────────────────────┘        │
│                                                                 │
│                    ┌───────────────────────┐                   │
│                    │  Register with        │                   │
│                    │  [f] [🍎] [G]          │                   │
│                    │  ──────── or ────────  │                   │
│                    │                       │                   │
│                    │  Name                 │                   │
│                    │  [                  ] │                   │
│                    │  Email                │                   │
│                    │  [                  ] │                   │
│                    │  Password             │                   │
│                    │  [                  ] │                   │
│                    │                       │                   │
│                    │  [✓] I agree to Terms │                   │
│                    │                       │                   │
│                    │  [     SIGN UP     ]  │                   │
│                    │                       │                   │
│                    │  Already have account?│                   │
│                    │  Sign In              │                   │
│                    └───────────────────────┘                   │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  Footer (Company links + Copyright)                             │
└─────────────────────────────────────────────────────────────────┘
```

## Sections

| Section | Type | Dimensions | Notes |
|---------|------|------------|-------|
| navbar | navigation | 1440×70 | Top navigation bar |
| hero-background | decoration | 1440×549 | Gradient wave header with curved elements |
| sign-up-header | header | 1440×~120 | Title and subtitle overlay on hero |
| sign-up-form | card | 409×~549 | Centered form card (overlaps hero at -100px) |
| footer | footer | 1440×132 | Company links and copyright |

## Navbar

Transparent navigation overlaying gradient background.

| Element | Details |
|---------|---------|
| Logo | "Soft UI Dashboard" text |
| Links | Dashboard, Profile, Sign Up (active), Sign In |
| CTA | "FREE DOWNLOAD" button (secondary outline style) |

## Hero Background

Full-width dark gradient header section with decorative wave elements.

| Property | Value |
|----------|-------|
| Type | Dark gradient background with curved wave elements |
| Colors | Gradient from navy blue (#141727) to slate purple (#3a416f) |
| Angle | 310deg (primary gradient angle) |
| Height | 549px |
| Elements | Curved decorative shapes, gradient masks |
| Purpose | Creates depth, visual interest, and brand identity |

## Sign Up Header

Centered text overlay on gradient background.

| Element | Style |
|---------|-------|
| Title | "Sign Up" (H2, white, 50px, bold) |
| Subtitle | "Use these awesome forms to login or create new account in your project for free." (body, white at 80% opacity) |
| Positioning | Absolute, centered horizontally and vertically in hero section |

## Sign Up Form Card

White card with centered registration form, positioned to overlap the hero background.

### Card Styling
- **Background:** White (`var(--color-surface)`)
- **Border Radius:** 16px (`var(--radius-xl)`)
- **Box Shadow:** Soft multi-layer shadow (`var(--shadow-card)`)
- **Padding:** 24px (`var(--spacing-6)`)
- **Max Width:** 409px
- **Positioning:** Absolute, centered horizontally, overlaps hero at -100px margin-top

### Social Sign Up

Header: "Register with"

| Provider | Type |
|----------|------|
| Facebook | Icon button |
| Apple | Icon button |
| Google | Icon button |

Divider: "or" text with horizontal lines

### Form Fields

| Field | Type | Label | Placeholder |
|-------|------|-------|-------------|
| Name | text | Name | Name |
| Email | email | Email | Email |
| Password | password | Password | Password |

### Form Agreement
- Checkbox: "I agree the Terms and Conditions" (active by default)

### Submit
- Button: "SIGN UP" (primary gradient, full width)

### Footer Link
- "Already have an account? Sign In" (link to /signin)

## Footer

Standard footer with company links and copyright.

### Links
Company, About Us, Team, Products, Blog, Pricing

### Copyright
"Copyright © 2021 Soft by Creative Tim."

## Token Usage

| Element | Token |
|---------|-------|
| Hero gradient | `--gradient-dark` |
| Hero background color | #141727 to #3a416f |
| Form card bg | `--color-surface` |
| Form shadow | `--shadow-card` |
| Form radius | `--radius-xl` |
| Button radius | `--radius-DEFAULT` |
| Input radius | `--radius-md` |
| Title on dark | white (rgba text overlay) |
| Social buttons | `--color-border`, `--color-surface` |
| Input styling | border: 1px solid var(--color-border-input), padding: var(--spacing-2) var(--spacing-3) |
| Submit button | `--gradient-primary` |
| Link color | `--color-primary` |

## Form Card Layout (CSS Reference)

```css
.signup-card {
  max-width: 409px;
  background: var(--color-surface);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-card);
  padding: var(--spacing-6);
  margin: -100px auto 0;
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  top: 549px;
  z-index: 10;
}

.signup-form-header {
  text-align: center;
  margin-bottom: var(--spacing-4);
  font-weight: var(--font-weight-semibold);
}

.social-buttons {
  display: flex;
  justify-content: center;
  gap: var(--spacing-3);
  margin-bottom: var(--spacing-4);
}

.social-button {
  width: 64px;
  height: 44px;
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-surface);
  cursor: pointer;
}

.divider {
  display: flex;
  align-items: center;
  margin: var(--spacing-4) 0;
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--color-border-light);
}

.divider span {
  padding: 0 var(--spacing-3);
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}

.form-field {
  margin-bottom: var(--spacing-4);
}

.form-field label {
  display: block;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  margin-bottom: var(--spacing-2);
  color: var(--color-text-primary);
}

.form-field input {
  width: 100%;
  height: 40px;
  padding: var(--spacing-2) var(--spacing-3);
  border: 1px solid var(--color-border-input);
  border-radius: var(--radius-md);
  font-size: var(--font-size-md);
}

.checkbox-group {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  margin-bottom: var(--spacing-6);
}

.checkbox-group input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.checkbox-group label {
  margin: 0;
  font-size: var(--font-size-sm);
  cursor: pointer;
  color: var(--color-text-primary);
}

.submit-button {
  width: 100%;
  height: 40px;
  background: var(--gradient-primary);
  color: white;
  border: none;
  border-radius: var(--radius-DEFAULT);
  font-weight: var(--font-weight-bold);
  font-size: var(--font-size-sm);
  cursor: pointer;
  margin-bottom: var(--spacing-4);
}

.form-footer {
  text-align: center;
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}

.form-footer a {
  color: var(--color-primary);
  text-decoration: none;
  font-weight: var(--font-weight-semibold);
}

.form-footer a:hover {
  text-decoration: underline;
}
```

## Component Instances

- Input ×3 (name, email, password)
- Checkbox ×1 (terms agreement)
- Social Button ×3 (facebook, apple, google)
- Button ×2 (SIGN UP, FREE DOWNLOAD)
- Text Link ×7 (navbar links, form footer link, footer links)

## Key Differences from Sign In

| Aspect | Sign In | Sign Up |
|--------|---------|---------|
| Layout | Side-by-side split screen | Full-width stacked (hero header) |
| Hero | Right column with image | Top section with gradient waves |
| Form Position | Left side, fixed | Center, overlapping hero |
| Form Fields | 2 (email, password) | 3 (name, email, password) |
| Social Login | None | Facebook, Apple, Google |
| Terms | Remember me toggle | Terms & conditions checkbox |
| Card Overlap | No | Yes (overlaps hero at -100px) |

## Responsive Behavior

For mobile/tablet versions (not in current Figma design, but reference for future):
- Hero section height reduces proportionally
- Form card takes full width with horizontal padding
- Navbar becomes hamburger menu
- All sections stack vertically
