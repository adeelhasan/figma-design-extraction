# Visual Convergence Loop - Agent Architecture Plan

---

## PRE-IMPLEMENTATION: Git Setup & Versioning Decision

### Decision: Timestamped Output Folders

Output folders use timestamps and are **excluded from git** (treated as build outputs):

```
my-design-system-project/
├── design-system-2026-01-19-143022/   # ← Timestamped extraction output
│   ├── tokens/
│   ├── specs/
│   ├── preview/
│   └── extraction-meta.json
├── design-system-2026-01-20-091500/   # ← Another extraction run
├── .claude/                            # ← Source code (in git)
├── app/                                # ← Application code (in git)
└── CLAUDE.md                           # ← Project config (in git)
```

### .gitignore additions needed:

```gitignore
# Extraction outputs (timestamped, not versioned)
design-system-*/

# Keep the skill source code
!.claude/skills/
```

### Git Setup Steps (manual, before implementation):

```bash
# 1. Initialize git
git init

# 2. Create .gitignore
cat > .gitignore << 'EOF'
# OS files
.DS_Store
Thumbs.db

# Dependencies
node_modules/

# Environment files with secrets
.env
.env.local
*.local

# Credentials (keep example, ignore actual)
credentials.json

# IDE
.idea/
.vscode/
*.swp
*.swo

# Build outputs
dist/
build/
.next/

# Logs
*.log
npm-debug.log*

# Cache
.cache/
*.cache

# Temporary files
tmp/
temp/

# Claude plans (personal)
.claude/plans/

# Extraction outputs (timestamped, treat as build artifacts)
design-system-*/
EOF

# 3. Add all source files
git add .

# 4. Initial commit
git commit -m "Initial commit: Figma extraction skill and project structure"
```

### Output Folder Naming Convention

```typescript
function getOutputFolderName(): string {
  const now = new Date();
  const timestamp = now.toISOString()
    .replace(/[-:]/g, '')
    .replace('T', '-')
    .slice(0, 15);  // YYYYMMDD-HHMMSS
  return `design-system-${timestamp}`;
}

// Examples:
// design-system-20260119-143022
// design-system-20260120-091530
```

### Symlink for Convenience

After extraction, create/update a symlink for easy access:

```bash
# After successful extraction:
ln -sfn design-system-20260119-143022 design-system-latest
```

This lets code reference `design-system-latest/tokens/colors.css` without knowing the timestamp.

---

## The Core Question

> Are we going to put each screen into its own subagent spin off? And what would be known to it as context which has already been calculated?

## Answer: Hybrid Architecture

**Yes, each screen gets its own comparison agent**, but they share pre-computed context through files. Here's the architecture:

---

## Agent Hierarchy

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  ORCHESTRATOR AGENT (main conversation)                                      │
│  - Owns the convergence loop                                                │
│  - Decides when to spawn screen agents                                       │
│  - Aggregates results                                                        │
│  - Applies cross-screen fixes (e.g., token changes)                         │
└─────────────────────────────────────────────────────────────────────────────┘
          │
          │ spawns (parallel)
          ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  SCREEN COMPARISON AGENTS (one per screen)                                   │
│                                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │ Dashboard   │  │ Billing     │  │ Tables      │  │ Profile     │  ...   │
│  │ Agent       │  │ Agent       │  │ Agent       │  │ Agent       │        │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘        │
│                                                                             │
│  Each agent:                                                                │
│  - Receives: screen name + shared context file paths                        │
│  - Reads: Figma screenshot + rendered screenshot                            │
│  - Outputs: discrepancy report JSON                                         │
│  - Does NOT apply fixes (orchestrator does that)                            │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Context Sharing Strategy

### What Each Screen Agent KNOWS (via file paths)

| Context | File Path | What It Contains |
|---------|-----------|------------------|
| **Design Tokens** | `design-system/tokens/*.css` | Current CSS variable values |
| **Screen Spec** | `design-system/specs/layouts/{Screen}.md` | Expected structure, grid, sections |
| **Visual Inventory** | `design-system/preview/layouts/data/{Screen}-inventory.json` | Section inventory from visual analysis |
| **Content Data** | `design-system/preview/layouts/data/{Screen}.json` | Extracted content for this screen |
| **Icon Manifest** | `design-system/assets/icon-manifest.json` | Icon mappings |
| **Figma Screenshot** | `design-system/preview/layouts/screenshots/{Screen}.png` | Ground truth image |
| **Rendered HTML** | `design-system/preview/layouts/{Screen}.html` | Current rendered file |

### What Each Screen Agent DOES NOT KNOW

- Other screens' discrepancies (isolated)
- Previous iteration history (stateless)
- How to apply fixes (read-only analysis)

---

## The Orchestrator's Role

```
ORCHESTRATOR LOOP:
─────────────────

1. PREPARE CONTEXT (once, before loop)
   └─► Capture rendered screenshots for all screens
   └─► Create shared context manifest: convergence-context.json

2. SPAWN COMPARISON AGENTS (parallel, each iteration)
   └─► Launch 6 agents simultaneously (one per screen)
   └─► Each agent reads its screen's files + shared context
   └─► Each agent outputs: {Screen}-discrepancies.json

3. AGGREGATE RESULTS (after all agents complete)
   └─► Collect all discrepancy reports
   └─► Identify token-level fixes (affect all screens)
   └─► Identify screen-specific fixes
   └─► Calculate overall fidelity score

4. APPLY FIXES (orchestrator only)
   └─► Apply high-confidence token fixes first
   └─► Apply screen-specific CSS fixes
   └─► Re-render all affected HTML files

5. CHECK CONVERGENCE
   └─► If fidelity ≥ 95%: DONE
   └─► If iteration ≥ 5: DONE (max reached)
   └─► If improvement < 2%: DONE (plateau)
   └─► Else: GOTO step 2
```

---

## Shared Context Manifest

Before spawning screen agents, orchestrator creates:

**File:** `design-system/preview/convergence-context.json`

```json
{
  "iteration": 1,
  "timestamp": "2026-01-18T12:00:00Z",
  "mode": "thorough",
  "screens": [
    {
      "name": "Dashboard",
      "figmaScreenshot": "screenshots/Dashboard.png",
      "renderedScreenshot": "rendered/Dashboard-iter-1.png",
      "specFile": "../../specs/layouts/Dashboard.md",
      "contentFile": "data/Dashboard.json",
      "inventoryFile": "data/Dashboard-inventory.json"
    },
    {
      "name": "Billing",
      "figmaScreenshot": "screenshots/Billing.png",
      "renderedScreenshot": "rendered/Billing-iter-1.png",
      "specFile": "../../specs/layouts/Billing.md",
      "contentFile": "data/Billing.json",
      "inventoryFile": "data/Billing-inventory.json"
    }
    // ... more screens
  ],
  "sharedContext": {
    "tokensDir": "../../tokens/",
    "iconManifest": "../../assets/icon-manifest.json",
    "previousFidelity": null,
    "fixesApplied": []
  }
}
```

---

## Screen Agent Prompt Template

```markdown
# Screen Comparison Agent: {screenName}

## Your Task

Compare the Figma source screenshot against the rendered HTML screenshot
for the **{screenName}** screen and identify all visual discrepancies.

## Input Files (READ THESE)

1. **Figma Source** (ground truth):
   `{figmaScreenshotPath}`

2. **Rendered Output** (current state):
   `{renderedScreenshotPath}`

3. **Screen Specification** (expected structure):
   `{specFilePath}`

4. **Design Tokens** (current CSS values):
   `{tokensDirPath}/*.css`

## Analysis Instructions

For each visual difference you observe:

1. Identify the **location** (section name, CSS selector)
2. Categorize the **type** (color, spacing, typography, effect, structure)
3. Describe **expected** (what Figma shows)
4. Describe **actual** (what rendered shows)
5. Suggest a **fix** with confidence level

## Output Format

Write your analysis to: `{outputPath}`

```json
{
  "screen": "{screenName}",
  "iteration": {iteration},
  "fidelityScore": 0-100,
  "discrepancies": [
    {
      "id": "d1",
      "category": "color",
      "severity": "high",
      "location": {
        "section": "credit-card",
        "cssSelector": ".credit-card"
      },
      "expected": {
        "description": "Dark gradient #3a416f to #141727",
        "cssValue": "linear-gradient(135deg, #3a416f, #141727)"
      },
      "actual": {
        "description": "Lighter gradient",
        "cssValue": "linear-gradient(127deg, #252f40, #1a1f2e)"
      },
      "fix": {
        "type": "css-variable",
        "file": "tokens/colors.css",
        "property": "--gradient-dark",
        "newValue": "linear-gradient(135deg, #3a416f 0%, #141727 100%)",
        "confidence": "high"
      }
    }
  ],
  "metrics": {
    "structureMatch": 100,
    "colorAccuracy": 75,
    "typographyMatch": 90,
    "spacingAccuracy": 85,
    "effectsMatch": 80
  }
}
```

## Important

- You are READ-ONLY. Do not modify any files.
- Focus only on **{screenName}**. Ignore other screens.
- Be specific about CSS selectors and values.
- Only mark fixes as "high" confidence if you are certain.
```

---

## Why This Architecture?

### Benefits of Per-Screen Agents

| Benefit | Explanation |
|---------|-------------|
| **Parallelism** | 6 screens compared simultaneously |
| **Isolation** | One screen's complexity doesn't affect others |
| **Focused context** | Each agent loads only relevant files |
| **Smaller prompts** | Vision analysis works better with focused scope |

### Benefits of Centralized Orchestrator

| Benefit | Explanation |
|---------|-------------|
| **Cross-screen fixes** | Token changes affect all screens - apply once |
| **Aggregation** | Overall fidelity calculated from all screens |
| **Fix ordering** | Tokens first, then screen-specific |
| **Loop control** | Single point for convergence decisions |

---

## Fix Application Strategy

The orchestrator applies fixes in this order:

```
1. TOKEN FIXES (high confidence, cross-screen impact)
   ├─ CSS variable changes in tokens/*.css
   └─ These propagate to all screens automatically

2. SHARED CSS FIXES (high confidence, used by multiple screens)
   └─ Common class changes (e.g., .stat-card, .nav-item)

3. SCREEN-SPECIFIC FIXES (high confidence, isolated)
   └─ Changes in preview/layouts/{Screen}.html <style> blocks

4. SKIP: Medium/low confidence fixes
   └─ Flagged for human review in report
```

---

## Implementation Files Needed

```
.claude/skills/figma-extraction/
├── prompts/
│   ├── convergence-orchestrator.md    # Main loop logic
│   ├── screen-comparison-agent.md     # Per-screen agent template
│   └── fix-application-rules.md       # Fix confidence & ordering
│
├── scripts/
│   ├── capture-screenshots.js         # Puppeteer batch capture
│   ├── apply-token-fix.js             # Edit CSS variables
│   └── apply-css-fix.js               # Edit specific selectors
│
└── templates/
    ├── convergence-context.json       # Shared context template
    └── discrepancy-report.json        # Output schema
```

---

## Design Decisions (Confirmed)

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Fix Application** | Auto-apply high confidence | User confirmed - no review step for high-confidence fixes |
| **Medium/Low Confidence** | Flag for review | Included in report, not auto-applied |

---

## Re-Render Mechanism

After applying fixes to tokens or HTML, the orchestrator must re-render:

```
TOKEN FIX APPLIED (e.g., --gradient-dark changed)
    │
    ▼
All HTML files already link to tokens/*.css
    │
    ▼
Just re-capture screenshots - CSS changes auto-propagate
    │
    ▼
New rendered screenshots reflect updated tokens
```

For **screen-specific HTML fixes** (inline styles, class changes):
- Edit the specific `{Screen}.html` file
- Re-capture only that screen's screenshot

---

## Screenshot Capture Approach

Use **Puppeteer** (widely available via npx):

```javascript
// scripts/capture-screenshot.js
const puppeteer = require('puppeteer');

async function captureScreen(htmlPath, outputPath, width = 1440, height = 1024) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width, height });
  await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle0' });
  await page.screenshot({ path: outputPath, fullPage: false });
  await browser.close();
}
```

---

## Iteration Tracking

Each iteration persists its results for debugging:

```
design-system/preview/layouts/
├── rendered/
│   ├── Billing-iter-1.png      # First iteration
│   ├── Billing-iter-2.png      # After first round of fixes
│   └── Billing-iter-3.png      # After second round of fixes
│
├── data/
│   ├── Billing-discrepancies-iter-1.json
│   ├── Billing-discrepancies-iter-2.json
│   └── Billing-convergence.json   # Final summary
```

This allows:
- Visual diff between iterations
- Understanding what changed
- Debugging if convergence fails

---

## Verification Section

### How to Test This System

1. **Capture Test**: Run screenshot capture script, verify PNGs are created
2. **Single Screen Test**: Run comparison agent on Billing only
3. **Fix Application Test**: Apply one token fix, verify propagation
4. **Full Loop Test**: Run complete convergence loop on all screens

### Success Criteria

- [ ] Screenshots captured at correct dimensions (1440x1024)
- [ ] Comparison agent produces valid JSON with discrepancies
- [ ] Token fixes correctly edit `tokens/*.css` files
- [ ] Fidelity score improves between iterations
- [ ] Loop terminates when target reached or max iterations

---

## Files to Create/Modify

| File | Type | Purpose |
|------|------|---------|
| `prompts/convergence-orchestrator.md` | New | Main loop orchestration |
| `prompts/screen-comparison-agent.md` | New | Per-screen comparison template |
| `prompts/fix-application-rules.md` | New | Confidence thresholds and ordering |
| `scripts/capture-screenshot.js` | New | Puppeteer screenshot capture |
| `SKILL.md` | Modify | Add Phase 7: Visual Convergence |
| `CHECKLIST.md` | Modify | Add convergence steps to todo list |

---

## Integration with Existing Workflow

The convergence loop becomes **Phase 7**, running after preview generation:

```
Phase 5: Generate Previews
    │
    ▼
Phase 6: Verify Extraction (existing, optional)
    │
    ▼
Phase 7: Visual Convergence Loop (NEW)
    ├── Spawn comparison agents (parallel)
    ├── Aggregate discrepancies
    ├── Apply high-confidence fixes
    ├── Re-capture screenshots
    └── Repeat until converged
    │
    ▼
DONE: High-fidelity previews ready
```

Trigger: `--converge` flag or automatically in `--thorough` mode

---

## Agent Collaboration & Handoff Patterns

### How Agents Pass Results Between Pipeline Stages

The key insight: **Agents don't directly talk to each other**. They communicate via **files** (the filesystem is the message bus).

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  PIPELINE HANDOFF PATTERN                                                    │
└─────────────────────────────────────────────────────────────────────────────┘

  STAGE 1                    STAGE 2                    STAGE 3
  ────────                   ────────                   ────────

  ┌─────────┐               ┌─────────┐               ┌─────────┐
  │ Agent A │               │ Agent B │               │ Agent C │
  │         │               │         │               │         │
  │  Task:  │               │  Task:  │               │  Task:  │
  │  Capture│               │  Compare│               │  Apply  │
  │  screens│               │  images │               │  fixes  │
  └────┬────┘               └────┬────┘               └────┬────┘
       │                         │                         │
       │ writes                  │ writes                  │ writes
       ▼                         ▼                         ▼
  ┌─────────┐               ┌─────────┐               ┌─────────┐
  │ rendered│               │ discrep-│               │ tokens/ │
  │ /*.png  │──────────────▶│ ancies  │──────────────▶│ *.css   │
  │         │   next agent  │ .json   │   next agent  │ (edited)│
  └─────────┘   reads these └─────────┘   reads these └─────────┘

  FILES ARE THE API BETWEEN AGENTS
```

### Detailed Handoff Sequence

```
ITERATION N:
═══════════════════════════════════════════════════════════════════════════════

STEP 1: CAPTURE (Bash script, no LLM needed)
────────────────────────────────────────────
  Input:  List of HTML files
  Output: rendered/{Screen}-iter-N.png for each screen

  Handoff: File paths written to convergence-context.json


STEP 2: COMPARE (Parallel agents, one per screen)
────────────────────────────────────────────
  Input per agent:
    - screenshots/{Screen}.png (Figma source)
    - rendered/{Screen}-iter-N.png (current render)
    - specs/layouts/{Screen}.md
    - tokens/*.css

  Output per agent:
    - data/{Screen}-discrepancies-iter-N.json

  Handoff: All agents write to data/ directory
           Orchestrator waits for all files to exist


STEP 3: AGGREGATE (Orchestrator reads all results)
────────────────────────────────────────────
  Input:  All discrepancy JSON files
  Output:
    - Merged fix list (deduplicated)
    - Overall fidelity score
    - Fix priority ordering

  Handoff: In-memory (orchestrator holds this state)


STEP 4: APPLY FIXES (Orchestrator or Bash)
────────────────────────────────────────────
  Input:  Prioritized fix list
  Output:
    - Modified tokens/*.css
    - Modified {Screen}.html files

  Handoff: Files modified in place
           Next iteration's capture will see changes


STEP 5: CHECK CONVERGENCE (Orchestrator logic)
────────────────────────────────────────────
  Input:  Current fidelity score, iteration count
  Output: Continue or stop decision

  Handoff: If continue → GOTO STEP 1 with N+1

═══════════════════════════════════════════════════════════════════════════════
```

---

## Model Selection Strategy

### The Goal: Minimize Tokens While Maximizing Quality

Not every step needs Opus. Use the right model for each task:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  MODEL SELECTION BY TASK COMPLEXITY                                          │
└─────────────────────────────────────────────────────────────────────────────┘

  TASK COMPLEXITY          MODEL           COST/SPEED      EXAMPLE TASKS
  ───────────────          ─────           ──────────      ─────────────

  🟢 Mechanical            Bash/Script     Free/Instant    Screenshot capture
     (no reasoning)                                        File existence check
                                                           JSON schema validation

  🟡 Structured            Haiku           Cheap/Fast      Parse JSON files
     (pattern matching)                                    Extract CSS values
                                                           Format fix commands
                                                           Aggregate metrics

  🟠 Analytical            Sonnet          Medium          Fix confidence scoring
     (judgment needed)                                     CSS selector generation
                                                           Deduplication logic

  🔴 Vision + Reasoning    Opus 4.5        Expensive       Screenshot comparison
     (complex analysis)                                    Discrepancy detection
                                                           Fix generation
```

### Model Assignment Per Pipeline Step

| Step | Task | Model | Rationale |
|------|------|-------|-----------|
| **1. Capture** | Run Puppeteer | `Bash` (no LLM) | Pure script execution |
| **2. Pre-process** | Load context files | `haiku` | Just reading JSON/CSS |
| **3. Compare** | Vision comparison | `opus` | **This is where Opus shines** - analyzing two images |
| **4. Parse Results** | Read discrepancy JSON | `haiku` | Structured data handling |
| **5. Deduplicate** | Merge fixes across screens | `sonnet` | Needs some reasoning |
| **6. Prioritize** | Order fixes by impact | `sonnet` | Judgment about fix ordering |
| **7. Apply Fixes** | Edit CSS files | `haiku` or `Bash` | Mechanical string replacement |
| **8. Validate** | Check fix was applied | `Bash` | File content verification |
| **9. Decide** | Continue or stop? | `sonnet` | Simple logic with context |

### Token Budget Breakdown (Estimated per Iteration)

```
STEP                    MODEL       INPUT TOKENS    OUTPUT TOKENS    COST WEIGHT
────                    ─────       ────────────    ─────────────    ───────────
Capture screenshots     Bash        0               0                $0
Load context (×6)       Haiku       ~2K × 6         ~100 × 6         $
Vision compare (×6)     Opus        ~5K × 6*        ~1K × 6          $$$$$
Parse results           Haiku       ~6K             ~500             $
Deduplicate fixes       Sonnet      ~3K             ~1K              $$
Apply fixes             Bash/Haiku  ~1K             ~500             $
Convergence check       Sonnet      ~500            ~100             $

* Vision tokens for images are handled differently but this is approximate

TOTAL PER ITERATION:
  - Opus: ~30K input tokens (vision) + ~6K output → Most expensive
  - Sonnet: ~3.5K input + ~1.1K output → Moderate
  - Haiku: ~15K input + ~1.2K output → Cheap
  - Bash: Free
```

### Optimization: When to Use Opus vs Not

```
USE OPUS (vision + reasoning):
─────────────────────────────────
✓ Comparing two screenshots (core task)
✓ Identifying subtle visual differences
✓ Generating fix suggestions with context
✓ Understanding design intent

DO NOT USE OPUS:
─────────────────────────────────
✗ Reading JSON files → Haiku
✗ Editing CSS values → Haiku or Bash
✗ Checking if files exist → Bash
✗ Simple aggregation → Haiku
✗ Formatting output → Haiku
```

---

## Practical Implementation: Task Tool Calls

### Spawning Screen Comparison Agents (Parallel, with Model Selection)

```markdown
## In convergence-orchestrator.md:

For each screen, spawn a comparison agent using Opus for vision analysis:

<!-- Spawn all 6 in parallel in ONE message -->
Task(
  subagent_type="general-purpose",
  model="opus",  ← Opus for vision comparison
  prompt="Compare Figma screenshot vs rendered screenshot for Dashboard..."
)

Task(
  subagent_type="general-purpose",
  model="opus",  ← Opus for vision comparison
  prompt="Compare Figma screenshot vs rendered screenshot for Billing..."
)

... (4 more for other screens)
```

### Spawning Aggregation Agent (Single, Cheaper Model)

```markdown
## After all comparison agents complete:

Task(
  subagent_type="general-purpose",
  model="sonnet",  ← Sonnet for reasoning without vision
  prompt="Read all discrepancy reports from data/*-discrepancies-iter-1.json,
          deduplicate fixes that affect the same CSS property,
          and output a prioritized fix list to data/fixes-iter-1.json"
)
```

### Spawning Fix Application (Cheapest or No LLM)

```markdown
## For mechanical edits:

Option A: Use Haiku
Task(
  subagent_type="general-purpose",
  model="haiku",  ← Haiku for mechanical tasks
  prompt="Apply these CSS fixes: [list]. Edit tokens/colors.css..."
)

Option B: Use Bash directly (even cheaper)
Bash(
  command="node scripts/apply-fixes.js data/fixes-iter-1.json"
)
```

---

## Agent Context Inheritance

### What Gets Passed to Subagents?

When you spawn a Task agent, you control what context it receives:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  CONTEXT FLOW TO SUBAGENT                                                    │
└─────────────────────────────────────────────────────────────────────────────┘

  ORCHESTRATOR                           SUBAGENT
  ────────────                           ────────

  Full conversation    ──[NOT passed]──▶  (empty history)
  history

  Prompt you write     ──[IS passed]───▶  This becomes the
                                          agent's only context

  File paths in        ──[Agent reads]─▶  Agent uses Read tool
  prompt                                  to load these files

  CLAUDE.md            ──[IS passed]───▶  Project instructions
                                          inherited automatically
```

### Key Insight: Subagents Start Fresh

Each subagent:
- Has NO memory of previous iterations
- Has NO knowledge of other screens
- Only knows what you put in the prompt + files it reads

This is why **files are the handoff mechanism**:
```
Iteration 1 results → data/Billing-discrepancies-iter-1.json
Iteration 2 agent reads → data/Billing-discrepancies-iter-1.json (if needed)
```

---

## Summary: Cost-Optimized Pipeline

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  VISUAL CONVERGENCE LOOP - OPTIMIZED FOR COST                               │
└─────────────────────────────────────────────────────────────────────────────┘

  ┌───────────────────────────────────────────────────────────────────────────┐
  │  ITERATION START                                                          │
  └───────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
  ┌───────────────────────────────────────────────────────────────────────────┐
  │  STEP 1: CAPTURE SCREENSHOTS                                              │
  │  Model: None (Bash script)                                                │
  │  Cost: $0                                                                 │
  └───────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
  ┌───────────────────────────────────────────────────────────────────────────┐
  │  STEP 2: VISUAL COMPARISON (×6 screens, parallel)                         │
  │  Model: OPUS 4.5                                                          │
  │  Cost: $$$$$ (but this is the VALUE - don't skimp here)                   │
  │  Why Opus: Vision + nuanced comparison + fix generation                   │
  └───────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
  ┌───────────────────────────────────────────────────────────────────────────┐
  │  STEP 3: AGGREGATE & DEDUPLICATE                                          │
  │  Model: Sonnet                                                            │
  │  Cost: $$                                                                 │
  │  Why Sonnet: Reasoning without vision, good at structured output          │
  └───────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
  ┌───────────────────────────────────────────────────────────────────────────┐
  │  STEP 4: APPLY FIXES                                                      │
  │  Model: Haiku OR Bash script                                              │
  │  Cost: $ or $0                                                            │
  │  Why cheap: Mechanical string replacement, no judgment needed             │
  └───────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
  ┌───────────────────────────────────────────────────────────────────────────┐
  │  STEP 5: CONVERGENCE CHECK                                                │
  │  Model: Sonnet (or orchestrator logic)                                    │
  │  Cost: $                                                                  │
  │  Why: Simple decision with context                                        │
  └───────────────────────────────────────────────────────────────────────────┘
                                    │
                          ┌─────────┴─────────┐
                          │                   │
                    CONVERGED?           NOT CONVERGED
                          │                   │
                          ▼                   ▼
                       DONE              NEXT ITERATION
```

### Cost Estimate Per Full Run (6 screens, ~3 iterations to converge)

| Component | Per Iteration | × 3 Iterations | Notes |
|-----------|---------------|----------------|-------|
| Opus (vision) | ~$0.50 | ~$1.50 | 6 screens × image analysis |
| Sonnet | ~$0.05 | ~$0.15 | Aggregation + decisions |
| Haiku | ~$0.01 | ~$0.03 | Parsing + mechanical |
| **Total** | ~$0.56 | **~$1.70** | For full convergence |

This is a rough estimate - actual costs depend on image sizes and discrepancy counts.

---

## Skill vs Plugin: Final Answer

**Subagents are part of the skill**, defined as prompt templates. No plugin needed.

```
.claude/skills/figma-extraction/
├── prompts/
│   ├── convergence-orchestrator.md    # Instructions for main loop
│   ├── screen-comparison-agent.md     # Template for spawning per-screen agents
│   └── fix-application-rules.md       # Confidence thresholds
```

When `/extract-design --converge` runs:
1. Main conversation reads `convergence-orchestrator.md`
2. Uses `Task` tool with prompts derived from `screen-comparison-agent.md`
3. Subagents are ephemeral - they exist only for their task, output to files, and terminate

---

## Implementation: Files to Create

### File 1: `prompts/convergence-orchestrator.md`

```markdown
# Visual Convergence Orchestrator (Phase 7)

## Purpose

Iteratively compare Figma screenshots against rendered HTML previews and apply fixes
until visual fidelity reaches ≥95% or max iterations (5) is reached.

## Prerequisites

- Phase 5 (Preview) must be complete
- Figma screenshots exist at `preview/layouts/screenshots/{Screen}.png`
- Rendered HTML exists at `preview/layouts/{Screen}.html`

## Process

### Step 1: Prepare Context

1. Create `rendered/` directory for iteration screenshots:
   ```bash
   mkdir -p design-system/preview/layouts/rendered
   ```

2. Identify all screens to process:
   - Read `specs/layouts.md` for screen list
   - Or glob `preview/layouts/*.html` (excluding index.html)

3. Initialize iteration counter: `iteration = 1`

### Step 2: Capture Rendered Screenshots

Run the screenshot capture script for all screens:

```bash
node .claude/skills/figma-extraction/scripts/capture-screenshots.js \
  --input "design-system/preview/layouts/*.html" \
  --output "design-system/preview/layouts/rendered" \
  --suffix "-iter-{iteration}"
```

This produces: `rendered/{Screen}-iter-1.png`, `rendered/{Screen}-iter-2.png`, etc.

### Step 3: Spawn Comparison Agents (PARALLEL)

For EACH screen, spawn a comparison agent using the Task tool:

```
Task(
  subagent_type="general-purpose",
  model="opus",
  prompt=<contents of screen-comparison-agent.md with variables substituted>
)
```

**CRITICAL**: Spawn ALL screen agents in a SINGLE message to run them in parallel.

Variables to substitute in each prompt:
- `{screenName}`: e.g., "Billing"
- `{figmaScreenshotPath}`: `design-system/preview/layouts/screenshots/Billing.png`
- `{renderedScreenshotPath}`: `design-system/preview/layouts/rendered/Billing-iter-1.png`
- `{outputPath}`: `design-system/preview/layouts/data/Billing-discrepancies-iter-1.json`
- `{iteration}`: current iteration number

### Step 4: Aggregate Results

After all comparison agents complete:

1. Read all discrepancy files: `data/*-discrepancies-iter-{N}.json`
2. Calculate overall fidelity: average of all screen fidelity scores
3. Collect all fixes into a single list
4. Deduplicate fixes that modify the same CSS property
5. Prioritize: token fixes first, then shared CSS, then screen-specific

### Step 5: Apply High-Confidence Fixes

For each fix with `confidence: "high"`:

**Token fixes** (affect all screens):
- Edit `design-system/tokens/{category}.css`
- Use Edit tool to replace CSS variable value

**Screen-specific fixes**:
- Edit `design-system/preview/layouts/{Screen}.html`
- Use Edit tool to modify inline styles or add CSS rules

**Skip** medium/low confidence fixes - log them in report.

### Step 6: Check Convergence

| Condition | Action |
|-----------|--------|
| Fidelity ≥ 95% | DONE - convergence achieved |
| Iteration ≥ 5 | DONE - max iterations reached |
| Improvement < 2% from last iteration | DONE - plateau detected |
| Otherwise | Increment iteration, GOTO Step 2 |

### Step 7: Generate Convergence Report

Create `design-system/preview/layouts/data/convergence-report.json`:

```json
{
  "completedAt": "2026-01-19T...",
  "totalIterations": 3,
  "finalFidelity": 96.5,
  "screenResults": [
    { "name": "Billing", "fidelity": 95.2, "fixesApplied": 4 },
    { "name": "Dashboard", "fidelity": 97.8, "fixesApplied": 2 }
  ],
  "skippedFixes": [
    { "reason": "low confidence", "description": "..." }
  ]
}
```

## Trigger

This phase runs when:
- `--converge` flag is passed to `/extract-design`
- `--thorough` mode (includes converge automatically)
- Manual invocation after preview generation
```

---

### File 2: `prompts/screen-comparison-agent.md`

```markdown
# Screen Comparison Agent: {screenName}

You are a visual comparison agent. Your task is to compare two screenshots
and identify all visual discrepancies between them.

## Input Files

Read these files:

1. **Figma Source Screenshot** (ground truth):
   `{figmaScreenshotPath}`

2. **Rendered HTML Screenshot** (current output):
   `{renderedScreenshotPath}`

3. **Screen Specification** (for context):
   `{specFilePath}`

4. **Design Tokens** (current CSS values):
   Read all files in `{tokensDirPath}`

## Your Analysis Task

Compare the two screenshots pixel-region by pixel-region. For each difference:

### 1. Identify Location
- Which section of the screen? (sidebar, header, card, etc.)
- What CSS selector would target this element?

### 2. Categorize the Difference
- **color**: Background, text, border, gradient colors
- **spacing**: Margins, padding, gaps between elements
- **typography**: Font size, weight, line height, letter spacing
- **effect**: Shadows, border radius, blur effects
- **structure**: Missing elements, wrong layout, incorrect hierarchy

### 3. Describe Expected vs Actual
- What does the Figma screenshot show?
- What does the rendered screenshot show?
- Be specific with values (colors as hex, sizes in pixels)

### 4. Suggest a Fix
- Which file needs to change?
- What property needs to change?
- What should the new value be?
- How confident are you? (high/medium/low)

**High confidence**: You can see exact values and know the fix
**Medium confidence**: The issue is clear but exact value is uncertain
**Low confidence**: Something looks off but fix is unclear

## Output

Write your analysis to: `{outputPath}`

Use this exact JSON schema:

```json
{
  "screen": "{screenName}",
  "iteration": {iteration},
  "analyzedAt": "ISO timestamp",
  "fidelityScore": 0-100,
  "discrepancies": [
    {
      "id": "d1",
      "category": "color|spacing|typography|effect|structure",
      "severity": "high|medium|low",
      "location": {
        "section": "human-readable section name",
        "cssSelector": ".class-name or element path"
      },
      "expected": {
        "description": "what Figma shows",
        "cssValue": "exact CSS value if determinable"
      },
      "actual": {
        "description": "what rendered shows",
        "cssValue": "current CSS value if determinable"
      },
      "fix": {
        "type": "css-variable|inline-style|class-addition",
        "file": "relative path to file to edit",
        "property": "CSS property name",
        "oldValue": "current value",
        "newValue": "suggested new value",
        "confidence": "high|medium|low"
      }
    }
  ],
  "metrics": {
    "structureMatch": 0-100,
    "colorAccuracy": 0-100,
    "typographyMatch": 0-100,
    "spacingAccuracy": 0-100,
    "effectsMatch": 0-100
  },
  "notes": "any additional observations"
}
```

## Fidelity Score Calculation

Calculate overall fidelity as weighted average:
- Structure: 30%
- Colors: 25%
- Typography: 20%
- Spacing: 15%
- Effects: 10%

`fidelityScore = (structure*0.3) + (colors*0.25) + (typography*0.2) + (spacing*0.15) + (effects*0.1)`

## Important Rules

1. **You are READ-ONLY** - do not modify any files
2. **Focus only on {screenName}** - ignore other screens
3. **Be specific** - vague descriptions don't help
4. **Prioritize high-severity issues** - things that are visually jarring
5. **Only mark "high confidence" if you're certain** - it's okay to be uncertain
```

---

### File 3: `prompts/fix-application-rules.md`

```markdown
# Fix Application Rules

## Confidence Thresholds

| Confidence | Action | Rationale |
|------------|--------|-----------|
| **high** | Auto-apply | Clear issue, certain fix |
| **medium** | Log for review | Issue clear, fix uncertain |
| **low** | Skip | Needs human judgment |

## Fix Priority Order

Apply fixes in this order to maximize impact:

### Priority 1: Token Fixes
- Files: `tokens/colors.css`, `tokens/typography.css`, `tokens/spacing.css`, `tokens/effects.css`
- Why first: Changes propagate to ALL screens automatically
- Example: `--color-primary: #344767` → `--color-primary: #3a416f`

### Priority 2: Shared CSS Classes
- Files: `preview/layouts/*.html` (shared `<style>` blocks)
- Why second: May affect multiple screens
- Example: `.stat-card { padding: 16px }` → `.stat-card { padding: 20px }`

### Priority 3: Screen-Specific Fixes
- Files: Individual `preview/layouts/{Screen}.html`
- Why last: Only affects one screen
- Example: `#billing-header { margin-bottom: 24px }`

## Fix Type Definitions

### css-variable
Edit a CSS custom property in `tokens/*.css`
```css
/* Before */
--gradient-dark: linear-gradient(127deg, #252f40, #1a1f2e);
/* After */
--gradient-dark: linear-gradient(135deg, #3a416f 0%, #141727 100%);
```

### inline-style
Add or modify inline style in HTML element
```html
<!-- Before -->
<div class="credit-card">
<!-- After -->
<div class="credit-card" style="background: linear-gradient(135deg, #3a416f, #141727);">
```

### class-addition
Add a new CSS class or modify existing class in `<style>` block
```css
/* Add to screen's <style> block */
.credit-card {
  background: linear-gradient(135deg, #3a416f, #141727);
}
```

## Deduplication Rules

When multiple screens report the same fix:

1. **Same token, same value**: Apply once to token file
2. **Same token, different values**: Take the value that appears most frequently
3. **Same class, different values**: Create screen-specific overrides

## Conflict Resolution

If two fixes conflict (modify same property to different values):

1. Prefer the fix with higher confidence
2. If equal confidence, prefer the fix from the screen with lower fidelity score
3. If still tied, log both and let human decide

## Logging Format

All skipped/deferred fixes go to `convergence-report.json`:

```json
{
  "skippedFixes": [
    {
      "screen": "Billing",
      "discrepancyId": "d3",
      "reason": "medium confidence",
      "fix": { ... },
      "suggestedReview": "Check if gradient angle should be 127deg or 135deg"
    }
  ]
}
```
```

---

### File 4: `scripts/capture-screenshots.js`

```javascript
#!/usr/bin/env node
/**
 * Batch screenshot capture for visual convergence loop.
 * Uses Puppeteer to render HTML files and capture screenshots.
 *
 * Usage:
 *   node capture-screenshots.js --input "path/to/*.html" --output "path/to/output" --suffix "-iter-1"
 *
 * Or programmatically:
 *   node capture-screenshots.js --files file1.html,file2.html --output dir --suffix -iter-1
 */

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
const glob = require('glob');

async function captureScreenshot(browser, htmlPath, outputPath, width = 1440, height = 1024) {
  const page = await browser.newPage();
  await page.setViewport({ width, height });

  // Use file:// protocol for local HTML files
  const fileUrl = `file://${path.resolve(htmlPath)}`;
  await page.goto(fileUrl, { waitUntil: 'networkidle0', timeout: 30000 });

  // Wait a bit for any CSS transitions/animations
  await page.waitForTimeout(500);

  await page.screenshot({ path: outputPath, fullPage: false });
  await page.close();

  return outputPath;
}

async function main() {
  const args = process.argv.slice(2);

  // Parse arguments
  let inputPattern = '';
  let inputFiles = [];
  let outputDir = '';
  let suffix = '';

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--input' && args[i + 1]) {
      inputPattern = args[++i];
    } else if (args[i] === '--files' && args[i + 1]) {
      inputFiles = args[++i].split(',');
    } else if (args[i] === '--output' && args[i + 1]) {
      outputDir = args[++i];
    } else if (args[i] === '--suffix' && args[i + 1]) {
      suffix = args[++i];
    }
  }

  // Resolve input files
  if (inputPattern) {
    inputFiles = glob.sync(inputPattern);
  }

  // Filter out index.html and other non-screen files
  inputFiles = inputFiles.filter(f => {
    const basename = path.basename(f);
    return basename !== 'index.html' && basename.endsWith('.html');
  });

  if (inputFiles.length === 0) {
    console.error('No HTML files found to capture');
    process.exit(1);
  }

  if (!outputDir) {
    console.error('--output directory is required');
    process.exit(1);
  }

  // Ensure output directory exists
  fs.mkdirSync(outputDir, { recursive: true });

  console.log(`Capturing ${inputFiles.length} screenshots...`);

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const results = [];

  for (const htmlFile of inputFiles) {
    const screenName = path.basename(htmlFile, '.html');
    const outputFileName = `${screenName}${suffix}.png`;
    const outputPath = path.join(outputDir, outputFileName);

    try {
      await captureScreenshot(browser, htmlFile, outputPath);
      console.log(`  ✓ ${screenName} → ${outputFileName}`);
      results.push({ screen: screenName, path: outputPath, success: true });
    } catch (error) {
      console.error(`  ✗ ${screenName}: ${error.message}`);
      results.push({ screen: screenName, error: error.message, success: false });
    }
  }

  await browser.close();

  // Write manifest
  const manifestPath = path.join(outputDir, 'capture-manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify({
    capturedAt: new Date().toISOString(),
    suffix,
    results
  }, null, 2));

  console.log(`\nManifest written to ${manifestPath}`);

  const successCount = results.filter(r => r.success).length;
  console.log(`\nCompleted: ${successCount}/${inputFiles.length} screenshots captured`);

  process.exit(successCount === inputFiles.length ? 0 : 1);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
```

---

## Modifications to Existing Files

### SKILL.md Changes

Add to the "Extraction Process" section after Phase 6:

```markdown
### Phase 7: Visual Convergence (--converge or --thorough)

\`\`\`
Read: prompts/convergence-orchestrator.md
\`\`\`

Iteratively improves visual fidelity by comparing screenshots:

1. **Capture** rendered HTML screenshots (Puppeteer)
2. **Compare** against Figma screenshots (parallel Opus agents)
3. **Aggregate** discrepancies and calculate fidelity score
4. **Apply** high-confidence fixes (tokens first, then CSS)
5. **Repeat** until fidelity ≥95% or max 5 iterations

| Metric | Target | Action if Below |
|--------|--------|-----------------|
| Overall fidelity | ≥95% | Continue iterating |
| Per-screen fidelity | ≥90% | Flag for review |
| Iteration count | ≤5 | Stop, report plateau |

Output:
- `preview/layouts/rendered/*.png` (iteration screenshots)
- `preview/layouts/data/*-discrepancies-iter-N.json`
- `preview/layouts/data/convergence-report.json`
```

### CHECKLIST.md Changes

Add new section:

```markdown
## Phase 7: Visual Convergence

- [ ] Capture rendered screenshots for all screens
- [ ] For EACH screen (PARALLEL):
  - [ ] Compare Figma vs rendered screenshot
  - [ ] Output discrepancies JSON
- [ ] Aggregate all discrepancy reports
- [ ] Apply high-confidence token fixes
- [ ] Apply high-confidence screen-specific fixes
- [ ] Re-capture screenshots
- [ ] Check convergence (fidelity ≥95%?)
- [ ] If not converged and iteration < 5: repeat
- [ ] Generate convergence-report.json
```

---

---

## Extended Parallelization: Token Extraction Agents

### The Insight

The convergence loop (Phase 7) isn't the only place for parallel agents. **Phase 2 (Token Extraction)** can also be parallelized:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  PHASE 1: CONNECT (Sequential - must happen first)                          │
│  - Fetch file structure via Figma API                                       │
│  - Cache response for subsequent phases                                      │
│  - Model: None (just API calls)                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼ (file data cached)
┌─────────────────────────────────────────────────────────────────────────────┐
│  PHASE 2: EXTRACT TOKENS (Parallel - no dependencies between these!)        │
│                                                                             │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐                │
│  │  Colors   │  │Typography │  │  Spacing  │  │  Effects  │                │
│  │  Agent    │  │  Agent    │  │  Agent    │  │  Agent    │                │
│  │  (Haiku)  │  │  (Haiku)  │  │  (Haiku)  │  │  (Haiku)  │                │
│  └─────┬─────┘  └─────┬─────┘  └─────┬─────┘  └─────┬─────┘                │
│        │              │              │              │                       │
│        ▼              ▼              ▼              ▼                       │
│   colors.css    typography.css  spacing.css   effects.css                   │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  PHASE 3: EXTRACT SPECS (Parallel)                                          │
│                                                                             │
│  ┌───────────┐  ┌───────────┐                                              │
│  │Components │  │  Layouts  │                                              │
│  │  Agent    │  │  Agent    │                                              │
│  │ (Sonnet)  │  │ (Sonnet)  │                                              │
│  └───────────┘  └───────────┘                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Why Haiku for Token Extraction?

| Task | What It Does | Why Haiku Suffices |
|------|--------------|-------------------|
| Colors | Parse `styles` array, convert RGBA → hex | Pure data transformation |
| Typography | Extract font family, size, weight | Structured field extraction |
| Spacing | Find auto-layout gaps, build scale | Pattern matching in numbers |
| Effects | Parse shadow/blur values | Structured field extraction |

These are **mechanical transformations** - no judgment, no vision, no complex reasoning.

### Figma API Rate Limit Strategy

**Problem**: Figma rate limits (~30 req/min free tier)

**Solution**: Batch API calls, parallelize processing

```
WRONG APPROACH:
─────────────────
Agent 1: GET /styles (colors)     ← API call
Agent 2: GET /styles (typography) ← API call (duplicate!)
Agent 3: GET /styles (effects)    ← API call (duplicate!)
Result: 3 API calls for same data, wastes rate limit

RIGHT APPROACH:
─────────────────
Phase 1: GET /files/{key} + GET /files/{key}/styles  ← 2 API calls total
         Cache response to: figma-cache.json

Phase 2: All agents READ from cache, no API calls
         Agent 1: Parse colors from cache    ← File read
         Agent 2: Parse typography from cache ← File read
         Agent 3: Parse effects from cache   ← File read
Result: 2 API calls total, agents work on cached data
```

### Token Extraction Agent Template

**File:** `prompts/token-extraction-agent.md`

```markdown
# Token Extraction Agent: {tokenType}

You are extracting {tokenType} tokens from cached Figma data.

## Input

Read the cached Figma data from:
`design-system/.cache/figma-styles.json`

## Your Task

Extract all {tokenType} styles and convert to CSS custom properties.

### For Colors:
- Find all styles with `styleType: "FILL"`
- Convert RGBA to hex: `rgba(r, g, b, a)` → `#rrggbb` or `rgba()`
- Detect gradients and convert to CSS gradient syntax
- Categorize: primitives (gray-100, blue-500) vs semantic (primary, error)

### For Typography:
- Find all styles with `styleType: "TEXT"`
- Extract: fontFamily, fontSize, fontWeight, lineHeight, letterSpacing
- Convert to CSS custom properties

### For Spacing:
- Analyze auto-layout properties in components
- Identify the spacing scale (4px, 8px, 12px, 16px, 24px, 32px, etc.)
- Create CSS custom properties for each scale step

### For Effects:
- Find all styles with `styleType: "EFFECT"`
- Extract shadows: offset, blur, spread, color
- Extract border radius values from components
- Convert to CSS

## Output

Write CSS to: `design-system/tokens/{tokenType}.css`

Format:
```css
:root {
  /* {TokenType} Tokens - extracted from Figma */
  --{category}-{name}: {value};
}
```

Also write extraction metadata to:
`design-system/tokens/.meta/{tokenType}.json`
```

### All Extraction Agents Summary

| Agent | Model | Input | Output | Parallel Group |
|-------|-------|-------|--------|----------------|
| Colors | Haiku | figma-cache.json | tokens/colors.css | Phase 2 |
| Typography | Haiku | figma-cache.json | tokens/typography.css | Phase 2 |
| Spacing | Haiku | figma-cache.json | tokens/spacing.css | Phase 2 |
| Effects | Haiku | figma-cache.json | tokens/effects.css | Phase 2 |
| Icons | Haiku | figma-cache.json | assets/icon-manifest.json | Phase 3 |
| Components | Sonnet | figma-cache.json | specs/components.md | Phase 3 |
| Layouts | Sonnet | figma-cache.json | specs/layouts/*.md | Phase 3 |
| Screen Compare | Opus | screenshots (2) | discrepancies.json | Phase 7 |

### Spawning Token Agents in Parallel

```markdown
## In the orchestrator (main conversation):

After caching Figma data, spawn all 4 token agents in ONE message:

Task(subagent_type="general-purpose", model="haiku",
     prompt="Extract COLORS from design-system/.cache/figma-styles.json...")

Task(subagent_type="general-purpose", model="haiku",
     prompt="Extract TYPOGRAPHY from design-system/.cache/figma-styles.json...")

Task(subagent_type="general-purpose", model="haiku",
     prompt="Extract SPACING from design-system/.cache/figma-styles.json...")

Task(subagent_type="general-purpose", model="haiku",
     prompt="Extract EFFECTS from design-system/.cache/figma-styles.json...")

All 4 run simultaneously, each writes its own output file.
```

### Cost Comparison: Sequential vs Parallel

| Approach | Time | Cost | Notes |
|----------|------|------|-------|
| Sequential (current) | ~4 min | ~$0.10 | One agent at a time |
| Parallel Haiku (new) | ~1 min | ~$0.04 | 4 agents simultaneously, cheaper model |

**Parallel is faster AND cheaper** because Haiku is ~10x cheaper than Sonnet.

---

## Prerequisites for Screenshot Capture

The convergence loop requires capturing screenshots of rendered HTML files. This needs:

### Required: Node.js + Puppeteer

```bash
# Install Node.js (if not already installed)
brew install node

# In the skill directory, set up dependencies
cd .claude/skills/figma-extraction
npm init -y
npm install puppeteer glob
```

### Confirmed: Node.js is Available

User confirmed Node.js is installed. Puppeteer-based screenshot capture will be used.

### Directory Setup

```bash
mkdir -p .claude/skills/figma-extraction/scripts
mkdir -p design-system/preview/layouts/rendered
```

---

## Gap Analysis & Solutions

### Gap 1: Agent Coordination Mechanism

**Problem**: How does the orchestrator know when parallel agents are done?

**Solution**: The Task tool **blocks by default** - when I spawn 6 agents in one message, I wait until all return. However, we need:

```typescript
// Coordination rules:
1. Task() calls in ONE message = parallel execution
2. Tool returns after ALL agents complete
3. Each agent writes output file BEFORE returning
4. Orchestrator reads all output files after Task returns

// Failure handling:
- If agent fails: Still get result (with error status)
- Check each result: result.success or result.error
- Partial success: Proceed with available screens, flag missing ones
```

### Gap 2: Phase State Management

**Problem**: No central tracking of extraction progress.

**Solution**: Add `design-system/extraction-state.json`:

```json
{
  "extractionId": "uuid",
  "figmaFileKey": "abc123",
  "startedAt": "2026-01-19T10:00:00Z",
  "currentPhase": 2,
  "phases": {
    "1-connect": { "status": "completed", "completedAt": "...", "outputs": ["figma-cache.json"] },
    "2-tokens": { "status": "in_progress", "completed": ["colors", "typography"], "pending": ["spacing", "effects"] },
    "3-specs": { "status": "pending" },
    "5-preview": { "status": "pending" },
    "7-converge": { "status": "pending" }
  },
  "errors": [],
  "canResume": true,
  "lastCheckpoint": "2-tokens:typography"
}
```

**Usage**:
- Before each phase: Check if previous phase completed
- After each step: Update state file
- On error: Set `canResume: true` with checkpoint
- On resume: Read state, skip completed work

### Gap 3: Error Recovery & Rollback

**Problem**: What if fixes break HTML or agent produces bad JSON?

**Solutions**:

| Error Type | Recovery Strategy |
|------------|-------------------|
| Invalid JSON from agent | Retry once, then skip screen with warning |
| Fix application fails | Backup file before edit, restore on failure |
| HTML breaks after fix | Keep per-iteration backups, rollback to last good |
| API rate limit | Exponential backoff: 1s, 2s, 4s, then fail |

**Backup Strategy**:
```
design-system/
└── .backups/
    ├── tokens/
    │   └── colors.css.bak-iter-1
    └── preview/layouts/
        └── Billing.html.bak-iter-1
```

### Gap 4: Inter-Phase Dependencies

**Dependency Graph**:
```
Phase 1 (Connect)
    │
    ├── MUST complete before anything else
    │
    ▼
Phase 2 (Tokens) ────────────────────────────┐
    │                                        │
    │ CAN run in parallel:                   │
    │ colors, typography, spacing, effects   │
    │                                        │
    │ BUT: All 4 must complete before        │
    │      Phase 3 starts (specs need        │
    │      tokens for validation)            │
    │                                        │
    ▼                                        │
Phase 3 (Specs)                              │
    │                                        │
    │ CAN run in parallel:                   │
    │ components, layouts                    │
    │                                        │
    ▼                                        │
Phase 5 (Preview) ◄──────────────────────────┘
    │                                        │
    │ Requires: tokens + layouts             │
    │                                        │
    ▼
Phase 7 (Converge)
    │
    │ Requires: Figma screenshots + rendered HTML
    │
    ▼
DONE
```

**Partial Completion Rules**:
- Phase 2: ALL token types must complete (they're referenced together in CSS)
- Phase 3: Components and Layouts can fail independently
- Phase 7: Can run with subset of screens (warn about missing)

### Gap 5: User-Facing Progress & Control

**Progress Output** (shown during extraction):
```
╔══════════════════════════════════════════════════════════╗
║  EXTRACTION PROGRESS                                      ║
╠══════════════════════════════════════════════════════════╣
║  Phase 1: Connect          ✓ Complete                    ║
║  Phase 2: Tokens           ▶ In Progress (2/4)           ║
║    ├── colors.css          ✓                             ║
║    ├── typography.css      ✓                             ║
║    ├── spacing.css         ⏳ Running...                 ║
║    └── effects.css         ⏳ Running...                 ║
║  Phase 3: Specs            ○ Pending                     ║
║  Phase 5: Preview          ○ Pending                     ║
║  Phase 7: Converge         ○ Pending                     ║
╚══════════════════════════════════════════════════════════╝
```

**Command Flags**:
```bash
/extract-design <url>              # Full extraction
/extract-design <url> --resume     # Resume from last checkpoint
/extract-design <url> --phase=7    # Run only Phase 7 (assumes prereqs done)
/extract-design <url> --skip=2     # Skip Phase 2 (tokens)
/extract-design <url> --dry-run    # Show what would happen, don't execute
```

### Gap 6: Timeout & Cancellation

**Agent Timeouts**:
```typescript
// Per-agent timeout configuration
const AGENT_TIMEOUTS = {
  'token-extraction': 60_000,    // 1 minute (Haiku is fast)
  'spec-extraction': 180_000,    // 3 minutes (Sonnet, more complex)
  'screen-comparison': 300_000,  // 5 minutes (Opus, vision is slow)
};

// Task tool supports timeout parameter
Task(
  subagent_type="general-purpose",
  model="opus",
  prompt="...",
  timeout=300_000  // 5 minutes
)
```

**Cancellation**:
- User can Ctrl+C at any time
- State file preserves progress
- Next run with `--resume` continues from checkpoint

---

## Gap 7: Context Window & Cost Management

**Problem**: Running everything on Opus 4.5 causes:
1. High cost (~$15/1M input tokens, ~$75/1M output tokens)
2. Context window exhaustion on long extractions
3. Conversation history bloat

**Solutions**:

### 7a. Aggressive Model Tiering

| Task | Model | Cost Reduction |
|------|-------|----------------|
| Token extraction (colors, typography, spacing, effects) | Haiku | 95% cheaper |
| JSON parsing, file aggregation | Haiku | 95% cheaper |
| Spec extraction (components, layouts) | Sonnet | 80% cheaper |
| Fix deduplication, prioritization | Sonnet | 80% cheaper |
| **Only vision comparison** | Opus | Full price (necessary) |

**Estimated savings**: ~70% cost reduction vs all-Opus approach

### 7b. Context Isolation via Subagents

Each subagent starts with **empty context** (no conversation history):
- Receives only: prompt + file paths to read
- No accumulation of previous turns
- Dies after task, freeing context

```
MAIN CONVERSATION (accumulates context)
    │
    ├─► Spawn Agent A (fresh context) → writes file → dies
    ├─► Spawn Agent B (fresh context) → writes file → dies
    └─► Read results from files (small)
```

### 7c. File-Based State (not conversation-based)

Instead of keeping results in conversation context:
```
❌ BAD:  "I extracted these 500 colors: #fff, #000, ..."
✓ GOOD: "Colors written to tokens/colors.css (127 tokens)"
```

All data goes to files. Conversation only tracks:
- What phase we're in
- What succeeded/failed
- Next steps

### 7d. Checkpoint-Resume for Long Extractions

If context runs out mid-extraction:
1. State persisted to `extraction-state.json`
2. User runs `/extract-design <url> --resume`
3. New conversation reads state, continues from checkpoint

### 7e. Prompt Compression for Subagents

Keep subagent prompts minimal:
```
❌ BAD:  Include full SKILL.md (500+ lines) in every agent prompt
✓ GOOD: Include only the specific task instructions (~50 lines)
```

Template variables filled in, not the entire prompt library.

---

## Verification Steps

After implementation, test:

1. **Script Test**: Run `capture-screenshots.js` on Billing.html
   ```bash
   node scripts/capture-screenshots.js --files design-system/preview/layouts/Billing.html --output design-system/preview/layouts/rendered --suffix -test
   ```
   Expected: `rendered/Billing-test.png` created at 1440x1024

2. **Single Comparison**: Spawn one comparison agent for Billing
   Expected: `data/Billing-discrepancies-iter-1.json` with valid structure

3. **Fix Application**: Apply one token fix manually, verify HTML reflects change

4. **Full Loop**: Run `--converge` on all screens
   Expected: Fidelity improves over iterations, stops at ≥95% or iteration 5
