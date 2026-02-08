# Extract Design System from Figma

Extract design tokens, component specs, and layout patterns from a Figma file.

## Usage

```
/extract-design <figma-url>
```

## Arguments

- `figma-url` (required): Full Figma file URL
  - `https://www.figma.com/file/{key}/{name}`
  - `https://www.figma.com/design/{key}/{name}`

## IMPORTANT: Orchestrator Rules

**You are a lean dispatcher.** Your job is to:
1. Launch Task subagents for each phase
2. Read `figma-essentials.json` for screen/component lists
3. Report progress between phases

**You must NOT:**
- Read `.cache/figma-file.json` (2.5MB — will overflow context)
- Execute extraction logic inline — ALL work is done by subagents
- Read prompt files inline — subagents read their own prompts

**Context budget:** Stay under ~10K tokens total orchestrator context.

## Pipeline

```
Pre-Flight: Init timestamped dir   → python3 init-extraction.py
Phase 1: Connect & Screenshot      → Task subagent (sequential)
Phase 2: Fingerprint               → Task subagent (sequential)
Phase 3: Extract Tokens            → 4 parallel Task subagents (haiku)
Phase 4: Components + Assets       → 2 parallel Task subagents
Phase 5a: Detect & Extract Shells  → 1 Task subagent (sequential)
Phase 5b: Extract Screen Content   → N parallel Task subagents (compose shells + content)
Phase 6: Generate Index Files      → Task subagent (haiku)
Phase 6b: Generate Design Reference → Task subagent (haiku)
Phase 7: Sanity Check              → python3 file-ops.py
```

## Pre-Flight

Create timestamped output directory:
```bash
python3 .claude/skills/figma-extraction/scripts/init-extraction.py
```

Parse the JSON output to get `OUTPUT_DIR` from the `outputDir` field. The script creates all subdirectories and a `design-system-latest` symlink. No need to check for existing output — timestamped dirs never collide.

Set `SCRIPTS=.claude/skills/figma-extraction/scripts` for convenience in subsequent phases.

## Phase 1: Connect & Analyze

Launch a Task subagent:

```
Read the prompt file: .claude/skills/figma-extraction/prompts/connect.md

Execute it for this Figma URL: $ARGUMENTS

Output directory: ${OUTPUT_DIR}
Scripts directory: ${SCRIPTS}
```

**Wait for completion.** Verify:
- `${OUTPUT_DIR}/.cache/figma-file.json` exists
- `${OUTPUT_DIR}/figma-essentials.json` exists
- `${OUTPUT_DIR}/preview/layouts/screenshots/` has PNG files

Report the connect summary to the user.

## Phase 2: Fingerprint Design System

Launch a Task subagent:

```
Read the prompt file: .claude/skills/figma-extraction/prompts/design-system-fingerprint.md

Execute it with OUTPUT_DIR=${OUTPUT_DIR}
```

**Wait for completion.** Verify `${OUTPUT_DIR}/design-system-context.json` exists.

Report the fingerprint summary to the user.

## Read Essentials (orchestrator reads these small files)

After Phase 2, read two files:

1. `${OUTPUT_DIR}/figma-essentials.json` (~5KB) to learn:
   - Screen names and IDs (for Phase 5 dispatching)
   - Component count (for Phase 4 context)
   - Design summary stats (for progress reporting)

2. `${OUTPUT_DIR}/extraction-meta.json` — read `figma.fileKey` and store as `FILE_KEY`.
   This is needed by Phase 4b for image export.

**These are the ONLY data files the orchestrator reads.**

## Phase 3: Extract Tokens (4 Parallel Tasks)

Launch 4 parallel Task subagents (use `model: "haiku"`):

For each of: `Colors`, `Typography`, `Spacing`, `Effects`:

```
Read the prompt file: .claude/skills/figma-extraction/prompts/token-extraction-agent.md

You are extracting {tokenType} tokens.
- cacheFilePath: ${OUTPUT_DIR}/.cache/figma-file.json
- outputDir: ${OUTPUT_DIR}
- outputPath: ${OUTPUT_DIR}/tokens/{filename}.css

Use the Figma query tool for data access:
  python3 ${SCRIPTS}/figma-query.py --cache ${OUTPUT_DIR}/.cache/figma-file.json <command>

DO NOT read the full cache file. Use query commands:
  Colors agent: `colors` + `gradients`
  Typography agent: `text-styles`
  Spacing agent: `spacing` + `radii`
  Effects agent: `effects` + `radii`

Read design-system-context.json first for semantic naming rules.
```

| Task | tokenType | Output |
|------|-----------|--------|
| 1 | Colors | `tokens/colors.css` |
| 2 | Typography | `tokens/typography.css` |
| 3 | Spacing | `tokens/spacing.css` |
| 4 | Effects | `tokens/effects.css` |

**Wait for all 4 to complete before proceeding.**

## Phase 4: Components + Icons/Assets (2 Parallel Tasks)

Launch **both** of these as parallel Task subagents:

### 4a: Extract Components

```
Read the prompt file: .claude/skills/figma-extraction/prompts/extract-components.md

Execute it with:
- cacheFilePath: ${OUTPUT_DIR}/.cache/figma-file.json
- outputDir: ${OUTPUT_DIR}

Use the Figma query tool for component data:
  python3 ${SCRIPTS}/figma-query.py --cache ${OUTPUT_DIR}/.cache/figma-file.json components
  python3 ${SCRIPTS}/figma-query.py --cache ${OUTPUT_DIR}/.cache/figma-file.json component "<name>"

Output: ${OUTPUT_DIR}/specs/components.md
```

### 4b: Extract Icons & Assets

The orchestrator must read the `fileKey` from `${OUTPUT_DIR}/extraction-meta.json` (field: `figma.fileKey`) and pass it to this agent.

```
Read the prompt files:
  .claude/skills/figma-extraction/prompts/extract-icons.md
  .claude/skills/figma-extraction/prompts/extract-assets.md

Execute with:
- cacheFilePath: ${OUTPUT_DIR}/.cache/figma-file.json
- outputDir: ${OUTPUT_DIR}
- fileKey: ${FILE_KEY}

Use the Figma query tool for component data:
  python3 ${SCRIPTS}/figma-query.py --cache ${OUTPUT_DIR}/.cache/figma-file.json components

After writing asset-manifest.json (with hasOriginal: true on image-fill nodes),
download images via script — DO NOT output image data yourself:
  python3 ${SCRIPTS}/export-images.py --file-key "${FILE_KEY}" --manifest "${OUTPUT_DIR}/assets/asset-manifest.json" --output "${OUTPUT_DIR}/assets/images"

Output: ${OUTPUT_DIR}/assets/icon-manifest.json, ${OUTPUT_DIR}/assets/asset-manifest.json, ${OUTPUT_DIR}/assets/images/
```

**Wait for both to complete before proceeding.**

## Phase 5a: Detect & Extract Shells (1 Sequential Task)

Launch a single Task subagent to detect shared layout shells (sidebar, navbar, footer) across all screens:

```
Read the prompt file: .claude/skills/figma-extraction/prompts/extract-shells.md

Execute it with:
- OUTPUT_DIR: ${OUTPUT_DIR}

Use the Figma query tool for data access:
  python3 ${SCRIPTS}/figma-query.py --cache ${OUTPUT_DIR}/.cache/figma-file.json screen-layout "{ScreenName}"
  python3 ${SCRIPTS}/figma-query.py --cache ${OUTPUT_DIR}/.cache/figma-file.json section "{ScreenName}" "<section-name>"

DO NOT read the full cache file. Query screen layouts incrementally.

Outputs:
  - ${OUTPUT_DIR}/layout-shells.json
  - ${OUTPUT_DIR}/preview/layouts/shells/*.html
```

**Wait for completion.** Verify `${OUTPUT_DIR}/layout-shells.json` exists.

Report the shell detection summary to the user (which shells were found, which screens have them).

## Phase 5b: Extract Screen Content (N Parallel Tasks)

Read screen list from `figma-essentials.json` (already loaded in "Read Essentials" step).

For each screen, launch a parallel Task subagent:

```
Read the prompt file: .claude/skills/figma-extraction/prompts/extract-screen.md

You are extracting the "{ScreenName}" screen (Figma ID: {screenId}).
- OUTPUT_DIR: ${OUTPUT_DIR}
- ScreenName: {ScreenName}

Pre-built shells are available at ${OUTPUT_DIR}/layout-shells.json.
Read it first and check screenShellMap["{ScreenName}"] to see which shells
apply to this screen. For shell sections, use the pre-built HTML fragments
from ${OUTPUT_DIR}/preview/layouts/shells/ instead of querying Figma.

Use the Figma query tool for NON-SHELL data access:
  python3 ${SCRIPTS}/figma-query.py --cache ${OUTPUT_DIR}/.cache/figma-file.json screen-layout "{ScreenName}"
  python3 ${SCRIPTS}/figma-query.py --cache ${OUTPUT_DIR}/.cache/figma-file.json section "{ScreenName}" "<section-name>"

DO NOT read the full cache file. Query sections incrementally.
DO NOT re-extract sections covered by shells.

Outputs:
  - ${OUTPUT_DIR}/specs/layouts/{ScreenName}.md
  - ${OUTPUT_DIR}/specs/layouts/{ScreenName}.json
  - ${OUTPUT_DIR}/preview/layouts/{ScreenName}.html
  - ${OUTPUT_DIR}/preview/layouts/data/{ScreenName}.json
```

**Wait for all screen agents to complete.**

## Phase 6: Generate Index Files

After screen agents finish, launch a Task subagent (use `model: "haiku"`) to generate:
- `specs/layouts.md` — index linking to all screen specs
- `preview/layouts/index.html` — layout gallery with links
- `preview/index.html` — main preview dashboard
- `preview/tokens.html` — token reference

## Phase 6b: Generate Design Reference

Launch a Task subagent (use `model: "haiku"`):

```
Read the prompt file: .claude/skills/figma-extraction/prompts/generate-reference.md

Execute it with OUTPUT_DIR=${OUTPUT_DIR}

Read these input files and synthesize into design-reference.md:
- ${OUTPUT_DIR}/design-system-context.json
- ${OUTPUT_DIR}/tokens/colors.css
- ${OUTPUT_DIR}/tokens/typography.css
- ${OUTPUT_DIR}/tokens/spacing.css
- ${OUTPUT_DIR}/tokens/effects.css
- ${OUTPUT_DIR}/specs/components.md

Output: ${OUTPUT_DIR}/design-reference.md
```

**Wait for completion.** Verify `${OUTPUT_DIR}/design-reference.md` exists.

## Phase 7: Sanity Check

Run inline using the file-ops script:

```bash
# Check required files exist
python3 ${SCRIPTS}/file-ops.py exists \
  --files "tokens/colors.css,tokens/typography.css,tokens/spacing.css,tokens/effects.css,specs/components.md,design-system-context.json,extraction-meta.json,figma-essentials.json,design-reference.md" \
  --dir "${OUTPUT_DIR}"

# Count per-screen files match
python3 ${SCRIPTS}/file-ops.py compare \
  --pattern-a "specs/layouts/*.md" \
  --pattern-b "preview/layouts/*.html" \
  --exclude-b "index.html" \
  --dir "${OUTPUT_DIR}"
```

If any required file is missing, report which phase failed.

Then open the preview for human review:
```bash
open ${OUTPUT_DIR}/preview/index.html
```

## Output Structure

```
design-system-YYYYMMDD-HHMMSS/     # Timestamped output directory
├── figma-essentials.json           # Compact TOC (~5KB)
├── design-system-context.json      # Design system fingerprint
├── design-reference.md             # Compact design reference (~200-300 lines)
├── extraction-meta.json            # Sync metadata
├── layout-shells.json              # Shared shell definitions (Phase 5a)
├── .cache/
│   └── figma-file.json             # Full Figma API response (2.5MB)
├── tokens/
│   ├── colors.css
│   ├── typography.css
│   ├── spacing.css
│   └── effects.css
├── specs/
│   ├── components.md
│   ├── layouts.md                  # Index
│   └── layouts/
│       ├── {Screen}.md             # Per-screen spec
│       └── {Screen}.json           # Per-screen schema
├── assets/
│   ├── icon-manifest.json
│   └── asset-manifest.json
└── preview/
    ├── index.html                  # Main dashboard
    ├── tokens.html                 # Token reference
    └── layouts/
        ├── index.html              # Layout gallery
        ├── {Screen}.html           # Per-screen preview
        ├── shells/                 # Shared shell HTML fragments (Phase 5a)
        │   ├── sidebar.html
        │   └── navbar.html
        ├── screenshots/            # Figma screenshots
        └── data/
            └── {Screen}.json       # Content data

design-system-latest -> design-system-YYYYMMDD-HHMMSS/  # Symlink
```

## Notes

- Requires Figma Personal Access Token (see SKILL.md for setup)
- Token extraction uses haiku model for cost savings
- Screen extraction runs in parallel — N screens = N concurrent agents
- All agents use `figma-query.py` for data access — never read the full cache
- No LLM verification — human reviews previews directly
- For updates after initial extraction, use `/sync` commands
- All file operations use Python scripts — no inline curl/mkdir/bash needed
