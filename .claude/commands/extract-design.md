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
2. Run Python scripts for data preparation steps
3. Read `figma-essentials.json` for screen/component lists
4. Report progress between phases

**You must NOT:**
- Read `.cache/figma-file.json` (2.5MB — will overflow context)
- Execute extraction logic inline — ALL work is done by subagents or Python scripts
- Read prompt files inline — subagents read their own prompts

**Context budget:** Stay under ~10K tokens total orchestrator context.

## Cost Tracking

Track token usage across all phases. After each Task subagent completes, extract the `<usage>` block from its result (contains `total_tokens`, `tool_uses`, `duration_ms`). Keep a running list:

```
costs = []  # conceptual — maintain in your working memory
```

After each phase, append an entry:
```json
{ "phase": "1-connect", "model": "haiku", "tokens": 16780, "toolUses": 10, "durationMs": 110059 }
```

For parallel phases (e.g., Phase 3 tokens ×4), record each subagent separately:
```json
{ "phase": "3-tokens-colors", "model": "haiku", "tokens": 31798, "toolUses": 6, "durationMs": 39000 }
```

In Phase 7 (after sanity check), write the full cost summary to `extraction-meta.json` — see Phase 7 for details.

## Pipeline

```
Pre-Flight: python3 init-extraction.py
Phase 1:    Connect & Screenshot      → Task subagent (haiku, ~3 turns)
Phase 2:    Fingerprint               → Task subagent (opus, ~15 turns)
Phase 3:    Extract Tokens            → 4 parallel Task subagents (haiku)
            ↓ python3 prepare-icons-assets.py   ← replaces LLM agent
            ↓ python3 prepare-components.py     ← pre-packages data
Phase 4a:   Components                → Task subagent (sonnet, ~3 turns)
Phase 4b:   Asset Download            → Task subagent (haiku, ~2 turns)
            ↓ python3 prepare-shells.py         ← pre-packages data
Phase 5a:   Shell HTML                → Task subagent (sonnet, ~5 turns)
            ↓ python3 prepare-screen.py ×N      ← pre-packages per screen
Phase 5b:   Extract Screen Content    → N parallel Task subagents (sonnet, ~5 turns each)
Phase 6:    Generate Index Files      → Task subagent (haiku)
Phase 6b:   Generate Design Reference → Task subagent (haiku)
Phase 7:    Sanity Check              → python3 file-ops.py
```

## Pre-Flight

Create timestamped output directory:
```bash
python3 .claude/skills/figma-extraction/scripts/init-extraction.py
```

Parse the JSON output to get `OUTPUT_DIR` from the `outputDir` field. The script creates all subdirectories and a `design-system-latest` symlink. No need to check for existing output — timestamped dirs never collide.

Set `SCRIPTS=.claude/skills/figma-extraction/scripts` for convenience in subsequent phases.

## Phase 1: Connect & Analyze

Launch a Task subagent (use `model: "haiku"`):

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

## Data Preparation: Icons, Assets & Components

After tokens complete, run three Python scripts inline (no LLM needed):

### Prepare Icons & Assets

```bash
python3 ${SCRIPTS}/prepare-icons-assets.py \
  --cache ${OUTPUT_DIR}/.cache/figma-file.json \
  --output-dir ${OUTPUT_DIR}
```

This writes `assets/icon-manifest.json` and `assets/asset-manifest.json` directly. Report the summary to the user.

### Prepare Components Package

```bash
python3 ${SCRIPTS}/prepare-components.py \
  --cache ${OUTPUT_DIR}/.cache/figma-file.json \
  --context ${OUTPUT_DIR}/design-system-context.json \
  --output ${OUTPUT_DIR}/.cache/components-package.json
```

This pre-packages all component subtrees into one file for the component agent.

## Phase 4: Components + Asset Download (2 Parallel Tasks)

Launch **both** as parallel Task subagents:

### 4a: Extract Components

Use `model: "sonnet"`:

```
Read the prompt file: .claude/skills/figma-extraction/prompts/extract-components.md

Execute it with:
- OUTPUT_DIR: ${OUTPUT_DIR}

The component data is pre-packaged at:
  ${OUTPUT_DIR}/.cache/components-package.json

Read that single file and write: ${OUTPUT_DIR}/specs/components.md

No Figma queries needed.
```

### 4b: Download Assets

Use `model: "haiku"`:

The orchestrator must pass the `fileKey` from `extraction-meta.json`.

```
Read the prompt file: .claude/skills/figma-extraction/prompts/extract-assets.md

Execute with:
- OUTPUT_DIR: ${OUTPUT_DIR}
- FILE_KEY: ${FILE_KEY}
- SCRIPTS: ${SCRIPTS}

The manifests are already created. Just download images.
```

**Wait for both to complete before proceeding.**

## Data Preparation: Shells

After Phase 4, run the shell preparation script:

```bash
python3 ${SCRIPTS}/prepare-shells.py \
  --cache ${OUTPUT_DIR}/.cache/figma-file.json \
  --screenshots-dir ${OUTPUT_DIR}/preview/layouts/screenshots/ \
  --context ${OUTPUT_DIR}/design-system-context.json \
  --output ${OUTPUT_DIR}/.cache/shells-package.json
```

Report the shell detection summary to the user.

## Phase 5a: Extract Shells (1 Sequential Task)

Launch a single Task subagent (use `model: "sonnet"`):

```
Read the prompt file: .claude/skills/figma-extraction/prompts/extract-shells.md

Execute it with:
- OUTPUT_DIR: ${OUTPUT_DIR}

The shell data is pre-packaged at:
  ${OUTPUT_DIR}/.cache/shells-package.json

Read that single file + screenshots, then write:
  - ${OUTPUT_DIR}/layout-shells.json
  - ${OUTPUT_DIR}/preview/layouts/shells/*.html

No Figma queries needed.
```

**Wait for completion.** Verify `${OUTPUT_DIR}/layout-shells.json` exists.

Report the shell detection summary to the user.

## Data Preparation: Screen Packages

After Phase 5a, prepare per-screen data packages. For each screen from `figma-essentials.json`:

```bash
python3 ${SCRIPTS}/prepare-screen.py \
  --cache ${OUTPUT_DIR}/.cache/figma-file.json \
  --output-dir ${OUTPUT_DIR} \
  --screen "{ScreenName}" \
  --output ${OUTPUT_DIR}/.cache/screen-packages/{ScreenName}.json
```

Run these sequentially (they're fast — just JSON bundling, no API calls).

## Phase 5b: Extract Screen Content (N Parallel Tasks)

Read screen list from `figma-essentials.json` (already loaded in "Read Essentials" step).

For each screen, launch a parallel Task subagent (use `model: "sonnet"`):

```
Read the prompt file: .claude/skills/figma-extraction/prompts/extract-screen.md

You are extracting the "{ScreenName}" screen.
- OUTPUT_DIR: ${OUTPUT_DIR}
- ScreenName: {ScreenName}

The screen data is pre-packaged at:
  ${OUTPUT_DIR}/.cache/screen-packages/{ScreenName}.json

Read that single file + the screenshot, then write all 4 outputs.
No Figma queries needed.

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

## Phase 7: Sanity Check & Cost Report

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

### Write Cost Summary

Read `${OUTPUT_DIR}/extraction-meta.json`, add the `costs` field with all tracked phase data, and write it back. Use the Edit tool to add the field.

The `costs` structure:
```json
{
  "costs": {
    "phases": [
      { "phase": "1-connect", "model": "haiku", "tokens": 16780, "toolUses": 10, "durationMs": 110059 },
      { "phase": "2-fingerprint", "model": "opus", "tokens": 39737, "toolUses": 15, "durationMs": 94759 },
      { "phase": "3-tokens-colors", "model": "haiku", "tokens": 31798, "toolUses": 6, "durationMs": 39000 },
      ...
    ],
    "totals": {
      "totalTokens": 715098,
      "byModel": {
        "haiku": { "tokens": 274466, "agents": 7 },
        "sonnet": { "tokens": 400895, "agents": 8 },
        "opus": { "tokens": 39737, "agents": 1 }
      },
      "totalDurationMs": 842000,
      "agentCount": 16
    }
  }
}
```

Compute `totals` by summing across all phase entries. Group by model for the `byModel` breakdown.

### Open Preview

Then open the preview for human review:
```bash
open ${OUTPUT_DIR}/preview/index.html
```

### Report to User

Print a cost summary table:

```
## Cost Summary
| Phase | Model | Tokens | Tools | Duration |
|-------|-------|--------|-------|----------|
| ... per phase row ... |
| **Total** | | **{sum}** | **{sum}** | **{sum}** |
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
│   ├── figma-file.json             # Full Figma API response (2.5MB)
│   ├── components-package.json     # Pre-packaged component data
│   ├── shells-package.json         # Pre-packaged shell data
│   └── screen-packages/            # Pre-packaged per-screen data
│       ├── Dashboard.json
│       └── ...
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
│   ├── asset-manifest.json
│   └── images/                     # Downloaded images (if any)
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

- **Source file quality matters** — "Preview" or presentation Figma files may contain pages as flattened image fills rather than structured nodes. Tokens extract fine, but screen layouts will only yield screenshots. Use the editable source file for full extraction.
- Requires Figma Personal Access Token (see SKILL.md for setup)
- Token extraction uses haiku model for cost savings
- Component extraction uses sonnet model with pre-packaged data
- Shell and screen extraction use sonnet model with pre-packaged data
- Only fingerprinting uses opus (requires vision + design judgment)
- Screen extraction runs in parallel — N screens = N concurrent agents
- Python scripts handle data preparation — no LLM needed for icon/asset detection
- All agents read pre-packaged data — no figma-query calls needed
- No LLM verification — human reviews previews directly
- For updates after initial extraction, use `/sync` commands
- All file operations use Python scripts — no inline curl/mkdir/bash needed
