# Design System Project

Extract design tokens from Figma, generate React components, and build your app — powered by [Claude Code](https://claude.com/claude-code).

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

## Prerequisites

- [Claude Code](https://claude.com/claude-code) CLI
- Figma Personal Access Token (see [Setup](#figma-access-token))
- Node.js 18+ (for the app)

## Figma Access Token

1. Log in to [Figma](https://www.figma.com)
2. Go to **Settings** > **Account** > **Personal access tokens**
3. Generate a new token (starts with `figd_`)
4. Add it to your environment:

```bash
echo 'FIGMA_ACCESS_TOKEN=figd_your_token_here' >> .env.local
```

## Quick Start

```bash
# 1. Extract design system from Figma
/extract-design https://figma.com/file/...

# 2. Install tokens into your app
/install-design-system app/

# 3. Generate React components from specs
/gen-component --all

# 4. Build screens from layout specs
/build-screen Dashboard

# 5. Run the app
cd app && npm run dev
```

## Project Structure

```
my-design-system-project/
├── design-system/              # Extracted design system (framework-neutral)
│   ├── tokens/                 # CSS custom properties
│   ├── specs/                  # Component & layout specifications
│   ├── assets/                 # Icons & image manifests
│   └── preview/                # HTML previews for human review
│
├── app/                        # Next.js application
│   ├── design-system/          # Installed tokens (copy)
│   └── src/
│       ├── app/                # Pages (built from layout specs)
│       └── components/ui/      # Generated components
│
└── .claude/
    ├── commands/               # Slash command definitions
    └── skills/                 # Extraction pipeline & prompts
```

## Commands

### Extract

| Command | Description |
|---------|-------------|
| `/extract-design <url>` | Extract design system from Figma |
| `/sync` | Sync changes from Figma |
| `/sync --check` | Check for changes without applying |
| `/preview-tokens` | Show token preview |
| `/clean` | Delete extraction output |

### Generate

| Command | Description |
|---------|-------------|
| `/install-design-system [path]` | Copy tokens into app |
| `/gen-component <name>` | Generate single component |
| `/gen-component --all` | Generate all components |
| `/build-screen <name>` | Build screen from layout spec |

## Extraction Pipeline

The extraction runs as a multi-phase pipeline with parallel agents for speed and cost efficiency:

```
Connect → Fingerprint → Tokens (4 parallel) → Components + Assets → Shells → Screens (N parallel) → Index
```

- **Tokens** are extracted as CSS custom properties (`colors.css`, `typography.css`, `spacing.css`, `effects.css`)
- **Components** are documented as markdown specs with variants, dimensions, and token usage
- **Screens** produce layout specs (`.md` + `.json`) and HTML previews
- **Preview** files open in the browser for human review — no automated LLM verification

## Figma Source File Requirements

The extraction pipeline requires **editable Figma source files** with real component nodes, text layers, and structured frames. It does not work well with:

- **"Preview" files** — These often contain pages rendered as flattened image fills (RECTANGLE nodes with IMAGE fills) rather than structured component trees. The pipeline will still extract tokens and any structured frames correctly, but flattened pages will only yield screenshot images, not extractable layouts.
- **Presentation canvases** — A single wide frame (e.g., 7560px) containing multiple pages arranged side-by-side is treated as one screen. The individual pages inside it cannot be extracted as separate layouts if they are image fills.

**What to do:** If extraction produces image-only screens, ask the designer for the editable source file (not the preview/handoff version). Tokens, colors, and typography will still extract correctly from any file — it's only the screen layouts that require real nodes.

## Design Token Rules

1. **NEVER hardcode colors** — Use `var(--color-*)` tokens
2. **NEVER hardcode spacing** — Use `var(--spacing-*)` tokens
3. **NEVER hardcode effects** — Use `var(--shadow-*)`, `var(--radius-*)` tokens
4. **ALWAYS check specs** — Read `design-system/specs/` before building
5. **ALWAYS use components** — Import from `src/components/ui/`
