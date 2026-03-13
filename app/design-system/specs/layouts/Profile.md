# Profile Layout Spec

## Frame Metadata

| Property | Value |
|----------|-------|
| Frame ID | 0:2505 |
| Dimensions | 1440 × 1409 px |
| Viewport | Desktop |
| Layout Mode | None (absolute positioning) |

## Shell Elements

| Shell | Position | Width | Height |
|-------|----------|-------|--------|
| sidebar | fixed-left | 248px | 100vh |
| navbar | sticky-top | 1192px | 45px |
| footer | bottom | 1192px | 20px |

## Content Area

- **Origin**: x=248, y=45 (after sidebar and navbar)
- **Width**: 1192px total, 1144px effective (24px padding each side)
- **Height**: ~1364px
- **Padding**: 24px all sides

## Grid System

- **Columns**: 12
- **Column Gap**: 24px
- **Margin**: 24px left/right

## ASCII Layout Diagram

```
┌─────────────────────────────────────────────────────────┐
│  SIDEBAR (248px fixed)  │  NAVBAR (sticky, 45px)        │
├─────────────────────────┼───────────────────────────────┤
│                         │                               │
│  S                      │  [ROW 1: Profile Banner]      │
│  I                      │  ██████████████████████████   │
│  D                      │  curved0 background image      │
│  E                      │  + pink/purple gradient        │
│  B                      │                               │
│  A                      ├───────────────────────────────┤
│  R                      │  [ROW 2: Profile Identity]    │
│                         │  Avatar | Alec Thompson        │
│                         │  CEO/Co-Founder  Overview/     │
│                         │  Teams/Projects tabs          │
│                         │                               │
│                         ├───────────┬───────────┬───────┤
│                         │ [col 1-4] │ [col 5-8] │[9-12] │
│                         │ Platform  │ Profile   │ Conv- │
│                         │ Settings  │ Info      │ ersns │
│                         │           │           │       │
│                         ├───────────┴───────────┴───────┤
│                         │  [ROW 4: Projects]            │
│                         │  [card-1][card-2][card-3][up] │
│                         │                               │
├─────────────────────────┴───────────────────────────────┤
│  FOOTER (© 2021, made with ♥ by Creative Tim)           │
└─────────────────────────────────────────────────────────┘
```

## Sections Table

| Section ID | Name | Grid Column | Grid Row | Col Span | Row Span | Width | Height |
|------------|------|-------------|----------|----------|----------|-------|--------|
| profile-header | profile header banner | 1 / 13 | 1 / 2 | 12 | 1 | 1144px | 308px |
| profile-identity | profile identity bar | 1 / 13 | 2 / 3 | 12 | 1 | 1144px | 130px |
| platform-settings | platform settings | 1 / 5 | 3 / 4 | 4 | 1 | 358px | 427px |
| profile-information | profile information | 5 / 9 | 3 / 4 | 4 | 1 | 356px | 428px |
| conversations | conversations | 9 / 13 | 3 / 4 | 4 | 1 | 357px | 430px |
| projects | projects | 1 / 13 | 4 / 5 | 12 | 1 | 1144px | 486px |

## CSS Grid Template

```css
.main-content {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  grid-template-rows: auto auto auto auto;
  gap: 24px;
  padding: 24px;
  margin-left: 248px;
}

#profile-header { grid-column: 1 / 13; grid-row: 1 / 2; }
#profile-identity { grid-column: 1 / 13; grid-row: 2 / 3; }
#platform-settings { grid-column: 1 / 5; grid-row: 3 / 4; }
#profile-information { grid-column: 5 / 9; grid-row: 3 / 4; }
#conversations { grid-column: 9 / 13; grid-row: 3 / 4; }
#projects { grid-column: 1 / 13; grid-row: 4 / 5; }
```

## Section Details

### profile-header
- **Type**: Banner / hero image area
- **Pattern**: Full-width hero with gradient background (curved0 image + pink/purple gradient overlay)
- **Background**: `curved0.png` image with `var(--gradient-primary)` overlay (opacity ~0.5)
- **Border Radius**: 12px
- **Shadow**: `var(--shadow-lg)` (0px 20px 27px rgba(0,0,0,0.05))

### profile-identity
- **Type**: Profile header bar
- **Pattern**: Semi-transparent white bar with backdrop blur
- **Background**: `var(--color-surface)` at 80% opacity with blur effect
- **Content**: Avatar image (bruce-mars.png), "Alec Thompson" (24px semibold), "CEO / Co-Founder" (14px), tab buttons (Overview, Teams, Projects)

### platform-settings
- **Type**: Settings card
- **Pattern**: White card with toggle switches in two groups (ACCOUNT, APPLICATION)
- **Background**: `var(--color-surface)`
- **Border Radius**: 12px
- **Shadow**: `0px 20px 27px rgba(0,0,0,0.05)`
- **Sections**:
  - ACCOUNT: 3 toggle items
  - APPLICATION: 3 toggle items

### profile-information
- **Type**: Profile info card
- **Pattern**: White card with bio text, labeled fields, social icons
- **Background**: `var(--color-surface)`
- **Border Radius**: 12px
- **Shadow**: `0px 20px 27px rgba(0,0,0,0.05)`
- **Divider**: horizontal rule between bio and fields

### conversations
- **Type**: Conversation list card
- **Pattern**: White card with 5 conversation rows (avatar, name, snippet, REPLY button)
- **Background**: `var(--color-surface)`
- **Border Radius**: 12px
- **Shadow**: `0px 20px 27px rgba(0,0,0,0.05)`

### projects
- **Type**: Projects gallery card
- **Pattern**: White card with 3 project cards + upload slot
- **Background**: `var(--color-surface)`
- **Border Radius**: 12px
- **Shadow**: `0px 20px 27px rgba(0,0,0,0.05)`
- **Project Cards**: Each has image, title, description, VIEW PROJECT button, member avatars

## Components Used

- Toggle switch (on/off states)
- Avatar image (rounded corners)
- Project card (image + metadata + button)
- Conversation row (avatar + text + reply button)
- Profile field row (label + value)
- Tab navigation bar

## Token Usage

### Colors
- `var(--color-surface)` — Card backgrounds
- `var(--color-background)` — Page background
- `var(--color-text-primary)` — Headings (Alec Thompson, section titles)
- `var(--color-text-muted)` — Labels, subtitles (CEO/Co-Founder)
- `var(--color-text-secondary)` — Tab items (Teams, Projects)
- `var(--color-primary)` — VIEW PROJECT button border
- `var(--color-border)` — Dividers, borders
- `var(--gray-200)` — Profile info divider

### Gradients
- `var(--gradient-primary)` — Header banner overlay, toggle "on" state background

### Typography
- `var(--font-size-xl)` / `var(--font-weight-semibold)` — Profile name (24px)
- `var(--font-size-base)` / `var(--font-weight-semibold)` — Section titles (16px)
- `var(--font-size-sm)` — Body text, toggle labels (14px)
- `var(--font-size-2xs)` — Conversation snippets, REPLY (12px)

### Effects
- `var(--shadow-lg)` — Card containers (0px 20px 27px rgba(0,0,0,0.05))
- `var(--shadow-md)` — Avatar images, toggle knobs
- `var(--radius-card)` — Card border radius (12px/16px)
- `var(--radius-md)` — Button, avatar borders (8px)
