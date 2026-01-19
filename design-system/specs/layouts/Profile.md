# Profile Layout

> Frame: Profile
> Dimensions: 1440×1409px
> Pattern: sidebar-content
> Figma Node ID: 0:2505

## Structure

```
┌─────────────────────────────────────────────────────────────────┐
│  ┌─────────────────────────────────────────────────────────┐   │
│  │           Profile Banner (gradient wave image)           │   │
│  │  ┌──────┐                                                │   │
│  │  │Avatar│ Alec Thompson                                  │   │
│  │  └──────┘ CEO / Co-Founder                              │   │
│  │                              [Overview] [Teams] [Projects]│   │
│  └─────────────────────────────────────────────────────────┘   │
├──────────┬──────────────────────────────────────────────────────┤
│          │                                                      │
│ Sidebar  │  ┌───────────┐┌──────────────┐┌──────────────────┐  │
│          │  │ Platform  ││ Profile      ││ Conversations    │  │
│ • Dashboard │ │ Settings  ││ Information  ││ (5 items)        │  │
│ • Tables  │  │ (toggles) ││ (bio + info) ││                  │  │
│ • Billing │  └───────────┘└──────────────┘└──────────────────┘  │
│ • VR      │                                                     │
│ • RTL     │  ┌────────────────────────────────────────────────┐│
│          │  │ Projects                   [Upload New Project]││
│ ACCOUNT  │  │ ┌────────┐ ┌────────┐ ┌────────┐ ┌──────────┐ ││
│ • Profile◄│  │ │ Modern │ │Scandina│ │Minimali│ │ + Upload │ ││
│ • Sign In│  │ │        │ │  vian  │ │   st   │ │          │ ││
│ • Sign Up│  │ └────────┘ └────────┘ └────────┘ └──────────┘ ││
│          │  └────────────────────────────────────────────────┘│
├──────────┴──────────────────────────────────────────────────────┤
│  Footer                                                         │
└─────────────────────────────────────────────────────────────────┘
```

## Sections

| Section | Type | Dimensions | Notes |
|---------|------|------------|-------|
| profile-banner | hero | 1121×308 | Gradient wave background |
| avatar | image | 74×81 | Circular profile photo |
| platform-settings | card | ~350px | Toggle settings |
| profile-information | card | ~350px | Bio and contact info |
| conversations | list | ~350px | Message previews |
| projects | card-grid | ~1100px | Project cards grid |
| footer | footer | 1118×20 | Copyright |

## Profile Banner

Hero section with gradient wave background image.

| Element | Details |
|---------|---------|
| Background | Pink/purple gradient wave image |
| Avatar | 74×81px circular photo |
| Name | "Alec Thompson" (H4, bold) |
| Role | "CEO / Co-Founder" (body, muted) |
| Tabs | Overview, Teams, Projects |

## Platform Settings

Toggle switches for notification preferences.

### Account Section
| Setting | Default |
|---------|---------|
| Email me when someone follows me | ON |
| Email me when someone answers me | OFF |
| Email me when someone mentions me | ON |

### Application Section
| Setting | Default |
|---------|---------|
| New launches and projects | OFF |
| Monthly product updates | ON |
| Subscribe to newsletter | ON |

## Profile Information

User bio and contact details.

| Field | Value |
|-------|-------|
| Bio | "Hi, I'm Alec Thompson, Decisions: If you can't decide..." |
| Full Name | Sarah Emily Jacob |
| Mobile | (44) 123 1234 123 |
| Email | sarahemily@mail.com |
| Location | USA |
| Social | Facebook, Twitter, Instagram icons |

**Action:** Edit icon in header

## Conversations

List of recent message threads.

| Avatar | Name | Preview |
|--------|------|---------|
| Sophie B | "Hi! I need more information..." |
| Anne Marie | "Awesome work, can you..." |
| Ivanna | "About files I can..." |
| Peterson | "Have a great afternoon..." |
| Nick Daniel | "Hi! I need more information..." |

Each item has a REPLY action.

## Projects Section

Grid of project cards with images.

| Project | Description | Image | Action |
|---------|-------------|-------|--------|
| Modern | "As Uber works through..." | Interior photo | VIEW PROJECT |
| Scandinavian | "Music is something that..." | Interior photo | VIEW PROJECT |
| Minimalist | "Different people have different..." | Interior photo | VIEW PROJECT |
| (placeholder) | Upload New Project | Dashed border | + icon |

**Header Action:** Upload New Project

## Token Usage

| Element | Token |
|---------|-------|
| Banner gradient | `--gradient-hero` (custom wave) |
| Card background | `--color-surface` |
| Toggle active | `--gradient-primary` |
| Toggle inactive | `--color-gray-300` |
| Avatar border | `--color-surface` |
| Social icon color | `--color-text-muted` |

## Component Instances

- Profile Banner ×1
- Avatar ×6
- Toggle Switch ×6
- Info Card ×1
- Conversation Item ×5
- Project Card ×4
- Button (reply) ×5
