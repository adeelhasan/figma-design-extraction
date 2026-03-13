# SignIn Layout Specification

**Frame ID:** 0:2957
**Dimensions:** 1440px × 1137px
**Background:** White (#ffffff)
**Pattern:** Split-screen authentication page with sidebar-free layout

## Overview

The SignIn screen presents a full-width split layout optimized for authentication. The left column contains the sign-in form with email/password inputs, a remember-me toggle, and sign-up link. The right column features a decorative gradient wave image. Navigation appears in a top navbar with company branding and primary CTA. Footer spans full width with company links and social icons.

## Layout Structure

```
┌──────────────────────────────────────────────────────────────────┐
│ NAVBAR (70px): Logo | Links (Dashboard, Profile, Sign Up, Sign In) [FREE DOWNLOAD] │
├──────────────────────────────┬──────────────────────────────────┤
│                              │                                  │
│  FORM COLUMN (50%)           │  IMAGE COLUMN (50%)              │
│  ┌────────────────────────┐  │  ┌──────────────────────────────┤
│  │ "Sign In" (gradient)   │  │  │                              │
│  │ Subtitle (secondary)   │  │  │  Colorful gradient wave      │
│  │                        │  │  │  (magenta, cyan, yellow)     │
│  │ Email Input            │  │  │                              │
│  │ Password Input         │  │  │                              │
│  │ [x] Remember me        │  │  │                              │
│  │ [SIGN IN Button]       │  │  │                              │
│  │ Sign Up Link           │  │  │                              │
│  └────────────────────────┘  │  └──────────────────────────────┤
│                              │                                  │
├──────────────────────────────┴──────────────────────────────────┤
│ FOOTER (132px): Copyright | Social Icons | Company Links        │
└──────────────────────────────────────────────────────────────────┘
```

## Sections

| Section | Type | Dimensions | Location |
|---------|------|------------|----------|
| navbar | navigation | 1440×70 | Top |
| form-column | form | 720×867 | Left |
| image-column | image | 720×867 | Right |
| footer | footer | 1440×132 | Bottom |

## Navbar (Top)

**Height:** 70px
**Background:** White (#ffffff)
**Border:** Bottom border with light gray

**Elements:**
- **Logo:** "Soft UI Dashboard" text, dark gray color
- **Nav Links:** Dashboard, Profile, Sign Up, Sign In (dark text, clickable)
- **CTA Button:** "FREE DOWNLOAD" with gradient-primary background, white text

## Form Column (Left)

**Width:** ~50% (361px content)
**Padding:** 60px 80px (vertical × horizontal)
**Alignment:** Centered content

### Title
- **Text:** "Sign In"
- **Font Size:** 48px
- **Font Weight:** 700 (bold)
- **Color:** Gradient primary (310deg: #7928ca → #ff0080)
- **Margin Bottom:** 16px

### Subtitle
- **Text:** "Enter your email and password to sign in"
- **Font Size:** 16px
- **Color:** Secondary gray (#8392ab)
- **Margin Bottom:** 32px

### Email Input Field
- **Label:** "Email"
- **Type:** email
- **Placeholder:** "Email"
- **Width:** 361px
- **Height:** 40px
- **Border:** 1px solid #d2d6da
- **Border Radius:** 8px
- **Padding:** 12px 16px
- **Background:** White
- **Margin Bottom:** 24px
- **Focus State:** Border color changes to primary, soft shadow applied

### Password Input Field
- **Label:** "Password"
- **Type:** password
- **Placeholder:** "Password"
- **Width:** 361px
- **Height:** 40px
- **Border:** 1px solid #d2d6da
- **Border Radius:** 8px
- **Padding:** 12px 16px
- **Background:** White
- **Margin Bottom:** 24px

### Remember Me Toggle
- **Label:** "Remember me"
- **Toggle Size:** 42×20px
- **On State Background:** #3a414f (dark blue-gray)
- **Off State Background:** #dee2e6 (light gray)
- **Toggle Indicator:** 16px white circle, positioned left/right based on state
- **Margin Bottom:** 24px

### Sign In Button
- **Label:** "SIGN IN"
- **Width:** 361px
- **Height:** 40px
- **Background:** Gradient primary (310deg: #7928ca → #ff0080)
- **Text Color:** White (#ffffff)
- **Font Weight:** 700
- **Border Radius:** 8px
- **Margin:** 24px 0
- **Hover State:** Slight upward translation

### Sign Up Link
- **Text:** "Don't have an account? Sign Up"
- **Alignment:** Center
- **Primary Text Color:** Secondary gray (#8392ab)
- **Link Color:** Gradient primary
- **Font Size:** 14px

## Image Column (Right)

**Width:** ~50% (753.5px)
**Height:** 876px
**Background:** Colorful gradient wave pattern
**Content:** Decorative abstract 3D wave image
**Gradient:** Multi-stop gradient (magenta → cyan → yellow → green, vibrant colors)
**Animation:** Subtle wave/rotation animation (optional)

## Footer

**Height:** 132px
**Background:** White (#ffffff)
**Border Top:** 1px solid #e9ecef
**Padding:** 24px 40px
**Layout:** Flex with space-between

### Copyright Section
- **Text:** "Copyright © 2021 Soft by Creative Tim."
- **Color:** Secondary gray (#8392ab)
- **Font Size:** 14px
- **Flex:** 1

### Social Icons Section
- **Icons:** Facebook, Twitter, LinkedIn, Pinterest, GitHub
- **Color:** Secondary gray (#8392ab)
- **Size:** 16px font
- **Flex:** 1
- **Justify:** Center
- **Gap:** 16px

### Links Section
- **Flex:** 1
- **Justify:** Flex-end
- **Gap Between Groups:** 40px

**Link Groups:**
1. **Company**
   - About Us
   - Team
   - Products

2. **Resources**
   - Blog
   - Pricing

- **Text Color:** Secondary gray (#8392ab)
- **Font Size:** 14px
- **Hover State:** Underline

## Semantic Tokens Used

| Element | Token Value | Color |
|---------|-------------|-------|
| Form Title | gradient-primary | 310deg: #7928ca → #ff0080 |
| Form Subtitle | var(--color-secondary) | #8392ab |
| Input Borders | var(--input-border) | #d2d6da |
| Button Background | gradient-primary | 310deg: #7928ca → #ff0080 |
| Button Text | White | #ffffff |
| Toggle On | #3a414f | Dark blue-gray |
| Page Background | White | #ffffff |
| Footer Text | var(--color-secondary) | #8392ab |

## Border Radius Values

- Input fields: 8px
- Buttons: 8px
- Cards: 16px (if used)

## Box Shadows

- Card shadows: Multi-layer (0 2px 4px -1px rgba(0,0,0,0.07), 0 4px 6px -1px rgba(0,0,0,0.12))
- Input focus: Soft glow effect

## Typography

- **Font Family:** Segoe UI, Tahoma, Geneva, Verdana, sans-serif
- **Heading (Sign In):** 48px, weight 700
- **Subheading:** 16px, weight 500
- **Labels:** 14px, weight 600
- **Body Text:** 14px, weight 400

## Interactive Elements

| Element | Type | Count |
|---------|------|-------|
| Text Input Fields | input | 2 |
| Toggle Switch | toggle | 1 |
| Buttons | button | 2 (Sign In, Free Download) |
| Text Links | link | 7 (nav links + footer links) |
| Social Icons | icon link | 5 |

## Component Instances

- **Navbar** ×1
- **Input Field** ×2
- **Toggle Switch** ×1
- **Button (Primary)** ×1
- **Button (Gradient)** ×1
- **Text Link** ×7
- **Social Icon** ×5
- **Decorative Image** ×1
