# Figma Design System Extraction Skill

## Critical Rules

### DO NOT use Figma MCP tools
```
mcp__figma__* tools are FORBIDDEN during extraction
```
Use the Figma REST API directly via Python/curl.

### DO follow the pipeline
```
prompts/connect.md               ← Phase 1: Connect & screenshot
prompts/design-system-fingerprint.md  ← Phase 2: Fingerprint
prompts/extract-tokens.md             ← Phase 3: Tokens (4 parallel Tasks)
prompts/extract-components.md         ← Phase 4: Components
prompts/extract-screen.md             ← Phase 5: Screens (N parallel Tasks)
prompts/extract-assets.md             ← Phase 4b: Assets
```

## Purpose

Extract design tokens, component specifications, and layout patterns from a Figma file and generate a reusable design system.

## Prerequisites

- Figma file URL
- **Figma Personal Access Token** (see Setup below)
- **Figma MCP must be DISABLED**

## Setup: Figma Access Token

### Getting a Token

1. Log in to [Figma](https://www.figma.com)
2. Go to **Settings** > **Account** > **Personal access tokens**
3. Generate a new token (starts with `figd_`)

### Configuring the Token

| Method | Location | Best For |
|--------|----------|----------|
| Environment variable | `export FIGMA_ACCESS_TOKEN="..."` | CI/CD |
| Project .env.local | `.env.local` in project root | Local dev (recommended) |
| Skill config | `.claude/skills/figma-extraction/config/credentials.json` | Team setup |

**Quick setup:**
```bash
echo 'FIGMA_ACCESS_TOKEN=figd_your_token_here' >> .env.local
```

## Quick Start

```
/extract-design https://figma.com/file/YOUR_FILE_KEY/YourDesign
```

## Pipeline

```
Phase 1: Connect ──→ Phase 2: Fingerprint ──→ Phase 3: Tokens (parallel)
                                                        │
Phase 4: Components ←───────────────────────────────────┘
    │
Phase 5: Screens (parallel) ──→ Phase 6: Icons & Assets ──→ Phase 7: Sanity Check
```

### Phase 1: Connect & Screenshot
- Parse URL, authenticate, fetch file structure
- Cache API response for subsequent phases
- Export screenshots of all screen frames
- Output: `extraction-meta.json`, `.cache/figma-file.json`, `preview/layouts/screenshots/*.png`

### Phase 2: Fingerprint Design System
- Analyze screenshots to identify design system type (soft-ui, material-3, etc.)
- Extract semantic colors, gradient rules, gray scale convention
- Output: `design-system-context.json`
- **This file drives correct token naming in Phase 3**

### Phase 3: Extract Tokens (4 Parallel Tasks, haiku model)
- Colors, Typography, Spacing, Effects run concurrently
- Each agent reads `design-system-context.json` first
- Output: `tokens/*.css`

### Phase 4: Extract Components
- Find all component sets, enumerate every variant
- Output: `specs/components.md`

### Phase 5: Extract Screens (N Parallel Tasks)
- One Task per screen — sees screenshot + Figma JSON + tokens
- Produces layout spec + HTML preview in one shot (no context loss)
- Output: `specs/layouts/*.md`, `specs/layouts/*.json`, `preview/layouts/*.html`, `preview/layouts/data/*.json`

### Phase 6: Extract Icons & Assets
- Icons: detect, map to Lucide, track usage
- Assets: detect images, generate placeholder strategies
- Output: `assets/icon-manifest.json`, `assets/asset-manifest.json`

### Phase 7: Sanity Check
- Verify all expected files exist
- Open preview HTML for human review
- No LLM verification — human-in-the-loop is more effective

## What Gets Extracted

| Category | Source in Figma | Output |
|----------|-----------------|--------|
| **Design System** | Screenshots | `design-system-context.json` |
| **Colors** | Color styles, fills, gradients | `tokens/colors.css` |
| **Typography** | Text styles | `tokens/typography.css` |
| **Spacing** | Auto-layout gaps/padding | `tokens/spacing.css` |
| **Effects** | Effect styles, corner radius | `tokens/effects.css` |
| **Components** | Component sets (ALL variants) | `specs/components.md` |
| **Layouts** | Top-level screen frames | `specs/layouts/*.md` + `*.json` |
| **Previews** | Everything above | `preview/layouts/*.html` |
| **Icons** | Icon nodes → Lucide | `assets/icon-manifest.json` |
| **Images** | Image nodes → placeholders | `assets/asset-manifest.json` |

## Output Structure

```
design-system/
├── design-system-context.json    # Design system fingerprint
├── extraction-meta.json          # Sync metadata
├── tokens/
│   ├── colors.css
│   ├── typography.css
│   ├── spacing.css
│   └── effects.css
├── specs/
│   ├── components.md
│   ├── layouts.md                # Index
│   └── layouts/
│       ├── {Screen}.md
│       └── {Screen}.json
├── assets/
│   ├── icon-manifest.json
│   └── asset-manifest.json
└── preview/
    ├── index.html
    ├── tokens.html
    └── layouts/
        ├── index.html
        ├── {Screen}.html
        ├── screenshots/
        └── data/{Screen}.json
```

## Key Design Decisions

1. **Fingerprinting first** — Semantic color detection before token extraction prevents naming errors
2. **Per-screen agents** — One agent sees screenshot + JSON + tokens → no context loss between phases
3. **Parallel where possible** — Tokens run in parallel (4x), screens run in parallel (Nx)
4. **Haiku for tokens** — Cost savings on structured extraction that doesn't need vision
5. **No LLM verification** — File-existence sanity check + human review of HTML previews
6. **One mode** — No --thorough/--quick split; always does the right thing

## Sync Operations

```
/sync --check              # See what changed
/sync-tokens               # Just tokens
/sync-component Button     # Specific component
/sync-screen Dashboard     # Specific screen
/sync --all                # Full re-sync
```

## Troubleshooting

### "Figma Access Token not found"
Set up token per Setup section above.

### "401 Unauthorized" / "403 Forbidden"
Token may be invalid/expired or file not shared with your account.

### "No styles found"
Styles must be published in Figma. Local styles may not appear.

### Screens extracted as images instead of structured layouts
The Figma file may be a "Preview" or presentation file where pages are flattened into image fills (RECTANGLE nodes with IMAGE fills) rather than real component trees. This is common with files named "(Preview)" or "(Handoff)". Tokens and typography still extract correctly — only screen layouts are affected. Ask the designer for the editable source file, or use the extracted screenshots as visual references when building with `/build-screen`.

## Cleanup

```
/clean              # Delete extraction output
/clean --all        # Also delete generated app pages
```

## Command Status

| Command | Status | Notes |
|---------|--------|-------|
| `/extract-design <url>` | **Working** | Full 7-phase pipeline with cost tracking |
| `/build-screen <name>` | **Working** | Translates HTML preview to React; supports `--all` |
| `/gen-component <name>` | **Partial** | Generates components but lacks explicit design-system directory resolution (timestamped dirs vs symlink). Missing `--all` parallelism strategy. |
| `/install-design-system` | **Partial** | References fixed `design-system/` path instead of `design-system-latest` symlink or timestamped dirs. |
| `/preview-tokens` | **Stub** | Prompt references "React artifacts" which don't exist in CLI context. Should generate an HTML file and `open` it, like Phase 7 does. |
| `/sync` | **Stub** | Describes hash-based diff and interactive selection UI, but no underlying implementation exists (no hash comparison scripts, no diff logic). |
| `/sync-component <name>` | **Stub** | Same as `/sync` — no hash comparison or diff implementation. |
| `/sync-screen <name>` | **Stub** | Same as `/sync` — no hash comparison or diff implementation. `--with-images` export logic is unimplemented. |
| `/clean` | **Broken** | References `./scripts/clean-output.sh` which doesn't exist. Needs update for timestamped output directories. |

### Status definitions

- **Working** — Fully implemented and tested against real Figma files.
- **Partial** — Core functionality works but has known gaps (see notes).
- **Stub** — Prompt exists but underlying implementation is missing. Running the command will produce best-effort LLM behavior, not a reliable pipeline.
- **Broken** — Will fail due to missing dependencies.
