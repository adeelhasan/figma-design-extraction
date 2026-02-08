# Extraction Improvement Plan

> Based on analysis of Billing page extraction gaps (50% section coverage)
> Goal: Achieve ≥90% section coverage consistently across all layouts

## Problem Summary

The current extraction missed 5 of 10 sections in the Billing page:
- ❌ salary-card (stat-card pattern)
- ❌ paypal-card (stat-card pattern)
- ❌ payment-method (card row with action button)
- ❌ billing-information (3 info-cards with actions)
- ❌ footer

Root causes:
1. Shallow traversal depth (maxDepth: 3)
2. Horizontal siblings absorbed into parent
3. Pattern detection not applied to nested children
4. Actions/buttons not captured
5. No reconciliation against visual inventory
6. **Hardcoded pattern library** — patterns are dashboard-specific, not derived from the design

---

## Improvement 0: Hybrid Pattern Discovery (Generalizable)

> **Critical for generalizability**: Instead of hardcoding patterns like "stat-card" or "credit-card",
> derive patterns dynamically from the Figma file itself.

### Pattern Discovery Priority

```
┌─────────────────────────────────────────────────────────────────────┐
│  Priority 1: FIGMA COMPONENTS (Highest Confidence)                  │
│  Designer-defined reusable patterns with explicit names             │
│  Source: componentId, mainComponent references                      │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼ (fills gaps)
┌─────────────────────────────────────────────────────────────────────┐
│  Priority 2: VISUAL ANALYSIS                                        │
│  Screenshot-based pattern detection for non-component elements      │
│  Source: Visual inventory analysis                                  │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼ (fallback)
┌─────────────────────────────────────────────────────────────────────┐
│  Priority 3: STRUCTURAL HEURISTICS                                  │
│  Fingerprint-based clustering when neither above works              │
│  Source: Node structure analysis                                    │
└─────────────────────────────────────────────────────────────────────┘
```

### Step 1: Discover Component Definitions

Query the Figma API for component metadata:

```typescript
interface ComponentPattern {
  componentId: string;
  name: string;                    // "Stat Card", "Invoice Item"
  description?: string;           // Designer's intent
  documentationLinks?: string[];
  properties: PropertyDefinition[];
  structure: StructuralFingerprint;
  instances: string[];            // Node IDs using this component
}

async function discoverComponentPatterns(fileKey: string): Promise<ComponentPattern[]> {
  // 1. Get component metadata from file
  const response = await figmaApi.get(`/files/${fileKey}/components`);
  const components = response.meta.components;

  const patterns: ComponentPattern[] = [];

  for (const comp of components) {
    // 2. Get full node data for structure analysis
    const nodeData = await figmaApi.get(`/files/${fileKey}/nodes?ids=${comp.node_id}`);
    const node = nodeData.nodes[comp.node_id].document;

    // 3. Find all instances in the file
    const instances = await findInstancesOf(fileKey, comp.key);

    patterns.push({
      componentId: comp.key,
      name: comp.name,
      description: comp.description,
      properties: extractPropertyDefinitions(node),
      structure: computeStructuralFingerprint(node),
      instances: instances.map(i => i.id)
    });
  }

  return patterns;
}
```

### Step 2: Visual Analysis Gap Detection

For sections not covered by components, use visual analysis:

```typescript
interface VisualPattern {
  id: string;
  inferredType: string;           // "stat-display", "card-row"
  confidence: number;             // 0-1
  visualSignature: {
    hasIcon: boolean;
    hasLargeText: boolean;
    hasSubtext: boolean;
    colorScheme: string[];
    approximateLayout: 'horizontal' | 'vertical' | 'grid';
  };
  matchedNodeIds: string[];
}

function analyzeVisualGaps(
  inventory: VisualInventory,
  componentPatterns: ComponentPattern[]
): VisualPattern[] {
  const visualPatterns: VisualPattern[] = [];

  for (const section of inventory.sections) {
    // Check if already covered by a component
    const hasComponentMatch = componentPatterns.some(cp =>
      cp.instances.some(inst =>
        section.nodeIds?.includes(inst) ||
        nodeIsChildOf(inst, section.nodeIds)
      )
    );

    if (!hasComponentMatch) {
      // This section needs visual pattern inference
      visualPatterns.push({
        id: section.id,
        inferredType: inferTypeFromVisualCues(section),
        confidence: calculateConfidence(section),
        visualSignature: extractVisualSignature(section),
        matchedNodeIds: section.nodeIds || []
      });
    }
  }

  return visualPatterns;
}
```

### Step 3: Structural Fingerprinting Fallback

For elements with no component and ambiguous visuals:

```typescript
interface StructuralFingerprint {
  childTypes: string[];           // ['TEXT', 'FRAME', 'TEXT']
  layoutMode: string;
  depth: number;
  textCount: number;
  frameCount: number;
  hasIcon: boolean;
  hasImage: boolean;
}

function computeStructuralFingerprint(node: FigmaNode): StructuralFingerprint {
  return {
    childTypes: node.children?.map(c => c.type) || [],
    layoutMode: node.layoutMode || 'NONE',
    depth: computeMaxDepth(node),
    textCount: countNodeType(node, 'TEXT'),
    frameCount: countNodeType(node, 'FRAME'),
    hasIcon: hasIconChild(node),
    hasImage: hasImageChild(node)
  };
}

function clusterByFingerprint(nodes: FigmaNode[]): Map<string, FigmaNode[]> {
  const clusters = new Map<string, FigmaNode[]>();

  for (const node of nodes) {
    const fp = computeStructuralFingerprint(node);
    const key = fingerprintToKey(fp);  // Normalize to comparable string

    if (!clusters.has(key)) {
      clusters.set(key, []);
    }
    clusters.get(key)!.push(node);
  }

  return clusters;
}
```

### Step 4: Unified Pattern Registry

Combine all sources into a single registry used during extraction:

```typescript
interface PatternRegistry {
  patterns: Map<string, UnifiedPattern>;

  // Methods
  getPatternForNode(nodeId: string): UnifiedPattern | null;
  getPatternByFingerprint(fp: StructuralFingerprint): UnifiedPattern | null;
  getAllPatternsOfType(type: string): UnifiedPattern[];
}

interface UnifiedPattern {
  id: string;
  name: string;
  source: 'component' | 'visual' | 'structural';
  confidence: number;
  requiredFields: string[];       // Derived from structure
  optionalFields: string[];
  extractionHints: {
    lookForText: boolean;
    lookForIcon: boolean;
    expectChildren: number;
  };
}

async function buildPatternRegistry(
  fileKey: string,
  visualInventory: VisualInventory
): Promise<PatternRegistry> {
  // 1. Components first (highest confidence)
  const componentPatterns = await discoverComponentPatterns(fileKey);

  // 2. Visual analysis for gaps
  const visualPatterns = analyzeVisualGaps(visualInventory, componentPatterns);

  // 3. Structural clustering for remainder
  const uncoveredNodes = findUncoveredNodes(visualInventory, componentPatterns, visualPatterns);
  const structuralClusters = clusterByFingerprint(uncoveredNodes);

  // 4. Merge into unified registry
  return mergeIntoRegistry(componentPatterns, visualPatterns, structuralClusters);
}
```

### Why This Generalizes

| Approach | Generalizability |
|----------|------------------|
| Hardcoded patterns | ❌ Only works for known UI types |
| Component-first | ✓ Works for any design system using components |
| Visual analysis | ✓ Works for any visual layout |
| Structural clustering | ✓ Works for any node structure |
| **Hybrid (all three)** | ✓✓ Works across all design systems |

### Integration Point

This pattern discovery runs **before** all other improvements:

```
Pattern Discovery (Improvement 0)
        │
        ▼ (PatternRegistry)
Deep Traversal (Improvement 1) ─────────────────┐
        │                                        │
        ▼                                        │
Row-Aware Extraction (Improvement 2)            │
        │                                        │
        ▼                                        │
Inventory-Driven Extraction (Improvement 3) ◄───┘
        │
        ▼ (uses PatternRegistry.getPatternForNode)
Pattern Validation (Improvement 4)
        │
        ...
```

---

## Improvement 1: Mandatory Deep Traversal

### Current Behavior
```typescript
const STANDARD_CONFIG: TraversalConfig = {
  maxDepth: 3,  // Too shallow for dashboard layouts
  minSectionSize: 100,
  gapThreshold: 16
};
```

### New Behavior
```typescript
const DASHBOARD_CONFIG: TraversalConfig = {
  maxDepth: 10,  // Deep enough for nested cards
  minSectionSize: 50,  // Catch smaller stat cards
  gapThreshold: 8,
  expandHorizontalSiblings: true,  // NEW: Don't absorb rows
  patternMatchFirst: true  // NEW: Try pattern matching before filtering
};

// Auto-detect dashboard layouts and use deep config
function selectConfig(frame: FigmaNode): TraversalConfig {
  const pattern = detectLayoutPattern(frame);
  if (pattern === 'dashboard-grid' || pattern === 'card-layout') {
    return DASHBOARD_CONFIG;
  }
  return STANDARD_CONFIG;
}
```

### Implementation Location
Update: [extract-layouts.md](extract-layouts.md) Step 3: Analyze Section Structure

---

## Improvement 2: Row-Aware Extraction

### Problem
Horizontal rows with multiple cards are extracted as single sections.

### Solution
Before section extraction, identify all horizontal container rows:

```typescript
interface LayoutRow {
  id: string;
  name: string;
  expectedChildCount: number;
  children: { id: string; name: string; pattern?: string }[];
}

function identifyLayoutRows(frame: FigmaNode): LayoutRow[] {
  const rows: LayoutRow[] = [];

  traverseDeep(frame, (node) => {
    // Horizontal auto-layout with multiple direct children
    if (node.layoutMode === 'HORIZONTAL' && node.children?.length > 1) {
      const childrenLookLikeSections = node.children.every(c =>
        c.type === 'FRAME' && c.absoluteBoundingBox?.width > 100
      );

      if (childrenLookLikeSections) {
        rows.push({
          id: node.id,
          name: node.name,
          expectedChildCount: node.children.length,
          children: node.children.map(c => ({
            id: c.id,
            name: c.name,
            pattern: detectUIPattern(c)
          }))
        });
      }
    }
  });

  return rows;
}
```

### Extraction Rule
**If a row is identified with N children, the extraction MUST produce N sections from that row.**

---

## Improvement 3: Inventory-Driven Extraction

### Current Flow
```
Visual Analysis → Inventory → Extraction → Verification
                     ↓             ↓
              (not connected)  (post-hoc check)
```

### New Flow
```
Visual Analysis → Inventory → Extraction → Reconciliation Loop
                     ↓             ↑              ↓
              Target List ───────────────→ Re-extract if missing
```

### Implementation

```typescript
interface ExtractionTarget {
  sectionId: string;
  pattern: string;
  location: string;  // "top-row-second"
  expectedContent: string[];  // ["$2,000", "Salary"]
  required: boolean;
}

function extractWithTargets(
  frame: FigmaNode,
  targets: ExtractionTarget[]
): ExtractionResult {
  const extracted: Section[] = [];
  const missing: ExtractionTarget[] = [];

  // Pass 1: Standard extraction
  const sections = extractSectionsRecursive(frame, DASHBOARD_CONFIG);

  // Pass 2: Match against targets
  for (const target of targets) {
    const match = sections.find(s =>
      s.id === target.sectionId ||
      s.name.toLowerCase().includes(target.sectionId) ||
      matchesByContent(s, target.expectedContent)
    );

    if (match) {
      extracted.push(match);
    } else {
      missing.push(target);
    }
  }

  // Pass 3: Targeted re-extraction for missing
  for (const target of missing) {
    const section = targetedExtract(frame, target);
    if (section) {
      extracted.push(section);
    }
  }

  return { extracted, stillMissing: missing.filter(t => !extracted.find(s => s.id === t.sectionId)) };
}
```

---

## Improvement 4: Pattern-Specific Required Fields

Each UI pattern must have validated fields:

### Stat Card Pattern
```typescript
interface StatCardValidation {
  required: ['icon', 'value', 'label'];
  optional: ['sublabel', 'trend'];
  valueFormat: /[\$\€\£]?[\d,]+/;  // Currency or number
}

function validateStatCard(section: Section): ValidationResult {
  const content = section.content;
  const missing: string[] = [];

  if (!content.icon && !content.iconBox) missing.push('icon');
  if (!content.value || !StatCardValidation.valueFormat.test(content.value)) {
    missing.push('value');
  }
  if (!content.label) missing.push('label');

  return {
    valid: missing.length === 0,
    missing,
    section
  };
}
```

### Pattern Validation Table

| Pattern | Required Fields | Validation |
|---------|-----------------|------------|
| stat-card | icon, value, label | value matches currency/number format |
| credit-card | number, holder, expires | number is 16 digits (possibly masked) |
| info-card | title, fields[], actions[] | fields is array of {label, value} |
| list-section | title, items[] | items.length matches inventory count |
| transaction-item | name, date, amount | amount has +/- prefix |

---

## Improvement 5: Sibling-Aware Pattern Extraction

When a pattern is detected, automatically extract siblings:

```typescript
function extractPatternWithSiblings(
  node: FigmaNode,
  pattern: PatternType
): Section[] {
  const sections: Section[] = [];

  // Extract the found node
  sections.push(extractByPattern(node, pattern));

  // Check parent for similar siblings
  const parent = findParent(node);
  if (parent?.layoutMode === 'HORIZONTAL' || parent?.layoutMode === 'VERTICAL') {
    for (const sibling of parent.children) {
      if (sibling.id !== node.id) {
        const siblingPattern = detectUIPattern(sibling);
        if (siblingPattern === pattern) {
          sections.push(extractByPattern(sibling, pattern));
        }
      }
    }
  }

  return sections;
}
```

---

## Improvement 6: Action Button Detection

### Current Issue
Actions like "VIEW ALL", "ADD NEW CARD" are missed.

### Solution
Multi-location action scanning:

```typescript
const ACTION_KEYWORDS = [
  'VIEW ALL', 'VIEW MORE', 'SEE ALL', 'SEE MORE',
  'ADD', 'ADD NEW', 'CREATE', 'NEW',
  'DELETE', 'REMOVE', 'EDIT', 'UPDATE',
  'PDF', 'DOWNLOAD', 'EXPORT'
];

function extractActions(section: FigmaNode): Action[] {
  const actions: Action[] = [];
  const textNodes = findAllTextNodes(section);

  for (const textNode of textNodes) {
    const text = textNode.characters?.toUpperCase() || '';

    for (const keyword of ACTION_KEYWORDS) {
      if (text.includes(keyword)) {
        actions.push({
          type: inferActionType(keyword),
          label: textNode.characters,
          location: getRelativePosition(textNode, section)  // 'header', 'inline', 'footer'
        });
      }
    }
  }

  return actions;
}
```

---

## Improvement 7: Reconciliation Report

After extraction, generate a detailed reconciliation:

```markdown
## Extraction Reconciliation: Billing

### Section Coverage: 10/10 (100%) ✓

| Inventory Section | Extracted | Pattern | Content Match |
|-------------------|-----------|---------|---------------|
| sidebar | ✓ | navigation | ✓ |
| header | ✓ | header | ✓ |
| credit-card | ✓ | credit-card | ✓ |
| salary-card | ✓ | stat-card | ✓ |
| paypal-card | ✓ | stat-card | ✓ |
| invoices-list | ✓ | list | 5/5 items |
| payment-method | ✓ | card | 2 cards + action |
| billing-information | ✓ | info-list | 3/3 cards |
| transactions | ✓ | transaction-list | 7/7 items |
| footer | ✓ | footer | ✓ |

### Action Coverage: 8/8 (100%) ✓

| Section | Expected Actions | Found |
|---------|-----------------|-------|
| invoices-list | VIEW ALL | ✓ |
| payment-method | ADD NEW CARD | ✓ |
| billing-information | DELETE (×3), EDIT (×3) | ✓ |
| invoices items | PDF (×5) | ✓ |
```

---

## Implementation Priority

0. **CRITICAL:** Hybrid pattern discovery (enables generalizability)
1. **HIGH:** Deep traversal for dashboard layouts (immediate fix)
2. **HIGH:** Row-aware extraction (catches sibling cards)
3. **MEDIUM:** Inventory-driven extraction loop
4. **MEDIUM:** Pattern validation with required fields
5. **LOW:** Action button detection enhancement
6. **LOW:** Reconciliation report generation

---

## Testing the Improvements

After implementing, re-run extraction on Billing page:

```bash
/sync --check  # Preview what would change
/sync Billing  # Re-extract just Billing
```

Expected outcome:
- Section coverage: 50% → 90%+
- Missing stat-cards: captured
- Missing payment-method: captured
- Missing billing-information: captured
- Actions: VIEW ALL, ADD NEW CARD captured

---

## Generalizable to Other Layouts

These improvements apply to any dashboard layout:
- Profile page (similar card-heavy structure)
- Dashboard page (stat cards, chart sections)
- Any page with grid/card layouts

The key principle: **Visual inventory is ground truth. Extraction must reconcile against it.**

---

## Improvement 8: Claude Code Settings Configuration

### Problem

Running the extraction skill requires repeated permission approvals:
1. Each Python script invocation prompts for permission
2. Writing Figma API responses to cache requires permission
3. `settings.local.json` accumulates cruft from one-off approvals

### Solution

Configure `.claude/settings.json` with proper permission patterns upfront.

### Updated settings.json

```json
{
  "$schema": "https://json.schemastore.org/claude-code-settings.json",
  "permissions": {
    "allow": [
      "Read(.claude/**)",
      "Read(src/**)",
      "Read(design-system/**)",

      "Write(src/components/**)",
      "Write(design-system/**)",
      "Write(design-system/.cache/**)",

      "Bash(python3 *)",
      "Bash(python *)",
      "Bash(./scripts/*)",
      "Bash(curl *)",
      "Bash(mkdir *)",
      "Bash(ls *)",
      "Bash(cat *)",
      "Bash(npx *)",
      "Bash(npm *)",
      "Bash(node *)",

      "WebFetch(domain:api.figma.com)",
      "WebFetch(domain:www.figma.com)",
      "WebFetch(domain:mcp.figma.com)",
      "WebFetch(domain:developers.figma.com)",
      "WebFetch(domain:figma.com)",

      "Skill(extract-design)",
      "Skill(sync)",
      "Skill(preview-tokens)",
      "Skill(clean)",

      "mcp__figma__get_metadata",
      "mcp__figma__get_variable_defs",
      "mcp__figma__get_design_context",
      "mcp__figma__get_screenshot",
      "mcp__figma__whoami",
      "mcp__figma__get_code_connect_map"
    ]
  },
  "hooks": {
    "UserPromptSubmit": [
      {
        "matcher": "/extract-design",
        "hooks": [
          {
            "type": "command",
            "command": "./scripts/check-existing-output.sh"
          }
        ]
      }
    ]
  }
}
```

### Key Changes

| Before | After | Why |
|--------|-------|-----|
| `Bash(python3:*)` | `Bash(python3 *)` | Colon syntax doesn't match space-separated args |
| No cache write | `Write(design-system/.cache/**)` | Allow caching Figma API responses |
| Scattered in local | Consolidated in main | Single source of truth |

### Cache Directory Setup

The cache directory is created automatically by `init-extraction.py` during pre-flight. The `.gitignore` already includes `design-system-latest` and cache patterns.

### Clean settings.local.json

After updating `settings.json`, reset `settings.local.json` to minimal:

```json
{
  "permissions": {
    "allow": []
  }
}
```

Any new one-off permissions will accumulate here, keeping `settings.json` clean.

### Verification

After applying these changes, running `/extract-design` or `/sync` should:
- ✓ Execute Python scripts without prompts
- ✓ Write to cache directory without prompts
- ✓ Call Figma MCP tools without prompts
- ✓ Run shell scripts without prompts

---

## Improvement 9: Screen Agents Must Use Asset Manifest for Images

### Problem

Screen extraction agents (Phase 5) generate HTML previews with gradient placeholder divs instead of referencing actual downloaded images from Phase 4b. The asset manifest (`assets/asset-manifest.json`) maps every image to its screen and section, but the `extract-screen.md` prompt never instructs agents to read it.

### Impact

- All avatars render as colored circles with initials instead of photos
- All banners/backgrounds render as flat gradients instead of images
- All illustrations render as "Project Image" text placeholders
- Preview fidelity is significantly degraded

### Solution

Update `extract-screen.md` to:

1. **Read asset manifest** at the start of screen extraction:
   ```
   Read ${OUTPUT_DIR}/assets/asset-manifest.json and filter for images where
   usedIn[].screenName matches the current screen name.
   ```

2. **Wire image paths into HTML** using relative paths from `preview/layouts/` to `assets/images/`:
   ```
   ../../assets/images/{category}/{filename}.png
   ```

3. **Always include gradient fallback backgrounds** on image containers, since Figma API sometimes exports images at wrong dimensions (e.g., 44x44 thumbnails for 255x180 illustrations).

### Additional Fix: Use `<link>` Tags Not `@import`

Screen agents generate CSS token imports as `@import` inside `<style>` tags. This is unreliable on `file://` protocol. The prompt should specify:

```html
<!-- Use <link> tags in <head>, NOT @import inside <style> -->
<link rel="stylesheet" href="../../tokens/colors.css">
<link rel="stylesheet" href="../../tokens/typography.css">
<link rel="stylesheet" href="../../tokens/spacing.css">
<link rel="stylesheet" href="../../tokens/effects.css">
```

### Additional Fix: Don't Use CSS Grid for Fixed Sidebar Layouts

Screen agents use `display: grid; grid-template-columns: 273px 1fr;` on the page layout, but the sidebar is `position: fixed`. Fixed elements are removed from grid flow, causing the main content to collapse into the first (narrow) grid column. The prompt should specify:

```css
/* DON'T: grid + fixed sidebar */
.page-layout { display: grid; grid-template-columns: 273px 1fr; }
.sidebar { position: fixed; }

/* DO: simple margin offset for fixed sidebar */
.page-layout { min-height: 100vh; }
.sidebar { position: fixed; width: 250px; }
.main-content { margin-left: 273px; }
```

### Implementation Location

Update: `extract-screen.md` — add steps before HTML generation to read asset manifest and include asset paths.

---

## Improvement 10: Container-First Layout Alignment

### Problem

In the Billing HTML preview, the navbar's right edge doesn't align with the invoices card below it. This happens because the screen extraction agent maps each section to CSS grid columns independently using absolute bounding boxes, without recognizing that sections share a parent container with consistent padding. Alignment is implicit in Figma (same parent = same edges) but lost during extraction.

### Root Cause

Grid column calculations use absolute page coordinates as the denominator. Each row computes its own effective width independently, so rows with slightly different bounding boxes produce slightly different grid spans — breaking vertical edge alignment.

### Solution

Three targeted changes to `extract-screen.md` (no new scripts, agents, or pipeline phases):

1. **Container detection in Step 2**: Before grid mapping, identify the content container (shared parent of non-sidebar, non-footer sections). Extract its padding from auto-layout properties or infer from child-to-container gaps.

2. **`contentArea` schema field in Step 3**: Record the container's bounds, padding, and `effectiveWidth` (= width − left padding − right padding). All column span calculations use `effectiveWidth` as their denominator.

3. **Alignment self-check in Verification**: For each row, verify that `sum(columnSpan × columnWidth + gaps) = contentArea.effectiveWidth`. Flag rows differing by >8px for re-examination.

### Why This Works

| Phase | Before | After |
|-------|--------|-------|
| **Extraction** | Each section gets independent grid columns from absolute bounds | All sections computed relative to shared `contentArea.effectiveWidth` |
| **HTML Preview** | Navbar and cards have different effective widths | Shared `.main-content` container with consistent padding aligns edges |
| **Build** (`/build-screen`) | Already wraps sections in container | No change needed — container padding naturally aligns children |

### Why NOT Screenshot Comparison

- Project history: "LLM verification consumed time/tokens but never fixed anything"
- Requires headless browser dependency (Puppeteer/Playwright)
- Container-based alignment is deterministic — no need to verify what's structurally guaranteed

### Data Availability

`figma-query.py` node summaries already expose `layoutMode`, `itemSpacing`, `paddingLeft`, `paddingRight`, `paddingTop`, `paddingBottom` for auto-layout frames. For non-auto-layout frames, the prompt instructs agents to infer padding from child-to-container gaps.

### Implementation Location

Updated: `extract-screen.md` — Step 2 (container detection), Step 3 (schema field), Verification (alignment check).

---

## Improvement 11: Cross-Screen Shell Extraction (Phase 5a/5b Split)

### Problem

N screen agents independently extract the same sidebar, navbar, and footer — producing slightly different HTML each time. This wastes tokens (sidebar alone is ~80-160KB of Figma query data per screen), introduces visual inconsistency between screens, and makes maintenance harder.

### Root Cause

Phase 5 treats each screen as fully independent. Every agent queries the sidebar section from Figma, interprets it, and generates HTML — with no shared context. The same sidebar can end up with different nav item ordering, spacing, or active-state styling across screens.

### Solution: Phase 5a/5b Split

Split Phase 5 into two sub-phases:

```
Phase 5a: Shell Detection & Extraction  → 1 sequential agent
Phase 5b: Screen Content Extraction     → N parallel agents (compose shells + content)
```

**Phase 5a** (new `extract-shells.md` prompt):
1. Queries `screen-layout` for ALL screens
2. Compares top-level section names across screens
3. Groups sections appearing in ≥50% of screens with consistent position/dimensions
4. Picks a representative screen per shell group
5. Extracts shell HTML/CSS from representative screens
6. Writes `layout-shells.json` + HTML fragments to `preview/layouts/shells/`

**Phase 5b** (updated `extract-screen.md`):
1. Reads `layout-shells.json` to check which shells apply to this screen
2. Reads pre-built shell HTML fragments
3. Skips Figma queries for shell sections — only queries content sections
4. Composes: shells + content → full screen HTML

### Output Files

| File | Description |
|------|-------------|
| `layout-shells.json` | Shell definitions, screen-shell mapping, CSS offsets |
| `preview/layouts/shells/{name}.html` | Self-contained HTML fragments per shell |

### Benefits

| Metric | Before (Phase 5 only) | After (5a + 5b) |
|--------|----------------------|------------------|
| Sidebar queries | N screens × ~100KB | 1 query × ~100KB |
| Visual consistency | Each screen generates its own | Single source of truth |
| Active nav state | Inconsistent | `data-screen` attribute, set per screen |
| Total tokens (6 screens) | ~600KB sidebar data | ~100KB + 6 × tiny compose |

### Limitation: Name-Based Matching

Phase 5a uses Figma section name matching to detect shared shells. If a designer names the sidebar "left-panel" in one screen and "nav-container" in another, the match fails. Mitigations:

1. **Position/dimension clustering**: Sections at the same position with the same dimensions are likely the same shell, even with different names. Phase 5a applies a 20px tolerance check.
2. **Graceful fallback**: If a screen isn't in `screenShellMap` or has an empty shell list, Phase 5b falls back to full extraction (the pre-existing behavior).

### Future: Vision-Based Shell Detection (Step 3, deferred)

If name-based matching proves insufficient, a `detect-layout-shells.py` script can compare screenshot edge strips via SSIM (using Pillow/NumPy/scikit-image) to detect shared visual regions regardless of naming. This is deferred until actually needed — name matching works for well-structured Figma files.

### Implementation Location

- Created: `extract-shells.md` (Phase 5a agent prompt)
- Updated: `extract-screen.md` (Phase 5b shell composition)
- Updated: `extract-design.md` (orchestrator Phase 5a/5b split)
