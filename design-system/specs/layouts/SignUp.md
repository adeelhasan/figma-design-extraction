# Sign Up Layout

> Frame: Sign Up
> Dimensions: 1440×1252px
> Pattern: split-screen (auth)
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
| navbar | navigation | 1269×34 | Top navigation |
| hero-background | decoration | 1408×549 | Gradient wave header |
| sign-up-header | header | ~480px | Title and subtitle |
| sign-up-form | card | 409×549 | Centered form card |
| footer | footer | 583×132 | Links and copyright |

## Navbar

Transparent navigation overlaying gradient background.

| Element | Details |
|---------|---------|
| Logo | "Soft UI Dashboard" |
| Links | Dashboard, Profile, Sign Up (active), Sign In |
| CTA | "FREE DOWNLOAD" button |

## Hero Background

Full-width gradient header section.

| Property | Value |
|----------|-------|
| Type | Dark gradient wave |
| Colors | Navy blue to purple gradient |
| Height | ~549px |
| Purpose | Creates depth, brand identity |

## Sign Up Header

Centered text on gradient background.

| Element | Style |
|---------|-------|
| Title | "Sign Up" (H2, white, 50px) |
| Subtitle | "Use these awesome forms..." (body, white/80%) |

## Sign Up Form Card

White card with registration form.

### Social Sign Up

| Provider | Icon |
|----------|------|
| Facebook | [f] |
| Apple | [🍎] |
| Google | [G] |

Divider: "or"

### Form Fields

| Field | Type | Label |
|-------|------|-------|
| Name | text | Name |
| Email | email | Email |
| Password | password | Password |

### Agreement
- Checkbox: "I agree the Terms and Conditions"

### Submit
- Button: "SIGN UP" (primary, full width)

### Footer Link
- "Already have an account? Sign In"

## Footer

Standard footer with company links.

### Links
Company, About Us, Team, Products, Blog, Pricing

### Copyright
"Copyright © 2021 Soft by Creative Tim."

## Token Usage

| Element | Token |
|---------|-------|
| Hero gradient | `--gradient-dark` |
| Form card bg | `--color-surface` |
| Form shadow | `--shadow-card` |
| Form radius | `--radius-xl` |
| Title on dark | `--color-text-inverse` |
| Social buttons | `--color-border`, `--color-surface` |
| Input styling | Same as Sign In |
| Submit button | `--gradient-primary` |
| Link color | `--color-primary` |

## Form Card Styling

```css
.signup-card {
  max-width: 409px;
  background: var(--color-surface);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-card);
  padding: var(--spacing-6);
  margin-top: -100px; /* Overlaps hero */
}

.social-buttons {
  display: flex;
  justify-content: center;
  gap: var(--spacing-3);
}

.social-button {
  width: 64px;
  height: 44px;
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
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
}
```

## Component Instances

- Input ×3
- Checkbox ×1
- Social Button ×3
- Button ×2 (SIGN UP, FREE DOWNLOAD)
- Text Link ×7

## Key Differences from Sign In

| Aspect | Sign In | Sign Up |
|--------|---------|---------|
| Layout | Side-by-side | Stacked/centered |
| Hero | Right column | Full header |
| Fields | 2 (email, password) | 3 (name, email, password) |
| Social | None | Facebook, Apple, Google |
| Terms | Remember me toggle | Terms checkbox |
