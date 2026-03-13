# Profile Layout Specification

> **Frame:** Profile
> **Dimensions:** 1440 × 1409px
> **Pattern:** sidebar-content with grid layout
> **Figma Node ID:** 0:2505

## Layout Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         NAVBAR (45px)                           │
├──────────┬──────────────────────────────────────────────────────┤
│          │  ┌─────────────────────────────────────────────────┐ │
│ SIDEBAR  │  │    Profile Banner (gradient wave, 308px)        │ │
│ (273px)  │  │  ┌──────┐ Alec Thompson                         │ │
│          │  │  │Avatar│ CEO / Co-Founder                      │ │
│          │  │  └──────┘ [Overview] [Teams] [Projects]        │ │
│          │  └─────────────────────────────────────────────────┘ │
│          │                                                      │
│ Dashboard│  ┌──────────────┬──────────────┬──────────────────┐  │
│ • Tables │  │ Platform     │ Profile      │ Conversations    │  │
│ • Billing│  │ Settings     │ Information  │ (5 items)        │  │
│ • VR     │  │ (6 toggles)  │ (bio + info) │                  │  │
│ • RTL    │  │              │              │                  │  │
│          │  └──────────────┴──────────────┴──────────────────┘  │
│ ACCOUNT  │                                                      │
│ • Profile│  ┌──────────────────────────────────────────────────┐│
│ • Sign In│  │ Projects (grid, 3 columns)                      ││
│ • Sign Up│  │ ┌────────┐ ┌────────┐ ┌────────┐ [Upload]    ││
│          │  │ │Modern  │ │Scandina│ │Minimali│               ││
│          │  │ │        │ │  vian  │ │   st   │               ││
│          │  │ └────────┘ └────────┘ └────────┘               ││
│          │  └──────────────────────────────────────────────────┘│
├──────────┴──────────────────────────────────────────────────────┤
│  Footer                                                         │
└─────────────────────────────────────────────────────────────────┘
```

## Sections Overview

| Section | Type | Width | Height | Notes |
|---------|------|-------|--------|-------|
| navbar | navigation | 1440px | 45px | Top navigation bar |
| sidebar | navigation | 273px | 1007px | Left sidebar with menu |
| profile-banner | hero | ~1121px | 308px | Gradient wave background |
| profile-header | info | ~1121px | 114px | Avatar, name, role, stats |
| settings-grid | layout | ~1073px | 430px | 3-column grid: platform, profile, conversations |
| projects | card-grid | ~1120px | 486px | 3-column project cards |
| footer | footer | ~1118px | 20px | Copyright and links |

---

## Component Details

### 1. Navbar (Top Navigation)
- **Height:** 45px
- **Background:** White with subtle shadow
- **Content:** Navigation links, search, user menu
- **Color Scheme:** Secondary gray text on white
- **Padding:** Horizontal spacing with icons

### 2. Sidebar (Left Navigation)
- **Width:** 273px
- **Height:** 1007px
- **Background:** `linear-gradient(310deg, #141727, #3a416f)` (dark blue gradient)
- **Menu Items:** Dashboard, Tables, Billing, VR, RTL
- **Account Section:** Profile, Sign In, Sign Up
- **Icon Style:** Light gray icons on dark background
- **Rounded Corners:** Soft-rounded menu items

### 3. Profile Banner & Header
**Section Height:** ~422px total (308px banner + 114px info)

#### Banner (308px)
- **Background:** Gradient wave image (purple-pink gradient at 310°)
- **Content:** Decorative shapes, wave patterns
- **Overflow:** Profile header overlaps banner

#### Header (114px)
- **Avatar:** 74×81px circular image, white border, positioned at top-left
- **Name:** "Alec Thompson" - bold, large text (~33px)
- **Role:** "CEO / Co-Founder" - secondary gray, body text
- **Stat Buttons:** Three buttons in top-right
  - Overview | Teams | Projects
  - Each ~113px × 34px, secondary background

### 4. Three-Column Content Grid (430px height)

**Grid Layout:** `grid-template-columns: 1fr 1fr 1fr` with gaps

#### Column 1: Platform Settings (358px width)
- **Card Background:** White (#ffffff)
- **Card Radius:** 16px
- **Card Shadow:** `0 20px 27px 0 rgba(0,0,0,0.05)`
- **Content:**
  - Title: "Platform Settings" (18px, bold)
  - Section Group 1: "ACCOUNT"
    - Toggle: "Email me when someone follows me" (ON)
    - Toggle: "Email me when someone answers me" (OFF)
    - Toggle: "Email me when someone mentions me" (ON)
  - Section Group 2: "APPLICATION"
    - Toggle: "New launches and projects" (OFF)
    - Toggle: "Monthly product updates" (ON)
    - Toggle: "Subscribe to newsletter" (ON)
- **Toggle Switch Style:**
  - Active: Gradient primary (310° angle)
  - Inactive: Gray-300
  - Height: 22px, Width: 40px
  - Smooth circular indicator

#### Column 2: Profile Information (356px width)
- **Card Background:** White (#ffffff)
- **Card Radius:** 16px
- **Card Shadow:** `0 20px 27px 0 rgba(0,0,0,0.05)`
- **Content:**
  - Title: "Profile Information" (18px, bold)
  - Edit Icon: Pencil button in header
  - Bio: "Hi, I'm Alec Thompson, Decisions: If you can't decide..."
  - Info Fields (read-only display):
    - Name: Sarah Emily Jacob
    - Mobile: (44) 123 1234 123
    - Email: sarahemily@mail.com
    - Location: USA
  - Social Links: Facebook, Twitter, Instagram icons

#### Column 3: Conversations (357px width)
- **Card Background:** White (#ffffff)
- **Card Radius:** 16px
- **Card Shadow:** `0 20px 27px 0 rgba(0,0,0,0.05)`
- **Content:**
  - Title: "Conversations" (18px, bold)
  - List Items (5 total):
    - Sophie B: "Hi! I need more information..."
    - Anne Marie: "Awesome work, can you..."
    - Ivanna: "About files I can..."
    - Peterson: "Have a great afternoon..."
    - Nick Daniel: "Hi! I need more information..."
  - Each Item:
    - Avatar: 24px circular, gray background
    - Name: Bold text
    - Message Preview: Secondary gray, truncated
    - Reply Button: Badge with primary color, text "REPLY"

### 5. Projects Section (486px height)
- **Width:** ~1120px
- **Background:** Light gray card surface
- **Card Radius:** 16px
- **Card Shadow:** `0 20px 27px 0 rgba(0,0,0,0.05)`

**Header:**
- **Title:** "Projects" (18px, bold)
- **Subtitle:** "Architects Design Houses"
- **Action Button:** "Upload New Project" (secondary style)

**Grid Layout:** 3 columns, equal width, with gaps

**Project Cards (4 total):**
1. **Modern**
   - Image: Landscape placeholder (4:3 aspect)
   - Title: "Modern" (bold)
   - Description: "As Uber works through..." (secondary text)
   - Badge: "IN PROGRESS" (primary color)
   - Action: "VIEW PROJECT" button

2. **Scandinavian**
   - Image: Landscape placeholder (4:3 aspect)
   - Title: "Scandinavian" (bold)
   - Description: "Music is something that..." (secondary text)
   - Badge: "IN PROGRESS" (primary color)
   - Action: "VIEW PROJECT" button

3. **Minimalist**
   - Image: Landscape placeholder (4:3 aspect)
   - Title: "Minimalist" (bold)
   - Description: "Different people have different..." (secondary text)
   - Badge: "IN PROGRESS" (primary color)
   - Action: "VIEW PROJECT" button

4. **Upload Placeholder**
   - Dashed border: #d2d6da
   - Center icon: Plus sign
   - Label: "Upload New Project"
   - Interactive: Clickable to upload

### 6. Footer (20px height)
- **Background:** Light gray background
- **Content:**
  - Copyright: "© 2021, made with ❤ by Creative Tim"
  - Links: Creative Tim, About Us, Blog, Licenses
  - Link Color: Secondary gray with hover state
- **Alignment:** Center aligned
- **Font Size:** 12px

---

## Color & Styling

### Color Tokens Used
| Element | Token | Hex |
|---------|-------|-----|
| Primary Accent | `--color-primary` | #cb0c9f |
| Secondary Text | `--color-secondary` | #8392ab |
| Success/Status | `--color-success` | #82d616 |
| Card Background | `--color-surface` | #ffffff |
| Page Background | `--color-background` | #f8f9fa |
| Sidebar Gradient | `--gradient-dark` | 310°: #141727→#3a416f |
| Primary Gradient | `--gradient-primary` | 310°: #7928ca→#ff0080 |

### Spacing Used
| Token | Value | Usage |
|-------|-------|-------|
| `--spacing-1` | 4px | Micro gaps |
| `--spacing-2` | 8px | Button padding |
| `--spacing-3` | 12px | Component padding |
| `--spacing-4` | 16px | Section gaps |
| `--spacing-6` | 24px | Major margins |
| `--spacing-8` | 32px | Layout margins |

### Effects
| Effect | Value | Usage |
|--------|-------|-------|
| Card Shadow | `0 20px 27px 0 rgba(0,0,0,0.05)` | Cards |
| Card Radius | 16px | Cards, project images |
| Button Radius | 8px | Buttons, badges |
| Avatar Radius | 100px | Circular avatars |
| Input Radius | 8px | Form fields |

---

## Typography

| Element | Size | Weight | Color |
|---------|------|--------|-------|
| Profile Name | 33px | Bold (600) | Primary gray (#344767) |
| Profile Role | 19px | Regular (400) | Secondary gray (#8392ab) |
| Section Title | 18px | Semibold (600) | Primary gray |
| Toggle Label | 14px | Regular (400) | Primary gray |
| Bio Text | 14px | Regular (400) | Secondary gray |
| Message Preview | 13px | Regular (400) | Secondary gray |
| Footer Text | 12px | Regular (400) | Secondary gray |
| Button Text | 12px | Semibold (600) | Primary color or white |

---

## Component Instances

| Component | Count | Location |
|-----------|-------|----------|
| Card (surface) | 4 | Settings, Profile Info, Conversations, Projects |
| Toggle Switch | 6 | Platform Settings |
| Avatar | 6+ | Profile header, Conversations list |
| Button (primary) | 5+ | "VIEW PROJECT", action buttons |
| Button (secondary) | 3+ | Stat buttons, "Upload New Project" |
| Badge | 5+ | "REPLY" badges, status badges |
| Text Input | 4 | Profile Information fields |
| Icon | 20+ | Navigation, actions, decorations |

---

## Responsive Considerations

**Desktop (1440px):** Full three-column grid, sidebar visible
**Tablet (1024px):** Sidebar collapses, single column grid
**Mobile (375px):** Stack all sections vertically, full-width cards

---

## Implementation Notes

1. **Sidebar Glassmorphism:** Subtle backdrop blur effect (10px) on sidebar
2. **Profile Banner:** Full-width gradient banner with wave SVG overlay
3. **Grid Gaps:** Consistent 24px spacing between cards
4. **Card Padding:** 16px internal padding on all cards
5. **Avatar Borders:** White 3px border on profile header avatar
6. **Toggle Transitions:** Smooth 200ms transitions on state change
7. **Conversation List:** Vertical scroll if content exceeds ~300px
8. **Project Images:** Maintain 4:3 aspect ratio with object-fit: cover
