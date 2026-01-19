# Figma Design System Extraction Skill

---
## ⛔ STOP - READ THIS FIRST

**Before doing ANYTHING else:**

1. **READ the master checklist**: `prompts/CHECKLIST.md`
2. **Create TodoWrite list** with all extraction steps
3. **Follow prompts IN ORDER** - do not skip or combine steps

**This is not optional.** Skipping this causes incomplete extractions.

---

## Critical Rules

### ❌ DO NOT use Figma MCP tools
```
mcp__figma__* tools are FORBIDDEN during extraction
```
If these tools are available, ask user to disable them first.

### ✅ DO follow the prompt sequence
```
prompts/CHECKLIST.md        ← READ FIRST (mandatory)
prompts/connect.md          ← Then follow the chain:
  → pattern-discovery.md    ← Phase 0: Build pattern registry (NEW)
  → visual-analysis.md      ← (--thorough only) Visual inventory
  → extract-colors.md
  → extract-typography.md
  → extract-spacing.md
  → extract-effects.md
  → extract-components.md
  → extract-layouts.md      ← Enhanced with deep/row-aware extraction
  → extract-icons.md        ← DO NOT SKIP
  → extract-assets.md       ← DO NOT SKIP
  → extract-content.md      ← DO NOT SKIP
  → inventory-driven-extraction.md  ← (--thorough) Re-extract missing
  → pattern-validation.md   ← Validate required fields
  → validate.md
  → preview.md
  → reconciliation-report.md ← Generate coverage report (NEW)
  → verify-extraction.md    ← (--thorough only) Final verification
```

### ✅ DO use TodoWrite
Track every step. Mark complete only after output files exist.

---

## Purpose

Extract design tokens, component specifications, and layout patterns from a Figma file and generate a reusable design system for Claude Code projects.

## Prerequisites

- Target Figma file URL
- **Figma Personal Access Token** (see Setup below)
- Previous extraction data (from `design-system-*/` if re-running)
- **Figma MCP must be DISABLED**

## Setup: Figma Access Token

Before using this skill, you need to configure your Figma Personal Access Token.

### Getting a Token

1. Log in to [Figma](https://www.figma.com)
2. Go to **Settings** > **Account** > **Personal access tokens**
3. Click **Generate new token**
4. Copy the token (starts with `figd_`)

### Configuring the Token

Choose ONE of these methods (checked in this order):

| Method | Location | Best For |
|--------|----------|----------|
| Environment variable | `export FIGMA_ACCESS_TOKEN="..."` | CI/CD, advanced users |
| Project .env.local | `.env.local` in project root | Local development |
| Skill config | `.claude/skills/figma-extraction/config/credentials.json` | Shared/team setup |

**Quick setup (Option 2 - recommended):**
```bash
echo 'FIGMA_ACCESS_TOKEN=figd_your_token_here' >> .env.local
```

**Or skill config (Option 3):**
```bash
cp .claude/skills/figma-extraction/config/credentials.example.json \
   .claude/skills/figma-extraction/config/credentials.json
# Then edit credentials.json with your token
```

See `config/README.md` for full details.

## Quick Start

```
/extract-design https://figma.com/file/YOUR_FILE_KEY/YourDesign
```

For deeper extraction with visual verification:
```
/extract-design https://figma.com/file/YOUR_FILE_KEY/YourDesign --thorough
```

Or step-by-step:
```
/sync --check                    # See what's in the Figma file
/extract-design [url]            # Full extraction
/extract-design [url] --thorough # Deep extraction with verification
/preview-tokens                  # Verify extraction
```

## What Gets Extracted

| Category | Source in Figma | Output |
|----------|-----------------|--------|
| **Colors** | Color styles, fills, gradients | `tokens/colors.css` |
| **Typography** | Text styles | `tokens/typography.css` |
| **Spacing** | Auto-layout gaps/padding | `tokens/spacing.css` |
| **Effects** | Effect styles, corner radius | `tokens/effects.css` |
| **Components** | Component sets (ALL variants) | `specs/components.md` |
| **Layouts** | Top-level frames/pages | `specs/layouts.md` + `specs/layouts/*.md` |
| **Icons** | Icon nodes, mapped to Lucide | `assets/icon-manifest.json` |
| **Images** | Image nodes, placeholders | `assets/asset-manifest.json` |

## Output Structure

Generated at `design-system/` (project root):

```
design-system/
├── SKILL.md                 # Usage instructions
├── tokens/
│   ├── colors.css           # --color-*, --gradient-* custom properties
│   ├── typography.css       # --font-* custom properties
│   ├── spacing.css          # --spacing-* custom properties
│   └── effects.css          # --shadow-*, --radius-* custom properties
├── specs/
│   ├── components.md        # Component specifications (ALL variants)
│   ├── layouts.md           # Index of all screen layouts
│   └── layouts/             # Per-screen layout specs
│       ├── {Screen1}.md     # Individual screen specification
│       ├── {Screen2}.md     # One file per top-level frame
│       └── ...
├── config/
│   └── icon-mapping.json    # Icon name → Lucide library mapping
├── assets/
│   ├── icon-manifest.json   # Detected icons with library mappings
│   ├── asset-manifest.json  # Detected images with placeholders
│   └── images/              # Exported images (optional)
├── extraction-meta.json     # Sync metadata
├── extraction-report.md     # Extraction details + validation
└── preview/
    ├── index.html           # Preview overview (with icons)
    ├── tokens.html          # Visual token preview
    ├── layouts/
    │   ├── index.html       # Layout index
    │   ├── {screen}.html    # Per-screen visual preview
    │   └── data/
    │       └── {screen}.json # Screen content data
    └── layouts.html         # Layout mockups
```

## Extraction Process

The extraction follows a phased approach. Steps within each phase can run in parallel.

### Extraction Modes

| Mode | Flag | Visual Analysis | Traversal Depth | Verification |
|------|------|-----------------|-----------------|--------------|
| Standard | (default) | No | Auto-detected* | No |
| Thorough | `--thorough` | Yes | 10 levels | Yes |

*Standard mode auto-detects layout type (dashboard, sidebar, etc.) and adjusts depth accordingly.

Use `--thorough` for:
- Complex dashboards with nested sections
- High-fidelity design handoffs
- When standard extraction misses content

### Extraction Improvements (v2)

The extraction system includes these improvements for better coverage:

| Improvement | Description | Prompt |
|-------------|-------------|--------|
| **Pattern Discovery** | Builds pattern registry from Figma components, visual analysis, and structural fingerprinting | `pattern-discovery.md` |
| **Deep Traversal** | Auto-detects dashboard layouts and uses appropriate traversal depth (up to 10 levels) | `extract-layouts.md` |
| **Row-Aware Extraction** | Extracts each card in horizontal rows separately instead of merging | `extract-layouts.md` |
| **Inventory-Driven** | Re-extracts missing sections using targeted strategies | `inventory-driven-extraction.md` |
| **Pattern Validation** | Validates required fields for each UI pattern (stat-card, credit-card, etc.) | `pattern-validation.md` |
| **Sibling-Aware** | When a pattern is found, automatically extracts siblings with same pattern | `extract-layouts.md` |
| **Action Detection** | Captures VIEW ALL, ADD NEW, EDIT, DELETE, and other action buttons | `extract-layouts.md` |
| **Reconciliation** | Generates detailed coverage report comparing extraction against inventory | `reconciliation-report.md` |

Expected improvement: Section coverage from ~50% to ≥90% for complex dashboards.

### Phase 0: Visual Analysis (--thorough only)

```
Read: prompts/visual-analysis.md
```
- Export each screen frame as PNG via Figma API
- Analyze screenshots with vision to identify ALL visible sections
- Create section inventory for each screen
- Output: `preview/layouts/screenshots/*.png`
- Output: `preview/layouts/data/{Screen}-inventory.json`

This phase creates the "ground truth" for verifying extraction completeness.

### Phase 1: Connect & Analyze (Sequential)

```
Read: prompts/01-connect.md
```
- Parse Figma URL for file key
- Connect via Figma MCP
- Fetch file metadata and cache for subsequent steps
- List pages and top-level frames
- Report structure to user
- Create output directory structure
- (--thorough) Export screen images and run visual analysis

### Phase 2: Extract Tokens (Can Run in Parallel)

These four steps have no interdependencies and can run simultaneously:

| Step | Prompt | Output |
|------|--------|--------|
| Colors | `prompts/02-extract-colors.md` | `tokens/colors.css` |
| Typography | `prompts/03-extract-typography.md` | `tokens/typography.css` |
| Spacing | `prompts/04-extract-spacing.md` | `tokens/spacing.css` |
| Effects | `prompts/05-extract-effects.md` | `tokens/effects.css` |

**Colors** — Get all FILL type styles (solid + gradients), convert to hex/CSS gradients, categorize primitives vs semantic

**Typography** — Get all TEXT styles, extract font family/size/weight/line-height

**Spacing** — Analyze auto-layout properties, detect spacing scale, identify patterns

**Effects** — Get EFFECT styles (shadows, blurs), extract corner radius values

### Phase 3: Extract Specifications (Can Run in Parallel)

These steps have no interdependencies:

| Step | Prompt | Output |
|------|--------|--------|
| Components | `prompts/06-extract-components.md` | `specs/components.md` |
| Layouts | `prompts/07-extract-layouts.md` | `specs/layouts.md` + `specs/layouts/*.md` |

**Components** — Find all component sets, enumerate EVERY variant combination, **detect component types** (Button, Card, etc.), document dimensions/properties for each, map token usage

**Layouts** — Analyze top-level frames, create individual spec file per screen, document structure/grid/sections, identify responsive variants

### Phase 3.5: Extract Assets (Sequential)

These steps run after basic specs:

| Step | Prompt | Output |
|------|--------|--------|
| Icons | `prompts/10-extract-icons.md` | `assets/icon-manifest.json` |
| Images | `prompts/11-extract-assets.md` | `assets/asset-manifest.json` |
| Content | `prompts/07b-extract-content.md` | `preview/layouts/data/*.json` |

**Icons** — Detect icon nodes, map to Lucide library, track unmapped icons

**Images** — Detect image nodes, generate placeholder strategies, create asset manifest

**Content** — Extract ALL text and data, **include asset references**, generate per-screen JSON

### Phase 4: Validate (Sequential, Non-blocking)

```
Read: prompts/08-validate.md
```

**IMPORTANT**: Validation is advisory only. Extraction ALWAYS proceeds to Phase 5 regardless of validation results.

- Check naming consistency
- Verify color contrast (WCAG)
- Check spacing scale regularity
- Identify missing semantic tokens
- Output: `extraction-report.md`

### Phase 5: Generate Previews (Sequential)

```
Read: prompts/09-preview.md
```
- Generate static HTML previews **with Lucide icons**
- Generate layout mockups using extracted tokens
- **Render smart placeholders for images**
- Create artifact previews for conversation
- Output: `preview/*.html`, `preview/layouts/*.html`

**Icons** — Uses Lucide CDN, renders mapped icons from manifest

**Placeholders** — Avatar initials, gradient backgrounds, placeholder icons for images

### Phase 6: Verification (--thorough only)

```
Read: prompts/verify-extraction.md
```
- Compare extracted sections against visual inventory
- Calculate coverage percentages
- Identify missing sections and patterns
- Generate verification report
- Output: `preview/layouts/data/{Screen}-verification.json`
- Output: Appends to `extraction-report.md`

| Verification Check | Pass Threshold | Action if Fail |
|-------------------|----------------|----------------|
| Section coverage | ≥90% | Increase traversal depth |
| Content coverage | ≥95% | Check node depth limits |
| Pattern detection | All patterns | Review pattern definitions |
| Action coverage | ≥90% | Check action heuristics |

## Sync Operations

### Check for Changes
```
/sync --check
```
Compares current Figma state against `extraction-meta.json`, shows diff.

### Selective Sync
```
/sync-tokens              # Just token categories
/sync-component Button    # Specific component
/sync-screen Dashboard    # Specific screen
```

### Full Re-sync
```
/sync --all
```

## Validation Rules

The extraction validates (non-blocking):

1. **Naming Consistency**
   - All tokens use kebab-case
   - No duplicate names
   - Semantic names where appropriate

2. **Color Contrast**
   - Text/background combinations
   - WCAG AA compliance check

3. **Spacing Scale**
   - Values follow a consistent scale
   - Typically 4px or 8px base

4. **Completeness**
   - Has primary/secondary colors
   - Has heading/body typography
   - Has basic spacing scale

## Customization

### Naming Conventions
Edit `templates/naming-rules.md` to customize how tokens are named.

### Output Format
Edit `templates/*.template.css` to change CSS output format.

### Validation Rules
Edit `prompts/08-validate.md` to adjust validation criteria.

## Troubleshooting

### "Figma Access Token not found"
- Set up your token using one of the methods in Setup above
- Check `.env.local` exists and contains `FIGMA_ACCESS_TOKEN=...`
- Or check `config/credentials.json` exists with valid token

### "Cannot connect to Figma" / "401 Unauthorized"
- Token may be invalid or expired
- Generate a new token at Figma Settings > Account > Personal access tokens
- Verify the file is shared with your Figma account

### "403 Forbidden"
- Token doesn't have access to this file
- Make sure the Figma file is shared with you
- Check if the file requires team/organization access

### "No styles found"
- Figma styles must be published to be detected
- Local styles in components may not appear
- Check file has color/text styles defined

### "Spacing detection failed"
- Spacing is inferred from auto-layout
- Files without auto-layout have limited spacing data
- Manual spacing values can be added to output

## Cleanup

To delete all extraction output and start fresh:

```
/clean              # Delete tokens, specs, preview, app copies
/clean --all        # Also delete generated app pages (dashboard, signin, etc.)
```

Or run directly:
```bash
./scripts/clean-output.sh [--all]
```

## Related Commands

- `/extract-design [url]` — Full extraction
- `/clean` — Delete extraction output
- `/sync` — Interactive sync
- `/sync-tokens` — Sync tokens only
- `/sync-component [name]` — Sync specific component
- `/sync-screen [name]` — Sync specific screen
- `/preview-tokens` — Show token preview
- `/validate-design` — Run validation checks
