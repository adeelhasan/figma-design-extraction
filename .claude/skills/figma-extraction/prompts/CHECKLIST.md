# ⛔ EXTRACTION MASTER CHECKLIST

**READ THIS ENTIRE FILE BEFORE PROCEEDING. DO NOT SKIP.**

---

## Pre-Flight Checks

Before starting ANY extraction work:

### 1. Verify MCP is Disabled
```
❌ Figma MCP tools (mcp__figma__*) must NOT be used during extraction
```
If MCP tools are available, STOP and ask the user to disable them first.

### 2. Check for Existing Output
Look for prior extraction output:
```bash
ls -d design-system/ 2>/dev/null
```

If `design-system/` exists, **ASK THE USER**:
- Delete existing and start fresh?
- Overwrite into existing folder?
- Abort?

**Do not proceed without user confirmation.**

### 3. Check for Cached Data
Look for prior extraction data:
```bash
ls design-system*/preview/layouts/data/*.json 2>/dev/null
```

If no prior data exists, inform the user before proceeding.

### 4. Request Python Permissions

This extraction uses Python scripts for processing large JSON responses from the Figma API.

**Before proceeding, inform the user:**

> "This extraction will use Python scripts to process Figma data.
> To avoid repeated permission prompts, please grant Python permission now.
> When the permission prompt appears, select 'Always allow' (or press 'a')."

Then run this test to trigger the permission prompt:
```bash
python3 -c "print('Python permission granted')"
```

**Wait for user to grant permission before continuing to Phase 1.**

---

## Mandatory: Use TodoWrite for Tracking

**You MUST use the TodoWrite tool to track each step.** Create this exact todo list at the start:

```
TodoWrite([
  { content: "Phase 1: Read connect.md and analyze file structure", status: "pending" },
  { content: "Phase 2a: Read extract-colors.md and extract colors", status: "pending" },
  { content: "Phase 2b: Read extract-typography.md and extract typography", status: "pending" },
  { content: "Phase 2c: Read extract-spacing.md and extract spacing", status: "pending" },
  { content: "Phase 2d: Read extract-effects.md and extract effects", status: "pending" },
  { content: "Phase 3a: Read extract-components.md and extract components", status: "pending" },
  { content: "Phase 3b: Read extract-layouts.md and extract ALL layouts", status: "pending" },
  { content: "Phase 3c: Read extract-icons.md and extract icons", status: "pending" },
  { content: "Phase 3d: Read extract-assets.md and extract assets", status: "pending" },
  { content: "Phase 3e: Read extract-content.md and extract content", status: "pending" },
  { content: "Phase 4: Read validate.md and validate extraction", status: "pending" },
  { content: "Phase 5a: Generate preview/index.html (main dashboard)", status: "pending" },
  { content: "Phase 5b: Generate preview/tokens.html (token reference)", status: "pending" },
  { content: "Phase 5c: Generate preview/layouts/index.html (layout gallery)", status: "pending" },
  { content: "Phase 5d: Generate preview/layouts/{Screen}.html for EACH discovered screen", status: "pending" },
  { content: "Phase 5e: Validate all preview files exist and links resolve", status: "pending" }
])
```

---

## Execution Rules

### Rule 1: READ BEFORE EXECUTE
For EVERY step:
1. First READ the prompt file completely
2. Then EXECUTE what the prompt says
3. Mark the todo as completed
4. Move to the next step

### Rule 2: NO SKIPPING
❌ Do NOT skip any step
❌ Do NOT combine steps
❌ Do NOT "optimize" by doing things out of order

### Rule 3: VERIFY OUTPUTS
After each phase, verify the expected files were created:
- Phase 2: `tokens/*.css` (4 files)
- Phase 3: `specs/components.md`, `specs/layouts.md`, `specs/layouts/*.md`, `assets/*.json`, `preview/layouts/data/*.json`
- Phase 4: `extraction-report.md`
- Phase 5: `preview/index.html`, `preview/tokens.html`, `preview/layouts/index.html`, `preview/layouts/{Screen}.html` (ONE per discovered screen)

**Phase 5 Verification:** Count of `preview/layouts/*.html` (excluding index.html) MUST equal count of `specs/layouts/*.md`

---

## Step-by-Step Execution Order

Follow the chain - each prompt's "Next Step" tells you where to go.

### Phase 1: Connect & Analyze
```
□ READ: prompts/connect.md
□ EXECUTE: Parse URL, analyze structure, create directories
□ OUTPUT: extraction-meta.json, directory structure
□ NEXT: Follow "Next Step" link in the prompt
```

### Phase 2: Extract Tokens
```
□ READ: prompts/extract-colors.md → OUTPUT: tokens/colors.css
□ READ: prompts/extract-typography.md → OUTPUT: tokens/typography.css
□ READ: prompts/extract-spacing.md → OUTPUT: tokens/spacing.css
□ READ: prompts/extract-effects.md → OUTPUT: tokens/effects.css
```

### Phase 3: Extract Specifications & Assets
```
□ READ: prompts/extract-components.md → OUTPUT: specs/components.md
□ READ: prompts/extract-layouts.md → OUTPUT: specs/layouts.md + specs/layouts/*.md
□ READ: prompts/extract-icons.md → OUTPUT: assets/icon-manifest.json
□ READ: prompts/extract-assets.md → OUTPUT: assets/asset-manifest.json
□ READ: prompts/extract-content.md → OUTPUT: preview/layouts/data/*.json
```

### Phase 4: Validate
```
□ READ: prompts/validate.md → OUTPUT: extraction-report.md
```

### Phase 5: Generate Previews
```
□ READ: prompts/preview.md
□ OUTPUT: preview/index.html (main dashboard)
□ OUTPUT: preview/tokens.html (token reference)
□ OUTPUT: preview/layouts/index.html (layout gallery)
□ OUTPUT: preview/layouts/{Screen}.html for EACH discovered screen
□ VALIDATE: Run post-generation validation (see below)
```

---

## Post-Generation Validation

**CRITICAL:** After Phase 5, run these checks before reporting "extraction complete":

### File Count Validation
```bash
# Count screen specs
SCREEN_COUNT=$(ls design-system/specs/layouts/*.md 2>/dev/null | wc -l)

# Count screen previews (excluding index.html)
PREVIEW_COUNT=$(ls design-system/preview/layouts/*.html 2>/dev/null | grep -v index.html | wc -l)

echo "Screen specs: $SCREEN_COUNT"
echo "Screen previews: $PREVIEW_COUNT"

# They should match
if [ "$SCREEN_COUNT" != "$PREVIEW_COUNT" ]; then
  echo "⛔ ERROR: Missing preview files!"
  echo "Expected $SCREEN_COUNT preview HTML files, found $PREVIEW_COUNT"
  echo "Go back and create missing preview/layouts/{Screen}.html files"
fi
```

### Link Validation
Verify all internal links in `preview/layouts/index.html` point to existing files.

If ANY validation fails, **go back and complete the missing files before reporting success.**

---

## Completion Checklist

Before reporting "extraction complete", verify ALL of these exist:

```
design-system/
├── tokens/
│   ├── colors.css        ← REQUIRED
│   ├── typography.css    ← REQUIRED
│   ├── spacing.css       ← REQUIRED
│   └── effects.css       ← REQUIRED
├── specs/
│   ├── components.md     ← REQUIRED
│   ├── layouts.md        ← REQUIRED
│   └── layouts/
│       └── *.md          ← AT LEAST ONE per screen
├── assets/
│   ├── icon-manifest.json    ← REQUIRED
│   └── asset-manifest.json   ← REQUIRED
├── preview/
│   ├── index.html        ← REQUIRED
│   ├── tokens.html       ← REQUIRED
│   └── layouts/
│       ├── *.html        ← ONE per screen
│       └── data/*.json   ← ONE per screen
├── extraction-meta.json  ← REQUIRED
└── extraction-report.md  ← REQUIRED
```

If ANY required file is missing, go back and complete that step.

---

## Now Begin

After reading this checklist:
1. Create the TodoWrite list above
2. Check for existing output (ask user if found)
3. Request Python permissions (run the test command, wait for user to approve)
4. Proceed to READ `prompts/connect.md`
