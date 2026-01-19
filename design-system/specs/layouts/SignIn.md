# Sign In Layout

> Frame: Sign In
> Dimensions: 1440×1137px
> Pattern: split-screen (auth)
> Figma Node ID: 0:2957

## Structure

```
┌─────────────────────────────────────────────────────────────────┐
│  Navbar (logo + links: Dashboard, Profile, Sign Up, Sign In)    │
│                                            [FREE DOWNLOAD]       │
├────────────────────────────────┬────────────────────────────────┤
│                                │                                │
│                                │                                │
│    ┌─────────────────────┐    │                                │
│    │      Sign In        │    │     Gradient Wave Image       │
│    │                     │    │     (3D abstract)              │
│    │  Email              │    │                                │
│    │  [                ] │    │                                │
│    │                     │    │                                │
│    │  Password           │    │                                │
│    │  [                ] │    │                                │
│    │                     │    │                                │
│    │  [x] Remember me    │    │                                │
│    │                     │    │                                │
│    │  [    SIGN IN    ]  │    │                                │
│    │                     │    │                                │
│    │  Don't have account?│    │                                │
│    │  Sign Up            │    │                                │
│    └─────────────────────┘    │                                │
│                                │                                │
├────────────────────────────────┴────────────────────────────────┤
│  Footer (Company links + Social icons + Copyright)              │
└─────────────────────────────────────────────────────────────────┘
```

## Sections

| Section | Type | Dimensions | Notes |
|---------|------|------------|-------|
| navbar | navigation | 1174×70 | Top navigation bar |
| hero-image | decoration | 754×876 | Right side gradient image |
| sign-in-form | form | 361×320 | Left side form card |
| footer | footer | 583×132 | Links and social icons |

## Navbar

Transparent navigation bar overlaying background.

| Element | Details |
|---------|---------|
| Logo | "Soft UI Dashboard" text |
| Links | Dashboard, Profile, Sign Up, Sign In |
| CTA | "FREE DOWNLOAD" button (outlined) |

## Sign In Form

Centered form for user authentication.

### Header
- **Title:** "Sign In" (H3, 36px)
- **Subtitle:** "Enter your email and password to sign in"

### Form Fields

| Field | Type | Placeholder |
|-------|------|-------------|
| Email | email | Email |
| Password | password | Password |

### Additional Elements
- **Remember me:** Toggle switch
- **Submit:** "SIGN IN" primary button
- **Footer:** "Don't have an account? Sign Up" (link)

## Hero Image

Right side decorative element.

| Property | Value |
|----------|-------|
| Type | Gradient wave image |
| Colors | Pink, purple, blue, orange (3D waves) |
| Position | Right side, full height |
| Purpose | Visual interest, brand element |

## Footer

Bottom section with links and social.

### Link Sections
| Section | Links |
|---------|-------|
| Company | Company, About Us, Team, Products, Blog, Pricing |

### Social Icons
- Dribbble
- Twitter
- Instagram
- Pinterest
- GitHub

### Copyright
"Copyright © 2021 Soft by Creative Tim."

## Token Usage

| Element | Token |
|---------|-------|
| Page background | `--color-surface` |
| Form title | `--color-text-dark` |
| Form subtitle | `--color-text-muted` |
| Input border | `--color-border-input` |
| Input focus | `--color-primary` + `--shadow-input-focus` |
| Button gradient | `--gradient-primary` |
| Link color | `--color-primary` |
| Footer text | `--color-text-muted` |

## Form Styling

```css
.auth-form {
  max-width: 361px;
  padding: var(--spacing-8);
}

.auth-form h3 {
  font-size: var(--font-size-4xl);
  font-weight: var(--font-weight-bold);
  margin-bottom: var(--spacing-2);
}

.auth-form .subtitle {
  color: var(--color-text-muted);
  margin-bottom: var(--spacing-6);
}

.auth-form input {
  width: 100%;
  height: 40px;
  padding: var(--spacing-2) var(--spacing-3);
  border: 1px solid var(--color-border-input);
  border-radius: var(--radius-md);
}

.auth-form button {
  width: 100%;
  height: 40px;
  background: var(--gradient-primary);
  color: white;
  border-radius: var(--radius-DEFAULT);
  font-weight: var(--font-weight-bold);
}
```

## Component Instances

- Input ×2
- Toggle Switch ×1
- Button ×2 (SIGN IN, FREE DOWNLOAD)
- Text Link ×7
- Social Icon ×5
