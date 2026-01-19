# Inventory-Driven Extraction (Improvement 3)

> **Key Principle**: Visual inventory is ground truth. Extraction must reconcile against it.

## Purpose

Ensure extraction captures ALL sections identified in the visual inventory by implementing
a reconciliation loop that re-extracts missing sections with targeted strategies.

## How It Works

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Visual Analysis → Inventory → Extraction → Reconciliation Loop             │
│                        ↓             ↑              ↓                       │
│                 Target List ───────────────→ Re-extract if missing          │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Process

### Step 1: Load Visual Inventory as Extraction Targets

```typescript
interface ExtractionTarget {
  sectionId: string;
  pattern: string;
  location: string;              // "top-row-second", "bottom-left"
  expectedContent: string[];     // ["$2,000", "Salary"]
  required: boolean;             // Is this section critical?
  bounds?: {
    approximate: string;
    width?: string;
    height?: string;
  };
}

function loadExtractionTargets(inventoryPath: string): ExtractionTarget[] {
  const inventory = loadJson(inventoryPath);
  const targets: ExtractionTarget[] = [];

  for (const section of inventory.sections) {
    targets.push({
      sectionId: section.id,
      pattern: section.pattern || section.type,
      location: section.location,
      expectedContent: extractExpectedContent(section),
      required: !isDecorative(section),
      bounds: section.bounds
    });
  }

  return targets;
}

function extractExpectedContent(section: InventorySection): string[] {
  const content: string[] = [];

  if (section.content?.value) content.push(section.content.value);
  if (section.content?.label) content.push(section.content.label);
  if (section.content?.sublabel) content.push(section.content.sublabel);
  if (section.headerAction) content.push(section.headerAction);

  return content;
}

function isDecorative(section: InventorySection): boolean {
  // Decorative elements are optional
  return section.type === 'decorative' ||
         section.id.includes('background') ||
         section.id.includes('divider');
}
```

### Step 2: Three-Pass Extraction

```typescript
interface ExtractionResult {
  extracted: Section[];
  stillMissing: ExtractionTarget[];
  coverage: number;
}

async function extractWithTargets(
  frame: FigmaNode,
  targets: ExtractionTarget[],
  patternRegistry: PatternRegistry,
  config: TraversalConfig
): Promise<ExtractionResult> {
  const extracted: Section[] = [];
  const missing: ExtractionTarget[] = [];

  // ═══════════════════════════════════════════════════════════════════════════
  // PASS 1: Standard extraction with deep traversal
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('Pass 1: Standard deep extraction...');
  const standardSections = extractSectionsRecursive(frame, config, 0, '', patternRegistry);

  // Match against targets
  for (const target of targets) {
    const match = findMatchingSection(standardSections, target);
    if (match) {
      match.targetId = target.sectionId;  // Link to inventory
      extracted.push(match);
    } else {
      missing.push(target);
    }
  }

  console.log(`  Pass 1 result: ${extracted.length}/${targets.length} sections matched`);

  if (missing.length === 0) {
    return { extracted, stillMissing: [], coverage: 100 };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PASS 2: Targeted re-extraction for missing sections
  // ═══════════════════════════════════════════════════════════════════════════
  console.log(`Pass 2: Targeted extraction for ${missing.length} missing sections...`);

  const stillMissing: ExtractionTarget[] = [];

  for (const target of missing) {
    const section = targetedExtract(frame, target, patternRegistry);
    if (section) {
      section.targetId = target.sectionId;
      section.extractionPass = 2;
      extracted.push(section);
      console.log(`  ✓ Found: ${target.sectionId}`);
    } else {
      stillMissing.push(target);
      console.log(`  ✗ Still missing: ${target.sectionId}`);
    }
  }

  if (stillMissing.length === 0) {
    return { extracted, stillMissing: [], coverage: 100 };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PASS 3: Content-based search for remaining missing sections
  // ═══════════════════════════════════════════════════════════════════════════
  console.log(`Pass 3: Content-based search for ${stillMissing.length} sections...`);

  const finalMissing: ExtractionTarget[] = [];

  for (const target of stillMissing) {
    if (target.expectedContent.length > 0) {
      const section = contentBasedSearch(frame, target);
      if (section) {
        section.targetId = target.sectionId;
        section.extractionPass = 3;
        extracted.push(section);
        console.log(`  ✓ Found via content: ${target.sectionId}`);
      } else {
        finalMissing.push(target);
      }
    } else {
      finalMissing.push(target);
    }
  }

  const coverage = (extracted.length / targets.length) * 100;

  return { extracted, stillMissing: finalMissing, coverage };
}
```

### Step 3: Matching Logic

```typescript
/**
 * Find a section that matches an inventory target
 * Uses multiple matching strategies
 */
function findMatchingSection(
  sections: Section[],
  target: ExtractionTarget
): Section | null {
  // Strategy 1: Exact ID match
  const idMatch = sections.find(s => s.id === target.sectionId);
  if (idMatch) return idMatch;

  // Strategy 2: Name-based match (fuzzy)
  const nameMatch = sections.find(s =>
    s.name.toLowerCase().includes(target.sectionId.toLowerCase()) ||
    target.sectionId.toLowerCase().includes(s.name.toLowerCase())
  );
  if (nameMatch) return nameMatch;

  // Strategy 3: Pattern + location match
  const patternMatch = sections.find(s =>
    s.pattern === target.pattern &&
    locationMatches(s, target.location)
  );
  if (patternMatch) return patternMatch;

  // Strategy 4: Content match
  if (target.expectedContent.length > 0) {
    const contentMatch = sections.find(s =>
      matchesByContent(s, target.expectedContent)
    );
    if (contentMatch) return contentMatch;
  }

  return null;
}

function locationMatches(section: Section, targetLocation: string): boolean {
  if (!targetLocation) return true;

  const loc = targetLocation.toLowerCase();
  const path = section.path?.toLowerCase() || '';
  const name = section.name.toLowerCase();

  // Check for common location descriptors
  if (loc.includes('top') && section.bounds) {
    // Section should be in top 30% of screen
    // (Would need screen dimensions for accurate check)
    if (path.includes('top') || path.includes('header')) return true;
  }

  if (loc.includes('sidebar') || loc.includes('left')) {
    if (name.includes('sidebar') || name.includes('nav')) return true;
  }

  if (loc.includes('row')) {
    if (section.rowPosition) return true;
  }

  return loc.includes(name) || name.includes(loc.split('-')[0]);
}

function matchesByContent(section: Section, expectedContent: string[]): boolean {
  if (!section.content) return false;

  const sectionText = extractAllText(section).join(' ');

  // At least 50% of expected content should be found
  let matchCount = 0;
  for (const expected of expectedContent) {
    if (sectionText.includes(expected)) {
      matchCount++;
    }
  }

  return matchCount >= expectedContent.length * 0.5;
}

function extractAllText(section: Section): string[] {
  const texts: string[] = [];

  if (section.content) {
    if (typeof section.content === 'string') {
      texts.push(section.content);
    } else if (typeof section.content === 'object') {
      Object.values(section.content).forEach(v => {
        if (typeof v === 'string') texts.push(v);
      });
    }
  }

  return texts;
}
```

### Step 4: Targeted Extraction

```typescript
/**
 * Targeted extraction for a specific missing section
 * Uses more aggressive strategies to find the section
 */
function targetedExtract(
  frame: FigmaNode,
  target: ExtractionTarget,
  patternRegistry: PatternRegistry
): Section | null {
  // Strategy 1: Search by pattern in registry
  if (patternRegistry) {
    const patterns = patternRegistry.getAllPatternsOfType(target.pattern);
    for (const pattern of patterns) {
      // Check if any unextracted instances match
      for (const nodeId of pattern.nodeMatches) {
        const node = findNodeById(frame, nodeId);
        if (node && nodeMatchesTarget(node, target)) {
          return extractSectionFromNode(node, target);
        }
      }
    }
  }

  // Strategy 2: Deep search with relaxed constraints
  const relaxedConfig: TraversalConfig = {
    maxDepth: 15,  // Even deeper
    minSectionSize: 30,  // Smaller minimum
    gapThreshold: 4,
    expandHorizontalSiblings: true,
    patternMatchFirst: true,
    extractActionsInline: true
  };

  const deepSections = extractSectionsRecursive(frame, relaxedConfig, 0, '', patternRegistry);

  // Find best match with relaxed criteria
  for (const section of deepSections) {
    if (nodeMatchesTarget(section, target)) {
      return section;
    }
  }

  return null;
}

function nodeMatchesTarget(nodeOrSection: FigmaNode | Section, target: ExtractionTarget): boolean {
  const name = ('name' in nodeOrSection ? nodeOrSection.name : nodeOrSection.name || '').toLowerCase();
  const targetId = target.sectionId.toLowerCase();

  // Name similarity
  if (name.includes(targetId) || targetId.includes(name)) {
    return true;
  }

  // Pattern match
  if ('pattern' in nodeOrSection && nodeOrSection.pattern === target.pattern) {
    return true;
  }

  // Content match
  if (target.expectedContent.length > 0 && 'content' in nodeOrSection) {
    return matchesByContent(nodeOrSection as Section, target.expectedContent);
  }

  return false;
}

function extractSectionFromNode(node: FigmaNode, target: ExtractionTarget): Section {
  return {
    id: generateSectionId(node),
    name: inferSectionName(node),
    type: inferSectionType(node),
    pattern: target.pattern,
    bounds: node.absoluteBoundingBox,
    layout: extractAutoLayout(node),
    depth: 0,
    path: node.name,
    components: findComponentsUsed(node),
    childCount: node.children?.length || 0,
    targetId: target.sectionId,
    matchedVia: 'targeted-extraction'
  };
}
```

### Step 5: Content-Based Search

```typescript
/**
 * Last-resort: Search for section by its expected text content
 */
function contentBasedSearch(
  frame: FigmaNode,
  target: ExtractionTarget
): Section | null {
  // Find all text nodes containing expected content
  const textMatches: FigmaNode[] = [];

  function searchText(node: FigmaNode) {
    if (node.type === 'TEXT' && node.characters) {
      for (const expected of target.expectedContent) {
        if (node.characters.includes(expected)) {
          textMatches.push(node);
          break;
        }
      }
    }
    if (node.children) {
      for (const child of node.children) {
        searchText(child);
      }
    }
  }

  searchText(frame);

  if (textMatches.length === 0) return null;

  // Find common ancestor of matching text nodes
  // This ancestor is likely the section we're looking for
  const ancestor = findCommonAncestor(frame, textMatches);

  if (ancestor && isSectionLike(ancestor)) {
    return extractSectionFromNode(ancestor, target);
  }

  return null;
}

function findCommonAncestor(root: FigmaNode, nodes: FigmaNode[]): FigmaNode | null {
  if (nodes.length === 0) return null;
  if (nodes.length === 1) return findParentSection(root, nodes[0]);

  // Find paths from root to each node
  const paths: FigmaNode[][] = nodes.map(n => findPathToNode(root, n)).filter(p => p.length > 0);

  if (paths.length === 0) return null;

  // Find deepest common node
  let commonAncestor: FigmaNode | null = null;
  const minLength = Math.min(...paths.map(p => p.length));

  for (let i = 0; i < minLength; i++) {
    const nodeAtDepth = paths[0][i];
    if (paths.every(p => p[i]?.id === nodeAtDepth.id)) {
      commonAncestor = nodeAtDepth;
    } else {
      break;
    }
  }

  return commonAncestor;
}

function findPathToNode(root: FigmaNode, target: FigmaNode): FigmaNode[] {
  const path: FigmaNode[] = [];

  function search(node: FigmaNode): boolean {
    path.push(node);
    if (node.id === target.id) return true;
    if (node.children) {
      for (const child of node.children) {
        if (search(child)) return true;
      }
    }
    path.pop();
    return false;
  }

  search(root);
  return path;
}

function findParentSection(root: FigmaNode, node: FigmaNode): FigmaNode | null {
  const path = findPathToNode(root, node);

  // Walk up path to find first section-like node
  for (let i = path.length - 2; i >= 0; i--) {
    if (isSectionLike(path[i])) {
      return path[i];
    }
  }

  return null;
}

function isSectionLike(node: FigmaNode): boolean {
  if (!['FRAME', 'COMPONENT', 'INSTANCE'].includes(node.type)) return false;

  const bounds = node.absoluteBoundingBox;
  if (!bounds || bounds.width < 50 || bounds.height < 40) return false;

  // Has meaningful name or auto-layout
  const hasName = !node.name.startsWith('Frame') && !node.name.startsWith('Group');
  const hasLayout = node.layoutMode && node.layoutMode !== 'NONE';

  return hasName || hasLayout || (node.children?.length || 0) > 1;
}

function findNodeById(root: FigmaNode, nodeId: string): FigmaNode | null {
  if (root.id === nodeId) return root;

  if (root.children) {
    for (const child of root.children) {
      const found = findNodeById(child, nodeId);
      if (found) return found;
    }
  }

  return null;
}
```

### Step 6: Integration with Main Extraction

```typescript
/**
 * Main extraction entry point with inventory-driven reconciliation
 */
async function extractLayoutWithInventory(
  frame: FigmaNode,
  inventoryPath: string | null,
  patternRegistry: PatternRegistry,
  thorough: boolean = false
): Promise<ExtractionResult> {
  const config = selectConfig(frame, thorough);

  if (!inventoryPath) {
    // No inventory - standard extraction
    const sections = extractSectionsRecursive(frame, config, 0, '', patternRegistry);
    return {
      extracted: sections,
      stillMissing: [],
      coverage: 100  // No baseline to compare
    };
  }

  // Load inventory targets
  const targets = loadExtractionTargets(inventoryPath);
  console.log(`Loaded ${targets.length} extraction targets from inventory`);

  // Run inventory-driven extraction
  const result = await extractWithTargets(frame, targets, patternRegistry, config);

  // Report results
  console.log(`\nExtraction complete:`);
  console.log(`  Sections extracted: ${result.extracted.length}/${targets.length}`);
  console.log(`  Coverage: ${result.coverage.toFixed(1)}%`);

  if (result.stillMissing.length > 0) {
    console.log(`  Missing sections:`);
    for (const missing of result.stillMissing) {
      console.log(`    - ${missing.sectionId} (${missing.pattern})`);
    }
  }

  return result;
}
```

## Output

The extraction result includes metadata about which pass found each section:

```json
{
  "sections": [
    {
      "id": "credit-card",
      "name": "Credit Card",
      "pattern": "credit-card",
      "targetId": "credit-card",
      "extractionPass": 1,
      "matchedVia": "standard"
    },
    {
      "id": "salary-card",
      "name": "Salary Card",
      "pattern": "stat-card",
      "targetId": "salary-card",
      "extractionPass": 2,
      "matchedVia": "targeted-extraction"
    },
    {
      "id": "paypal-card",
      "name": "PayPal Card",
      "pattern": "stat-card",
      "targetId": "paypal-card",
      "extractionPass": 3,
      "matchedVia": "content-search"
    }
  ],
  "coverage": 100,
  "stillMissing": []
}
```

## Console Output

```
Loaded 10 extraction targets from inventory

Pass 1: Standard deep extraction...
  Pass 1 result: 7/10 sections matched

Pass 2: Targeted extraction for 3 missing sections...
  ✓ Found: salary-card
  ✓ Found: paypal-card
  ✗ Still missing: footer

Pass 3: Content-based search for 1 sections...
  ✓ Found via content: footer

Extraction complete:
  Sections extracted: 10/10
  Coverage: 100.0%
```

## Next Step

After inventory-driven extraction:
- Proceed to: `pattern-validation.md` (validate required fields)
- Then: `reconciliation-report.md` (generate final report)
