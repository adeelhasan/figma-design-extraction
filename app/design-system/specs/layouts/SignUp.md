# SignUp — Layout Specification

## Frame Metadata

| Property | Value |
|----------|-------|
| Figma Frame ID | `0:2877` |
| Dimensions | 1440 × 1252 px |
| Viewport | Desktop |
| Layout Mode | None (absolute positioning) |
| Design System | Soft UI Dashboard Free |

## Shells

| Shell | Position | CSS Class |
|-------|----------|-----------|
| `navbar-auth` | sticky-top | `shell-navbar-auth` |
| `footer-auth` | bottom | `shell-footer-auth` |

The `navbar` and `footer` sections within the Figma frame are handled by these shells.

## Visual Structure (ASCII)

```
┌──────────────────────────────────────────────────────────────────┐
│  [navbar-auth] Soft UI Dashboard  Dashboard Profile Sign Up ...  │  h: 34px
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│       ██████████████ bg-signup.png (dark overlay) ████████████  │  h: ~549px
│                                                                  │
│                        Sign Up                                   │
│       Use these awesome forms to login or create new account...  │
│                                                                  │
│              ┌─────────────────────────────────┐                 │
│              │         Register with            │                 │
│              │  [fb]  [apple]  [google]         │                 │
│              │           or                     │                 │
│              │  ┌────────────────────────────┐  │                 │
│              │  │  Name                      │  │  h: ~549px      │
│              │  └────────────────────────────┘  │  (card center) │
│              │  ┌────────────────────────────┐  │                 │
│              │  │  Email                     │  │                 │
│              │  └────────────────────────────┘  │                 │
│              │  ┌────────────────────────────┐  │                 │
│              │  │  Password                  │  │                 │
│              │  └────────────────────────────┘  │                 │
│              │  ☑ I agree the Terms and Cond.   │                 │
│              │  ┌────────────────────────────┐  │                 │
│              │  │         SIGN UP             │  │                 │
│              │  └────────────────────────────┘  │                 │
│              │  Already have an account? Sign In │                 │
│              └─────────────────────────────────┘                 │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│  [footer-auth]  Company  About Us  Team  Products  Blog  Pricing │  h: 132px
│                       © 2021 Soft by Creative Tim                │
└──────────────────────────────────────────────────────────────────┘
```

## Sections Table

| ID | Name | Figma Node | Bounds (x, y, w, h) | Role |
|----|------|-----------|---------------------|------|
| `section-image` | image | `0:2879` | 16, 16, 1408, 549 | Hero banner with bg-signup photo + dark gradient overlay |
| `section-signup-title` | Sign Up | `0:2917` | 611, 170, 171, 65 | H1 hero title, white, centered |
| `section-subtitle` | Use these awesome fo | `0:2916` | 478, 241, 480, 50 | Hero subtitle text, white, centered |
| `section-form` | form | `3:8` | 515, 377, 409, 549 | White form card overlapping the hero bottom and page body |

## Grid System

This screen uses a single-column centered layout — not a CSS grid. The key layout concern is the overlap between the hero banner and the form card.

```css
body {
  width: 1440px;
  background: var(--color-background);
  position: relative;
}

/* Hero section: full-width, rounded, with real photo */
.hero-section {
  position: relative;
  width: 1408px;
  height: 549px;
  margin: 16px auto 0;
  border-radius: var(--radius-5);   /* 12px */
  overflow: hidden;
  background-image: url('../../assets/images/photos/bg-signup.png');
  background-size: cover;
  background-position: center;
}

/* Dark gradient overlay on hero */
.hero-overlay {
  position: absolute;
  inset: 0;
  background: var(--gradient-dark);
  opacity: 0.75;
  border-radius: var(--radius-5);
}

/* Form card: centered, overlaps hero bottom */
.form-card {
  position: relative;
  width: 409px;
  margin: -172px auto 0;   /* pulls card up over hero */
  background: var(--color-surface);
  border-radius: var(--radius-5);    /* 12px */
  box-shadow: 0px 20px 27px rgba(0, 0, 0, 0.05);
  padding: var(--spacing-8) var(--spacing-6);
  z-index: 2;
}
```

## Components Used

| Component | Figma Name | Count |
|-----------|-----------|-------|
| Input field (active/focus) | `input/default` | 1 (Name — pink focus ring) |
| Input field (default) | `input/default copy` | 1 (Email) |
| Input field (default) | `input/default copy 2` | 1 (Password) |
| Checkbox (active) | `checkbox/active` | 1 |
| Button | `button/default` | 1 (SIGN UP, dark gradient) |
| Social button | `facebook`, `apple`, `google` | 3 |

## Token Usage

### Colors
| Token | Usage |
|-------|-------|
| `var(--color-surface)` | Form card background, social button backgrounds |
| `var(--color-background)` | Page background |
| `var(--color-text-primary)` | Form headings (`#252f40`), checkbox fill |
| `var(--color-text-secondary)` | `or` separator, social button borders |
| `var(--color-divider)` | Email/Password input borders |

### Gradients
| Token | Usage |
|-------|-------|
| `var(--gradient-dark)` | Hero overlay filter, SIGN UP button |

### Effects
| Token | Usage |
|-------|-------|
| `var(--shadow-lg)` → `0px 20px 27px rgba(0,0,0,0.05)` | Form card shadow |
| `var(--shadow-focus)` → `0 0 0 2px rgba(226,147,211,0.50)` | Name input active border glow |

### Typography
| Token | Usage |
|-------|-------|
| `var(--font-size-5xl)` (48px) | "Sign Up" hero heading |
| `var(--font-size-base)` (16px) | Hero subtitle |
| `var(--font-size-lg)` (20px) | "Register with" subheading |
| `var(--font-size-sm)` (14px) | Input labels, checkbox text, button, footer links |
| `var(--font-weight-bold)` | "Sign Up" title, "SIGN UP" button, "Sign In" link |
| `var(--font-weight-semibold)` | "Register with" |
| `var(--font-weight-regular)` | Hero subtitle, "Already have an account?" |

### Radius
| Token | Usage |
|-------|-------|
| `var(--radius-5)` = 12px | Hero image rounding, form card |
| `var(--radius-md)` = 8px | Social buttons, SIGN UP button |
| `var(--radius-3)` = 6px | Input fields |
| `var(--radius-sm)` = 4px | Checkbox |

## Image Assets

| Asset | Path | Usage |
|-------|------|-------|
| `bg-signup.png` | `../../assets/images/photos/bg-signup.png` | Hero background photo (`hasOriginal: true`) |
