# Design System Project

A three-phase workflow for extracting design tokens from Figma and generating production-ready React components.

## Workflow Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Phase 1: EXTRACT                                                           │
│  Extract tokens and specs from Figma → design-system/                       │
│  Commands: /extract-design, /sync, /preview-tokens                          │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  Phase 2: GENERATE                                                          │
│  Generate React components from specs → app/src/components/ui/              │
│  Commands: /gen-component, /build-screen                                    │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  Phase 3: BUILD                                                             │
│  Build your app using tokens and generated components                       │
│  Location: app/                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Project Structure

```
my-design-system-project/
├── design-system/              # Phase 1 output (framework-neutral)
│   ├── tokens/                 # CSS custom properties
│   │   ├── colors.css
│   │   ├── typography.css
│   │   ├── spacing.css
│   │   └── effects.css
│   ├── specs/                  # Markdown specifications
│   │   ├── components.md
│   │   └── layouts.md
│   └── preview/                # HTML previews
│
├── app/                        # Your application
│   ├── design-system/          # Installed tokens (copy)
│   ├── src/
│   │   ├── app/                # Next.js pages
│   │   ├── components/ui/      # Phase 2 output (generated)
│   │   └── lib/
│   └── CLAUDE.md               # App-specific rules
│
├── .claude/
│   ├── commands/               # Slash command definitions
│   └── skills/                 # Extraction procedures
│
└── CLAUDE.md                   # This file
```

## Commands

### Phase 1: Extract

| Command | Description |
|---------|-------------|
| `/extract-design <url>` | Extract design system from Figma |
| `/sync` | Sync changes from Figma |
| `/sync --check` | Check for changes without applying |
| `/preview-tokens` | Show token preview |

### Install

| Command | Description |
|---------|-------------|
| `/install-design-system [path]` | Copy design system into app |

### Phase 2: Generate

| Command | Description |
|---------|-------------|
| `/gen-component <name>` | Generate single component |
| `/gen-component --all` | Generate all components |
| `/build-screen <name>` | Build screen from layout spec |

## Typical Workflow

```bash
# 1. Extract from Figma
/extract-design https://figma.com/file/...

# 2. Install into your app
/install-design-system app/

# 3. Generate components
/gen-component --all

# 4. Build screens
/build-screen Dashboard

# 5. Run the app
cd app && npm run dev
```

## Design Token Rules

1. **NEVER hardcode colors** — Use `var(--color-*)` tokens
2. **NEVER hardcode spacing** — Use `var(--spacing-*)` tokens
3. **NEVER hardcode effects** — Use `var(--shadow-*)`, `var(--radius-*)` tokens
4. **ALWAYS check specs** — Read `design-system/specs/` before building
5. **ALWAYS use components** — Import from `src/components/ui/`

## Quick Token Reference

### Colors
```css
var(--color-primary)           /* Primary brand */
var(--color-success)           /* Success states */
var(--color-error)             /* Error states */
var(--color-warning)           /* Warning states */
```

### Spacing
```css
var(--spacing-1)   /* 4px */
var(--spacing-2)   /* 8px */
var(--spacing-3)   /* 12px */
var(--spacing-4)   /* 16px */
var(--spacing-6)   /* 24px */
var(--spacing-8)   /* 32px */
```

### Effects
```css
var(--radius-DEFAULT)  /* 6px - buttons */
var(--radius-md)       /* 8px - inputs */
var(--radius-2xl)      /* 14px - cards */
var(--shadow-sm)       /* buttons */
var(--shadow-md)       /* cards */
```
