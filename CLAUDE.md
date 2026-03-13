# Design System Project

Extract design tokens from Figma → Generate React components → Build your app.

## Workflow

```
EXTRACT ──→ GENERATE ──→ BUILD
Figma      Components    App
```

| Phase | Command | Output |
|-------|---------|--------|
| Extract | `/extract-design <figma-url>` | `design-system/` |
| Generate | `/gen-component <name>` | `app/src/components/ui/` |
| Build | `/build-screen <name>` | `app/src/app/` |

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

## Figma Source File Requirements

The extraction pipeline requires **editable Figma source files** with real component nodes, text layers, and structured frames. It does not work well with:

- **"Preview" files** — These often contain pages rendered as flattened image fills (RECTANGLE nodes with IMAGE fills) rather than structured component trees. The pipeline will still extract tokens and any structured frames correctly, but flattened pages will only yield screenshot images, not extractable layouts.
- **Presentation canvases** — A single wide frame (e.g., 7560px) containing multiple pages arranged side-by-side is treated as one screen. The individual pages inside it cannot be extracted as separate layouts if they are image fills.

**What to do:** If extraction produces image-only screens, ask the designer for the editable source file (not the preview/handoff version). Tokens, colors, and typography will still extract correctly from any file — it's only the screen layouts that require real nodes.

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
