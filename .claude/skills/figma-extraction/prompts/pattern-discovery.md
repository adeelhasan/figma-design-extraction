# Pattern Discovery (Phase 0)

> **Critical for generalizability**: Derive patterns dynamically from the Figma file itself,
> rather than relying on hardcoded pattern libraries.

## Purpose

Build a unified pattern registry from three sources:
1. **Figma Components** (highest confidence) - Designer-defined reusable patterns
2. **Visual Analysis** (medium confidence) - Screenshot-based pattern detection
3. **Structural Heuristics** (fallback) - Fingerprint-based clustering

This ensures extraction works across ANY design system, not just known UI types.

## When to Run

This phase runs **before** all other extraction phases:

```
Pattern Discovery (Phase 0)
        │
        ▼ (PatternRegistry)
Deep Traversal (Phase 1) ─────────────────┐
        │                                  │
        ▼                                  │
Row-Aware Extraction (Phase 2)            │
        │                                  │
        ▼                                  │
Inventory-Driven Extraction (Phase 3) ◄───┘
        │
        ▼ (uses PatternRegistry.getPatternForNode)
Validation & Verification
```

## Step 1: Discover Figma Component Patterns

Query the Figma API for component metadata from the file.

### API Call

```
GET https://api.figma.com/v1/files/{fileKey}/components
```

### Response Processing

```typescript
interface ComponentPattern {
  componentId: string;           // Figma component key
  name: string;                  // "Stat Card", "Invoice Item"
  description?: string;          // Designer's intent documentation
  documentationLinks?: string[];
  properties: PropertyDefinition[];
  structure: StructuralFingerprint;
  instances: string[];           // Node IDs using this component
}

interface PropertyDefinition {
  name: string;
  type: 'TEXT' | 'BOOLEAN' | 'INSTANCE_SWAP' | 'VARIANT';
  defaultValue?: string;
  variantOptions?: string[];
}

async function discoverComponentPatterns(fileKey: string): Promise<ComponentPattern[]> {
  // 1. Get component metadata from file
  const response = await figmaApi.get(`/files/${fileKey}/components`);
  const components = response.meta?.components || [];

  const patterns: ComponentPattern[] = [];

  for (const comp of components) {
    // 2. Get full node data for structure analysis
    const nodeData = await figmaApi.get(`/files/${fileKey}/nodes?ids=${comp.node_id}`);
    const node = nodeData.nodes[comp.node_id]?.document;

    if (!node) continue;

    // 3. Find all instances in the file
    const instances = await findInstancesOf(fileKey, comp.key);

    // 4. Extract property definitions from component
    const properties = extractPropertyDefinitions(node);

    patterns.push({
      componentId: comp.key,
      name: comp.name,
      description: comp.description,
      properties,
      structure: computeStructuralFingerprint(node),
      instances: instances.map(i => i.id)
    });
  }

  return patterns;
}
```

### Finding Component Instances

```typescript
async function findInstancesOf(fileKey: string, componentKey: string): Promise<FigmaNode[]> {
  // Get full file and traverse for instances
  const file = await figmaApi.get(`/files/${fileKey}`);
  const instances: FigmaNode[] = [];

  function traverse(node: FigmaNode) {
    if (node.type === 'INSTANCE' && node.componentId === componentKey) {
      instances.push(node);
    }
    if (node.children) {
      for (const child of node.children) {
        traverse(child);
      }
    }
  }

  traverse(file.document);
  return instances;
}
```

## Step 2: Visual Analysis Gap Detection

For sections not covered by component patterns, use visual analysis from screenshots.

### Input

Requires output from `visual-analysis.md`:
- `preview/layouts/data/{ScreenName}-inventory.json`

### Gap Analysis

```typescript
interface VisualPattern {
  id: string;
  inferredType: string;          // "stat-display", "card-row"
  confidence: number;            // 0-1
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
    // Check if already covered by a component pattern
    const hasComponentMatch = componentPatterns.some(cp =>
      cp.instances.some(inst =>
        section.nodeIds?.includes(inst) ||
        isChildOfAny(inst, section.nodeIds)
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

function inferTypeFromVisualCues(section: InventorySection): string {
  // Infer type from section properties
  if (section.pattern) return section.pattern;

  if (section.type === 'card' && section.subtype) {
    return section.subtype;
  }

  if (section.content?.icon && section.content?.value && section.content?.label) {
    return 'stat-card';
  }

  if (section.children?.type === 'nav-item') {
    return 'navigation';
  }

  if (section.children?.type === 'invoice-item' || section.children?.type === 'list-item') {
    return 'list';
  }

  if (section.children?.type === 'transaction-item') {
    return 'transaction-list';
  }

  if (section.children?.type === 'info-card') {
    return 'info-list';
  }

  return section.type || 'unknown';
}

function calculateConfidence(section: InventorySection): number {
  let confidence = 0.5; // Base confidence

  // Increase confidence based on specificity
  if (section.pattern) confidence += 0.3;
  if (section.subtype) confidence += 0.1;
  if (section.content && Object.keys(section.content).length > 2) confidence += 0.1;
  if (section.children?.count > 0) confidence += 0.1;

  return Math.min(confidence, 1.0);
}

function extractVisualSignature(section: InventorySection): VisualPattern['visualSignature'] {
  return {
    hasIcon: !!(section.content?.icon || section.content?.hasChip),
    hasLargeText: !!(section.content?.value || section.content?.hasNumber),
    hasSubtext: !!(section.content?.label || section.content?.sublabel),
    colorScheme: [], // Determined from screenshot analysis if available
    approximateLayout: inferLayout(section)
  };
}

function inferLayout(section: InventorySection): 'horizontal' | 'vertical' | 'grid' {
  if (section.children?.count > 3 && section.type === 'card') {
    return 'grid';
  }
  if (section.location?.includes('row')) {
    return 'horizontal';
  }
  return 'vertical';
}
```

## Step 3: Structural Fingerprinting (Fallback)

For elements with no component match and ambiguous visuals, use structural analysis.

### Fingerprint Definition

```typescript
interface StructuralFingerprint {
  childTypes: string[];          // ['TEXT', 'FRAME', 'TEXT']
  layoutMode: 'NONE' | 'HORIZONTAL' | 'VERTICAL';
  depth: number;
  textCount: number;
  frameCount: number;
  hasIcon: boolean;
  hasImage: boolean;
  aspectRatio: number;           // width/height for pattern matching
}

function computeStructuralFingerprint(node: FigmaNode): StructuralFingerprint {
  const bounds = node.absoluteBoundingBox;

  return {
    childTypes: node.children?.map(c => c.type) || [],
    layoutMode: node.layoutMode || 'NONE',
    depth: computeMaxDepth(node),
    textCount: countNodeType(node, 'TEXT'),
    frameCount: countNodeType(node, 'FRAME'),
    hasIcon: hasIconChild(node),
    hasImage: hasImageChild(node),
    aspectRatio: bounds ? bounds.width / bounds.height : 1
  };
}

function computeMaxDepth(node: FigmaNode, current: number = 0): number {
  if (!node.children || node.children.length === 0) {
    return current;
  }
  return Math.max(...node.children.map(c => computeMaxDepth(c, current + 1)));
}

function countNodeType(node: FigmaNode, type: string): number {
  let count = 0;

  function traverse(n: FigmaNode) {
    if (n.type === type) count++;
    if (n.children) {
      for (const child of n.children) {
        traverse(child);
      }
    }
  }

  traverse(node);
  return count;
}

function hasIconChild(node: FigmaNode): boolean {
  if (!node.children) return false;

  return node.children.some(c => {
    // Small frame/group that might be an icon
    const bounds = c.absoluteBoundingBox;
    if (bounds && bounds.width < 50 && bounds.height < 50) {
      return true;
    }
    // Named as icon
    if (c.name.toLowerCase().includes('icon')) {
      return true;
    }
    // Vector or SVG
    if (c.type === 'VECTOR' || c.type === 'BOOLEAN_OPERATION') {
      return true;
    }
    return false;
  });
}

function hasImageChild(node: FigmaNode): boolean {
  if (!node.children) return false;

  function traverse(n: FigmaNode): boolean {
    if (n.type === 'RECTANGLE' && n.fills?.some(f => f.type === 'IMAGE')) {
      return true;
    }
    if (n.children) {
      return n.children.some(c => traverse(c));
    }
    return false;
  }

  return traverse(node);
}
```

### Clustering by Fingerprint

```typescript
function clusterByFingerprint(nodes: FigmaNode[]): Map<string, FigmaNode[]> {
  const clusters = new Map<string, FigmaNode[]>();

  for (const node of nodes) {
    const fp = computeStructuralFingerprint(node);
    const key = fingerprintToKey(fp);

    if (!clusters.has(key)) {
      clusters.set(key, []);
    }
    clusters.get(key)!.push(node);
  }

  return clusters;
}

function fingerprintToKey(fp: StructuralFingerprint): string {
  // Create a normalized key from fingerprint
  const childTypeSig = fp.childTypes.sort().join('-');
  const aspectBucket = Math.round(fp.aspectRatio * 10) / 10; // Round to 1 decimal

  return [
    fp.layoutMode,
    fp.textCount,
    fp.frameCount,
    fp.hasIcon ? 'icon' : 'no-icon',
    fp.hasImage ? 'img' : 'no-img',
    aspectBucket,
    childTypeSig
  ].join('|');
}
```

## Step 4: Build Unified Pattern Registry

Combine all pattern sources into a single queryable registry.

### Registry Structure

```typescript
interface UnifiedPattern {
  id: string;
  name: string;
  source: 'component' | 'visual' | 'structural';
  confidence: number;
  requiredFields: string[];      // Derived from structure
  optionalFields: string[];
  extractionHints: {
    lookForText: boolean;
    lookForIcon: boolean;
    expectChildren: number;
    expectedLayout: 'horizontal' | 'vertical' | 'grid' | 'any';
  };
  nodeMatches: string[];         // Node IDs that match this pattern
  fingerprint?: StructuralFingerprint;
}

interface PatternRegistry {
  patterns: Map<string, UnifiedPattern>;
  nodeToPattern: Map<string, string>;  // nodeId -> patternId lookup

  // Methods
  getPatternForNode(nodeId: string): UnifiedPattern | null;
  getPatternByFingerprint(fp: StructuralFingerprint): UnifiedPattern | null;
  getAllPatternsOfType(type: string): UnifiedPattern[];
  registerPattern(pattern: UnifiedPattern): void;
}

class PatternRegistryImpl implements PatternRegistry {
  patterns = new Map<string, UnifiedPattern>();
  nodeToPattern = new Map<string, string>();

  getPatternForNode(nodeId: string): UnifiedPattern | null {
    const patternId = this.nodeToPattern.get(nodeId);
    return patternId ? this.patterns.get(patternId) || null : null;
  }

  getPatternByFingerprint(fp: StructuralFingerprint): UnifiedPattern | null {
    const key = fingerprintToKey(fp);

    for (const pattern of this.patterns.values()) {
      if (pattern.fingerprint && fingerprintToKey(pattern.fingerprint) === key) {
        return pattern;
      }
    }

    return null;
  }

  getAllPatternsOfType(type: string): UnifiedPattern[] {
    return [...this.patterns.values()].filter(p =>
      p.name.toLowerCase().includes(type.toLowerCase()) ||
      p.id.includes(type)
    );
  }

  registerPattern(pattern: UnifiedPattern): void {
    this.patterns.set(pattern.id, pattern);
    for (const nodeId of pattern.nodeMatches) {
      this.nodeToPattern.set(nodeId, pattern.id);
    }
  }
}
```

### Building the Registry

```typescript
async function buildPatternRegistry(
  fileKey: string,
  visualInventory?: VisualInventory
): Promise<PatternRegistry> {
  const registry = new PatternRegistryImpl();

  // 1. Components first (highest confidence)
  console.log('Discovering component patterns...');
  const componentPatterns = await discoverComponentPatterns(fileKey);

  for (const cp of componentPatterns) {
    registry.registerPattern({
      id: `component:${cp.componentId}`,
      name: cp.name,
      source: 'component',
      confidence: 1.0,  // Highest confidence
      requiredFields: deriveRequiredFields(cp.properties),
      optionalFields: deriveOptionalFields(cp.properties),
      extractionHints: deriveExtractionHints(cp.structure),
      nodeMatches: cp.instances,
      fingerprint: cp.structure
    });
  }

  console.log(`  Found ${componentPatterns.length} component patterns`);

  // 2. Visual analysis for gaps
  if (visualInventory) {
    console.log('Analyzing visual patterns...');
    const visualPatterns = analyzeVisualGaps(visualInventory, componentPatterns);

    for (const vp of visualPatterns) {
      registry.registerPattern({
        id: `visual:${vp.id}`,
        name: vp.inferredType,
        source: 'visual',
        confidence: vp.confidence,
        requiredFields: deriveFieldsFromVisual(vp),
        optionalFields: [],
        extractionHints: {
          lookForText: vp.visualSignature.hasLargeText || vp.visualSignature.hasSubtext,
          lookForIcon: vp.visualSignature.hasIcon,
          expectChildren: 0,
          expectedLayout: vp.visualSignature.approximateLayout
        },
        nodeMatches: vp.matchedNodeIds
      });
    }

    console.log(`  Found ${visualPatterns.length} visual patterns`);
  }

  // 3. Structural clustering for remainder
  const coveredNodes = new Set<string>();
  for (const pattern of registry.patterns.values()) {
    for (const nodeId of pattern.nodeMatches) {
      coveredNodes.add(nodeId);
    }
  }

  // Find uncovered nodes from inventory
  if (visualInventory) {
    const uncoveredNodes: FigmaNode[] = [];
    for (const section of visualInventory.sections) {
      if (section.nodeIds) {
        for (const nodeId of section.nodeIds) {
          if (!coveredNodes.has(nodeId)) {
            // Would need to fetch the node data here
            // uncoveredNodes.push(nodeData);
          }
        }
      }
    }

    if (uncoveredNodes.length > 0) {
      console.log('Clustering uncovered nodes by structure...');
      const clusters = clusterByFingerprint(uncoveredNodes);

      let clusterIndex = 0;
      for (const [key, nodes] of clusters.entries()) {
        if (nodes.length >= 2) {  // Only create pattern if multiple matches
          const fp = computeStructuralFingerprint(nodes[0]);
          registry.registerPattern({
            id: `structural:cluster-${clusterIndex++}`,
            name: inferPatternName(fp),
            source: 'structural',
            confidence: 0.5,  // Lower confidence
            requiredFields: [],
            optionalFields: [],
            extractionHints: {
              lookForText: fp.textCount > 0,
              lookForIcon: fp.hasIcon,
              expectChildren: nodes[0].children?.length || 0,
              expectedLayout: fp.layoutMode === 'HORIZONTAL' ? 'horizontal' :
                             fp.layoutMode === 'VERTICAL' ? 'vertical' : 'any'
            },
            nodeMatches: nodes.map(n => n.id),
            fingerprint: fp
          });
        }
      }

      console.log(`  Created ${clusterIndex} structural patterns`);
    }
  }

  return registry;
}

function deriveRequiredFields(properties: PropertyDefinition[]): string[] {
  return properties
    .filter(p => p.type !== 'BOOLEAN')  // Booleans are typically optional
    .map(p => p.name);
}

function deriveOptionalFields(properties: PropertyDefinition[]): string[] {
  return properties
    .filter(p => p.type === 'BOOLEAN')
    .map(p => p.name);
}

function deriveExtractionHints(structure: StructuralFingerprint): UnifiedPattern['extractionHints'] {
  return {
    lookForText: structure.textCount > 0,
    lookForIcon: structure.hasIcon,
    expectChildren: structure.childTypes.filter(t => t === 'FRAME').length,
    expectedLayout: structure.layoutMode === 'HORIZONTAL' ? 'horizontal' :
                   structure.layoutMode === 'VERTICAL' ? 'vertical' : 'any'
  };
}

function deriveFieldsFromVisual(vp: VisualPattern): string[] {
  const fields: string[] = [];
  if (vp.visualSignature.hasIcon) fields.push('icon');
  if (vp.visualSignature.hasLargeText) fields.push('value');
  if (vp.visualSignature.hasSubtext) fields.push('label');
  return fields;
}

function inferPatternName(fp: StructuralFingerprint): string {
  if (fp.hasIcon && fp.textCount >= 2) return 'icon-text-block';
  if (fp.textCount >= 3) return 'text-group';
  if (fp.hasImage) return 'media-block';
  if (fp.layoutMode === 'HORIZONTAL') return 'horizontal-group';
  if (fp.layoutMode === 'VERTICAL') return 'vertical-stack';
  return 'generic-block';
}
```

## Step 5: Output Pattern Registry

Save the discovered patterns for use by subsequent phases.

### Output Path

```
design-system/.cache/pattern-registry.json
```

### Output Schema

```json
{
  "fileKey": "{figmaFileKey}",
  "discoveredAt": "2026-01-17T10:00:00Z",
  "summary": {
    "componentPatterns": 12,
    "visualPatterns": 5,
    "structuralPatterns": 3,
    "totalPatterns": 20,
    "nodesCovered": 45
  },
  "patterns": [
    {
      "id": "component:abc123",
      "name": "Stat Card",
      "source": "component",
      "confidence": 1.0,
      "requiredFields": ["icon", "value", "label"],
      "optionalFields": ["sublabel", "trend"],
      "extractionHints": {
        "lookForText": true,
        "lookForIcon": true,
        "expectChildren": 3,
        "expectedLayout": "vertical"
      },
      "nodeMatches": ["node1", "node2", "node3"],
      "fingerprint": {
        "childTypes": ["FRAME", "TEXT", "TEXT"],
        "layoutMode": "VERTICAL",
        "depth": 2,
        "textCount": 3,
        "frameCount": 1,
        "hasIcon": true,
        "hasImage": false,
        "aspectRatio": 1.2
      }
    }
  ],
  "nodeToPattern": {
    "node1": "component:abc123",
    "node2": "component:abc123"
  }
}
```

## Step 6: Integration Report

Output discovery results to console:

```
═══════════════════════════════════════════════════════════════
  PATTERN DISCOVERY
═══════════════════════════════════════════════════════════════

Source              Patterns    Nodes Covered    Confidence
────────────────────────────────────────────────────────────────
Component (Figma)   12          34               High (1.0)
Visual Analysis     5           8                Medium (0.6-0.8)
Structural          3           6                Low (0.5)
────────────────────────────────────────────────────────────────
TOTAL               20          48

Top Patterns:
  • Stat Card (component) - 6 instances
  • List Item (component) - 14 instances
  • Credit Card (component) - 2 instances
  • Info Card (visual) - 3 instances
  • Navigation Item (component) - 7 instances

Uncovered Nodes: 2
  • "Decorative Element" (ignored)
  • "Background Frame" (ignored)

Pattern registry saved to: design-system/.cache/pattern-registry.json

Proceeding to extraction phases...
```

## Why This Generalizes

| Approach | Generalizability |
|----------|------------------|
| Hardcoded patterns | Only works for known UI types |
| Component-first | Works for any design system using Figma components |
| Visual analysis | Works for any visual layout |
| Structural clustering | Works for any node structure |
| **Hybrid (all three)** | Works across ALL design systems |

## Usage in Subsequent Phases

The pattern registry is consumed by:

### extract-layouts.md
```typescript
const registry = loadPatternRegistry();
const section = extractSection(node);
const pattern = registry.getPatternForNode(node.id);
if (pattern) {
  section.pattern = pattern.name;
  section.confidence = pattern.confidence;
}
```

### extract-content.md
```typescript
const registry = loadPatternRegistry();
const pattern = registry.getPatternForNode(node.id);
if (pattern) {
  // Use pattern hints to guide content extraction
  if (pattern.extractionHints.lookForIcon) {
    section.icon = findIconChild(node);
  }
  if (pattern.extractionHints.lookForText) {
    section.textContent = findTextChildren(node);
  }
}
```

### verify-extraction.md
```typescript
const registry = loadPatternRegistry();
// Verify all high-confidence patterns were extracted
for (const pattern of registry.getAllPatternsOfType('component')) {
  const extracted = extractedSections.filter(s => s.pattern === pattern.name);
  if (extracted.length < pattern.nodeMatches.length) {
    report.missing.push({
      pattern: pattern.name,
      expected: pattern.nodeMatches.length,
      found: extracted.length
    });
  }
}
```

## Next Step

After pattern discovery completes:
- Proceed to: `extract-layouts.md` with the pattern registry available
