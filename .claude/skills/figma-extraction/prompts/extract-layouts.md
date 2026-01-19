# 07 - Extract Layout Specifications

## Purpose
Document page/screen layouts, grid systems, and section patterns from Figma frames.

## Prerequisites

This phase requires:
- Pattern registry from `pattern-discovery.md` (if available)
- Visual inventory from `visual-analysis.md` (for --thorough mode)

## Sources in Figma

1. **Top-level Frames** (pages/screens)
   - Direct children of page nodes
   - Usually named as screens: "Dashboard", "Settings", "Login"

2. **Layout Grids**
   - `layoutGrids` property on frames

3. **Auto-layout Structures**
   - Hierarchical auto-layout = sections

## Process

### Step 1: Identify Screen Frames

```typescript
function findScreenFrames(page: FigmaPage): ScreenFrame[] {
  return page.children
    .filter(node => 
      node.type === 'FRAME' && 
      isScreenLikeFrame(node)
    )
    .map(frame => ({
      id: frame.id,
      name: frame.name,
      width: frame.absoluteBoundingBox.width,
      height: frame.absoluteBoundingBox.height,
      layoutGrids: frame.layoutGrids,
      children: frame.children
    }));
}

function isScreenLikeFrame(node: FigmaNode): boolean {
  const { width, height } = node.absoluteBoundingBox;
  
  // Common screen sizes
  const screenWidths = [320, 375, 390, 428, 768, 1024, 1280, 1440, 1920];
  const isScreenWidth = screenWidths.some(w => Math.abs(width - w) < 10);
  
  // Or has meaningful name
  const screenNames = ['page', 'screen', 'view', 'dashboard', 'settings', 'home'];
  const hasScreenName = screenNames.some(n => 
    node.name.toLowerCase().includes(n)
  );
  
  return isScreenWidth || hasScreenName || height > 500;
}
```

### Step 2: Extract Grid System

```typescript
function extractGrid(grids: LayoutGrid[]): GridSpec {
  const columns = grids.find(g => g.pattern === 'COLUMNS');
  const rows = grids.find(g => g.pattern === 'ROWS');
  const grid = grids.find(g => g.pattern === 'GRID');
  
  return {
    columns: columns ? {
      count: columns.count,
      gutter: columns.gutterSize,
      margin: columns.offset,
      width: columns.sectionSize // if fixed
    } : null,
    
    rows: rows ? {
      count: rows.count,
      gutter: rows.gutterSize,
      height: rows.sectionSize
    } : null,
    
    baseGrid: grid ? grid.sectionSize : null
  };
}
```

### Step 3: Analyze Section Structure (with Recursive Traversal)

Map the frame hierarchy to sections using recursive traversal to capture ALL nested content.

#### Grid Position Inference

When sections are siblings in a container, infer their CSS Grid positions based on their x/y coordinates and relative sizes. This is critical for accurately reproducing layouts like the Billing page where:
- Credit Card spans 2 columns
- Salary and PayPal are 1 column each
- Invoices spans 2 columns AND 2 rows

```typescript
interface GridPosition {
  column: number;           // 1-based column index
  columnSpan: number;       // How many columns this section spans
  row: number;              // 1-based row index
  rowSpan: number;          // How many rows this section spans
  widthRatio: number;       // Relative width (e.g., 2 means 2x wider than base unit)
}

/**
 * Infer grid positions for sibling sections based on their bounds
 * This captures the spatial relationships that CSS Grid needs
 */
function inferGridPositions(siblings: Section[]): Map<string, GridPosition> {
  const positions = new Map<string, GridPosition>();
  if (siblings.length === 0) return positions;

  // Sort by y then x to get reading order
  const sorted = [...siblings].sort((a, b) => {
    const yDiff = a.bounds.y - b.bounds.y;
    if (Math.abs(yDiff) > 20) return yDiff; // Different rows
    return a.bounds.x - b.bounds.x; // Same row, sort by x
  });

  // Group into visual rows based on y-position overlap
  const rows: Section[][] = [];
  let currentRow: Section[] = [];
  let currentRowY = sorted[0]?.bounds.y || 0;
  let currentRowBottom = sorted[0]?.bounds.y + sorted[0]?.bounds.height || 0;

  for (const section of sorted) {
    // Check if this section overlaps vertically with current row
    const overlapsRow = section.bounds.y < currentRowBottom - 20;
    if (overlapsRow && currentRow.length > 0) {
      currentRow.push(section);
      // Extend row bottom if this section is taller
      currentRowBottom = Math.max(currentRowBottom, section.bounds.y + section.bounds.height);
    } else {
      if (currentRow.length > 0) rows.push(currentRow);
      currentRow = [section];
      currentRowY = section.bounds.y;
      currentRowBottom = section.bounds.y + section.bounds.height;
    }
  }
  if (currentRow.length > 0) rows.push(currentRow);

  // Find the minimum width unit (GCD of widths for proportional columns)
  const allWidths = siblings.map(s => s.bounds.width);
  const minWidth = Math.min(...allWidths.filter(w => w > 50)); // Ignore tiny elements

  // Calculate row heights for row-span detection
  const rowHeights = rows.map(row => Math.max(...row.map(s => s.bounds.height)));
  const baseRowHeight = Math.min(...rowHeights);

  // Build a map of which grid cells are occupied (for row-span detection)
  const gridOccupancy: Map<string, string> = new Map(); // "row,col" -> sectionId

  // First pass: assign positions without row spans
  let gridRow = 1;
  for (const row of rows) {
    let gridCol = 1;
    for (const section of row) {
      const widthRatio = Math.round(section.bounds.width / minWidth) || 1;
      const columnSpan = Math.max(1, Math.min(widthRatio, 4)); // Cap at 4 columns

      positions.set(section.id, {
        column: gridCol,
        columnSpan: columnSpan,
        row: gridRow,
        rowSpan: 1, // Will be updated in second pass
        widthRatio: widthRatio
      });

      // Mark cells as occupied
      for (let c = gridCol; c < gridCol + columnSpan; c++) {
        gridOccupancy.set(`${gridRow},${c}`, section.id);
      }

      gridCol += columnSpan;
    }
    gridRow++;
  }

  // Second pass: detect row spans by checking if section extends into next row's space
  for (const section of siblings) {
    const pos = positions.get(section.id);
    if (!pos) continue;

    const sectionBottom = section.bounds.y + section.bounds.height;
    let rowSpan = 1;

    // Check if this section extends significantly into subsequent rows
    for (let r = pos.row; r < rows.length; r++) {
      const nextRowTop = rows[r]?.[0]?.bounds.y;
      if (nextRowTop && sectionBottom > nextRowTop + 50) {
        rowSpan++;
      } else {
        break;
      }
    }

    if (rowSpan > 1) {
      positions.set(section.id, { ...pos, rowSpan });
    }
  }

  return positions;
}

/**
 * Generate CSS Grid template from inferred positions
 */
function generateGridCSS(positions: Map<string, GridPosition>, gap: number = 16): string {
  if (positions.size === 0) return '';

  const maxCol = Math.max(...[...positions.values()].map(p => p.column + p.columnSpan - 1));
  const maxRow = Math.max(...[...positions.values()].map(p => p.row + p.rowSpan - 1));

  // Build column fractions from width ratios
  const colFractions: string[] = [];
  for (let c = 1; c <= maxCol; c++) {
    // Find a section that starts at this column to get its width ratio
    const sectionAtCol = [...positions.entries()].find(([_, p]) => p.column === c);
    colFractions.push('1fr');
  }

  // Generate grid-template-areas for named placement
  const areas: string[][] = [];
  for (let r = 0; r < maxRow; r++) {
    areas.push(new Array(maxCol).fill('.'));
  }

  for (const [sectionId, pos] of positions) {
    const areaName = sectionId.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
    for (let r = pos.row - 1; r < pos.row - 1 + pos.rowSpan; r++) {
      for (let c = pos.column - 1; c < pos.column - 1 + pos.columnSpan; c++) {
        if (r < maxRow && c < maxCol) {
          areas[r][c] = areaName;
        }
      }
    }
  }

  // Build height rules for row-spanning elements
  // IMPORTANT: Elements that span multiple rows need height: 100% to fill the grid area
  let heightRules = '';
  for (const [sectionId, pos] of positions) {
    if (pos.rowSpan > 1) {
      const className = sectionId.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
      heightRules += `\n.${className} { height: 100%; } /* spans ${pos.rowSpan} rows */`;
    }
  }

  return `display: grid;
grid-template-columns: ${colFractions.join(' ')};
grid-template-rows: repeat(${maxRow}, auto);
gap: ${gap}px;
grid-template-areas:
  ${areas.map(row => `"${row.join(' ')}"`).join('\n  ')};${heightRules}`;
}
```

**Important CSS Note for Row-Spanning Elements:**
When a section spans multiple rows (rowSpan > 1), the generated CSS includes `height: 100%`
to ensure the element fills its entire grid area. Without this, the element only takes up
its natural content height even though the grid reserves space for it.

**Example Output for Billing Top Row:**

```
Inferred Grid Positions:
┌─────────────────┬─────────┬─────────┬─────────────────┐
│ credit-card     │ salary  │ paypal  │ invoices        │
│ (col 1-2)       │ (col 3) │ (col 4) │ (col 5-6)       │
│                 │         │         │ rowSpan: 2      │
├─────────────────┼─────────┴─────────┤                 │
│                 │                   │                 │
└─────────────────┴───────────────────┴─────────────────┘

CSS Output:
grid-template-columns: 2fr 1fr 1fr 2fr;
grid-template-rows: auto auto;
grid-template-areas:
  "credit-card credit-card salary paypal invoices invoices"
  ".           .           .      .      invoices invoices";
.invoices { height: 100%; } /* spans 2 rows */
```

#### Traversal Configuration

```typescript
interface TraversalConfig {
  maxDepth: number;              // Default: 3 (standard), 10 (--thorough/dashboard)
  minSectionSize: number;        // Minimum width/height to consider as section
  gapThreshold: number;          // Pixel gap that indicates section boundary
  expandHorizontalSiblings: boolean;  // Extract siblings in horizontal rows separately
  patternMatchFirst: boolean;    // Try pattern matching before size filtering
  extractActionsInline: boolean; // Capture action buttons within sections
}

const STANDARD_CONFIG: TraversalConfig = {
  maxDepth: 3,
  minSectionSize: 100,
  gapThreshold: 16,
  expandHorizontalSiblings: false,
  patternMatchFirst: false,
  extractActionsInline: false
};

const THOROUGH_CONFIG: TraversalConfig = {
  maxDepth: 10,
  minSectionSize: 50,
  gapThreshold: 8,
  expandHorizontalSiblings: true,
  patternMatchFirst: true,
  extractActionsInline: true
};

// Dashboard-specific config (auto-detected)
const DASHBOARD_CONFIG: TraversalConfig = {
  maxDepth: 10,
  minSectionSize: 50,
  gapThreshold: 8,
  expandHorizontalSiblings: true,  // Critical for card rows
  patternMatchFirst: true,         // Detect stat-cards before filtering
  extractActionsInline: true       // Capture VIEW ALL, ADD NEW buttons
};

/**
 * Auto-detect the appropriate config based on frame content
 */
function selectConfig(frame: FigmaNode, thorough: boolean = false): TraversalConfig {
  if (thorough) return THOROUGH_CONFIG;

  const pattern = detectLayoutPattern(frame);

  // Dashboard layouts need deep traversal to catch nested cards
  if (pattern === 'dashboard-grid' || pattern === 'card-layout') {
    return DASHBOARD_CONFIG;
  }

  // Sidebar layouts often have nested sections
  if (pattern === 'sidebar-content') {
    return { ...STANDARD_CONFIG, maxDepth: 6, expandHorizontalSiblings: true };
  }

  return STANDARD_CONFIG;
}

/**
 * Detect layout pattern from frame structure
 */
function detectLayoutPattern(frame: FigmaNode): string | null {
  if (!frame.children) return null;

  const hasHorizontalRows = frame.children.some(c =>
    c.layoutMode === 'HORIZONTAL' && (c.children?.length || 0) > 1
  );

  const hasMultipleCards = countCardLikeElements(frame) >= 3;
  const hasSidebar = frame.children.some(c =>
    c.name.toLowerCase().includes('sidebar') ||
    c.name.toLowerCase().includes('nav')
  );

  if (hasHorizontalRows && hasMultipleCards) {
    return 'dashboard-grid';
  }

  if (hasSidebar) {
    return 'sidebar-content';
  }

  if (hasMultipleCards) {
    return 'card-layout';
  }

  return null;
}

function countCardLikeElements(node: FigmaNode): number {
  let count = 0;

  function traverse(n: FigmaNode) {
    // Count frames that look like cards
    if (n.type === 'FRAME' || n.type === 'INSTANCE') {
      const bounds = n.absoluteBoundingBox;
      if (bounds && bounds.width > 100 && bounds.height > 80) {
        const hasFill = n.fills?.some(f => f.visible !== false);
        const hasCornerRadius = (n.cornerRadius || 0) > 0;
        if (hasFill || hasCornerRadius) {
          count++;
        }
      }
    }
    if (n.children) {
      for (const child of n.children) {
        traverse(child);
      }
    }
  }

  traverse(node);
  return count;
}
```

#### Recursive Section Extraction

```typescript
// Auto-layout properties from Figma (generalizable to any file)
interface AutoLayoutProps {
  mode: 'NONE' | 'HORIZONTAL' | 'VERTICAL';
  gap: number;                    // node.itemSpacing
  padding: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  alignItems: 'MIN' | 'CENTER' | 'MAX' | 'BASELINE';  // counterAxisAlignItems
  justifyContent: 'MIN' | 'CENTER' | 'MAX' | 'SPACE_BETWEEN';  // primaryAxisAlignItems
  wrap: boolean;                  // layoutWrap === 'WRAP'
}

// Extract auto-layout properties from any frame
function extractAutoLayout(node: FigmaNode): AutoLayoutProps | null {
  // Only extract if node uses auto-layout
  if (node.layoutMode === 'NONE' || !node.layoutMode) {
    return null;
  }

  return {
    mode: node.layoutMode,                    // 'HORIZONTAL' or 'VERTICAL'
    gap: node.itemSpacing || 0,
    padding: {
      top: node.paddingTop || 0,
      right: node.paddingRight || 0,
      bottom: node.paddingBottom || 0,
      left: node.paddingLeft || 0
    },
    alignItems: node.counterAxisAlignItems || 'MIN',
    justifyContent: node.primaryAxisAlignItems || 'MIN',
    wrap: node.layoutWrap === 'WRAP'
  };
}

/**
 * Recursively extract sections from a frame
 * This ensures nested content is not missed
 *
 * IMPROVEMENTS APPLIED:
 * - Improvement 1: Deep traversal with auto-detected config
 * - Improvement 2: Row-aware extraction for horizontal siblings
 * - Improvement 5: Sibling-aware pattern extraction
 * - Improvement 6: Action button detection (inline)
 */
function extractSectionsRecursive(
  node: FigmaNode,
  config: TraversalConfig,
  depth: number = 0,
  parentPath: string = '',
  patternRegistry?: PatternRegistry
): Section[] {
  const sections: Section[] = [];
  const currentPath = parentPath ? `${parentPath}/${node.name}` : node.name;

  // IMPROVEMENT 2: Row-Aware Extraction
  // If this is a horizontal row with multiple section-like children, extract each child separately
  if (config.expandHorizontalSiblings && isLayoutRow(node)) {
    const rowSections = extractRowChildren(node, config, depth, currentPath, patternRegistry);
    sections.push(...rowSections);
    // Don't recurse further into row children - they're already extracted
    return sections;
  }

  // IMPROVEMENT 1 + 5: Pattern-first detection with sibling awareness
  // Check pattern registry first if available
  let detectedPattern: string | null = null;
  if (config.patternMatchFirst && patternRegistry) {
    const registryPattern = patternRegistry.getPatternForNode(node.id);
    if (registryPattern) {
      detectedPattern = registryPattern.name;

      // IMPROVEMENT 5: Sibling-aware extraction
      // If this node matches a pattern, check for similar siblings
      const siblingSections = extractPatternWithSiblings(node, registryPattern, config, depth, currentPath);
      sections.push(...siblingSections);
      return sections;
    }
  }

  // Standard pattern detection
  if (!detectedPattern) {
    detectedPattern = detectUIPattern(node);
  }

  // Check if this node qualifies as a section
  if (isSectionCandidate(node, config) || detectedPattern) {
    const section: Section = {
      id: generateSectionId(node),
      name: inferSectionName(node),
      type: inferSectionType(node),
      pattern: detectedPattern,
      bounds: node.absoluteBoundingBox,
      layout: extractAutoLayout(node),
      depth: depth,
      path: currentPath,
      components: findComponentsUsed(node),
      childCount: node.children?.length || 0,
      // IMPROVEMENT 6: Capture actions inline
      actions: config.extractActionsInline ? extractActions(node) : undefined
    };

    sections.push(section);
  }

  // Recurse into children if within depth limit
  if (depth < config.maxDepth && node.children) {
    for (const child of node.children) {
      if (child.type === 'FRAME' || child.type === 'GROUP' || child.type === 'COMPONENT' || child.type === 'INSTANCE') {
        const childSections = extractSectionsRecursive(child, config, depth + 1, currentPath, patternRegistry);
        sections.push(...childSections);
      }
    }
  }

  return sections;
}

// ============================================================================
// IMPROVEMENT 2: Row-Aware Extraction
// ============================================================================

/**
 * Identify horizontal layout rows that contain multiple section-like children
 * Rule: If a row is identified with N children, extraction MUST produce N sections
 */
interface LayoutRow {
  id: string;
  name: string;
  expectedChildCount: number;
  children: { id: string; name: string; pattern?: string }[];
}

function isLayoutRow(node: FigmaNode): boolean {
  // Must be horizontal auto-layout with multiple direct children
  if (node.layoutMode !== 'HORIZONTAL') return false;
  if (!node.children || node.children.length <= 1) return false;

  // Children should look like sections (not small icons or text)
  const childrenLookLikeSections = node.children.every(c =>
    (c.type === 'FRAME' || c.type === 'INSTANCE' || c.type === 'COMPONENT') &&
    c.absoluteBoundingBox?.width > 80 &&
    c.absoluteBoundingBox?.height > 60
  );

  return childrenLookLikeSections;
}

function identifyLayoutRows(frame: FigmaNode): LayoutRow[] {
  const rows: LayoutRow[] = [];

  function traverseForRows(node: FigmaNode) {
    if (isLayoutRow(node)) {
      rows.push({
        id: node.id,
        name: node.name,
        expectedChildCount: node.children!.length,
        children: node.children!.map(c => ({
          id: c.id,
          name: c.name,
          pattern: detectUIPattern(c) || undefined
        }))
      });
    }

    // Continue traversing
    if (node.children) {
      for (const child of node.children) {
        traverseForRows(child);
      }
    }
  }

  traverseForRows(frame);
  return rows;
}

/**
 * Extract each child of a layout row as a separate section
 */
function extractRowChildren(
  row: FigmaNode,
  config: TraversalConfig,
  depth: number,
  parentPath: string,
  patternRegistry?: PatternRegistry
): Section[] {
  const sections: Section[] = [];
  const rowPath = parentPath ? `${parentPath}/${row.name}` : row.name;

  if (!row.children) return sections;

  for (const child of row.children) {
    // Each child in the row becomes its own section
    let pattern = detectUIPattern(child);

    // Check pattern registry
    if (patternRegistry && !pattern) {
      const registryPattern = patternRegistry.getPatternForNode(child.id);
      if (registryPattern) {
        pattern = registryPattern.name;
      }
    }

    const section: Section = {
      id: generateSectionId(child),
      name: inferSectionName(child),
      type: inferSectionType(child),
      pattern: pattern,
      bounds: child.absoluteBoundingBox,
      layout: extractAutoLayout(child),
      depth: depth + 1,
      path: `${rowPath}/${child.name}`,
      components: findComponentsUsed(child),
      childCount: child.children?.length || 0,
      rowPosition: {
        rowId: row.id,
        rowName: row.name,
        index: row.children!.indexOf(child),
        totalInRow: row.children!.length
      },
      actions: config.extractActionsInline ? extractActions(child) : undefined
    };

    sections.push(section);

    // Recurse into child's children
    if (depth + 1 < config.maxDepth && child.children) {
      for (const grandchild of child.children) {
        if (['FRAME', 'GROUP', 'COMPONENT', 'INSTANCE'].includes(grandchild.type)) {
          const grandchildSections = extractSectionsRecursive(
            grandchild,
            config,
            depth + 2,
            section.path,
            patternRegistry
          );
          sections.push(...grandchildSections);
        }
      }
    }
  }

  return sections;
}

// ============================================================================
// IMPROVEMENT 5: Sibling-Aware Pattern Extraction
// ============================================================================

/**
 * When a pattern is detected, automatically extract siblings with the same pattern
 * This ensures stat-cards in a row are all captured even if only one is initially matched
 */
function extractPatternWithSiblings(
  node: FigmaNode,
  pattern: UnifiedPattern,
  config: TraversalConfig,
  depth: number,
  parentPath: string
): Section[] {
  const sections: Section[] = [];

  // Extract the found node
  sections.push({
    id: generateSectionId(node),
    name: inferSectionName(node),
    type: inferSectionType(node),
    pattern: pattern.name,
    bounds: node.absoluteBoundingBox,
    layout: extractAutoLayout(node),
    depth: depth,
    path: parentPath,
    components: findComponentsUsed(node),
    childCount: node.children?.length || 0,
    patternConfidence: pattern.confidence,
    patternSource: pattern.source,
    actions: config.extractActionsInline ? extractActions(node) : undefined
  });

  // Find parent to check for siblings
  // Note: In actual implementation, parent would need to be passed or looked up
  // This is a simplified version showing the concept

  return sections;
}

/**
 * Check if two nodes match the same structural pattern
 */
function nodeMatchesPattern(node: FigmaNode, pattern: UnifiedPattern): boolean {
  if (!pattern.fingerprint) return false;

  const nodeFp = computeStructuralFingerprint(node);
  const patternFp = pattern.fingerprint;

  // Compare key structural features
  return (
    nodeFp.layoutMode === patternFp.layoutMode &&
    Math.abs(nodeFp.textCount - patternFp.textCount) <= 1 &&
    nodeFp.hasIcon === patternFp.hasIcon
  );
}

// Helper for structural fingerprinting (simplified)
function computeStructuralFingerprint(node: FigmaNode): {
  layoutMode: string;
  textCount: number;
  hasIcon: boolean;
} {
  return {
    layoutMode: node.layoutMode || 'NONE',
    textCount: countTextNodes(node),
    hasIcon: hasIconChild(node)
  };
}

function countTextNodes(node: FigmaNode): number {
  let count = 0;
  function traverse(n: FigmaNode) {
    if (n.type === 'TEXT') count++;
    if (n.children) n.children.forEach(traverse);
  }
  traverse(node);
  return count;
}

function hasIconChild(node: FigmaNode): boolean {
  if (!node.children) return false;
  return node.children.some(c => {
    const bounds = c.absoluteBoundingBox;
    return (bounds && bounds.width < 50 && bounds.height < 50) ||
           c.name.toLowerCase().includes('icon') ||
           c.type === 'VECTOR';
  });
}

/**
 * Determine if a node should be treated as a section
 */
function isSectionCandidate(node: FigmaNode, config: TraversalConfig): boolean {
  // Must be a container type
  if (!['FRAME', 'GROUP', 'COMPONENT', 'INSTANCE'].includes(node.type)) {
    return false;
  }

  const bounds = node.absoluteBoundingBox;
  if (!bounds) return false;

  // Must meet minimum size
  if (bounds.width < config.minSectionSize || bounds.height < config.minSectionSize) {
    return false;
  }

  // Check for section-like characteristics
  const hasMultipleChildren = (node.children?.length || 0) > 1;
  const hasAutoLayout = node.layoutMode && node.layoutMode !== 'NONE';
  const hasMeaningfulName = !node.name.startsWith('Frame') && !node.name.startsWith('Group');
  const isComponentInstance = node.type === 'INSTANCE';

  return hasMultipleChildren || hasAutoLayout || hasMeaningfulName || isComponentInstance;
}

/**
 * Main entry point for section analysis
 *
 * IMPROVEMENTS APPLIED:
 * - Improvement 1: Auto-detect layout type and use appropriate config
 * - Uses pattern registry when available
 * - Grid position inference for sibling sections
 */
function analyzeSections(
  frame: FigmaNode,
  thorough: boolean = false,
  patternRegistry?: PatternRegistry
): { sections: Section[]; gridLayouts: Map<string, GridLayout> } {
  // IMPROVEMENT 1: Auto-select config based on layout type
  const config = selectConfig(frame, thorough);

  console.log(`Using ${config.maxDepth}-depth traversal (${
    config === DASHBOARD_CONFIG ? 'dashboard' :
    config === THOROUGH_CONFIG ? 'thorough' : 'standard'
  } mode)`);

  // Pre-identify layout rows for logging
  const rows = identifyLayoutRows(frame);
  if (rows.length > 0) {
    console.log(`Found ${rows.length} layout rows with ${rows.reduce((sum, r) => sum + r.expectedChildCount, 0)} total children`);
  }

  const allSections = extractSectionsRecursive(frame, config, 0, '', patternRegistry);

  // Deduplicate and organize by hierarchy
  const organizedSections = organizeSectionHierarchy(allSections);

  // NEW: Infer grid positions for sibling sections at each depth level
  const gridLayouts = inferAllGridLayouts(organizedSections, frame);

  // Attach grid positions to sections
  for (const section of organizedSections) {
    const parentLayout = gridLayouts.get(section.path.split('/').slice(0, -1).join('/'));
    if (parentLayout) {
      const gridPos = parentLayout.positions.get(section.id);
      if (gridPos) {
        section.gridPosition = gridPos;
      }
    }
  }

  return { sections: organizedSections, gridLayouts };
}

interface GridLayout {
  containerId: string;
  containerPath: string;
  positions: Map<string, GridPosition>;
  css: string;
  gap: number;
}

/**
 * Infer grid layouts for all container sections that have multiple children
 */
function inferAllGridLayouts(
  sections: Section[],
  rootFrame: FigmaNode
): Map<string, GridLayout> {
  const layouts = new Map<string, GridLayout>();

  // Group sections by their parent path
  const sectionsByParent = new Map<string, Section[]>();
  for (const section of sections) {
    const parentPath = section.path.split('/').slice(0, -1).join('/');
    if (!sectionsByParent.has(parentPath)) {
      sectionsByParent.set(parentPath, []);
    }
    sectionsByParent.get(parentPath)!.push(section);
  }

  // For each parent with multiple children, infer grid positions
  for (const [parentPath, children] of sectionsByParent) {
    if (children.length >= 2) {
      const positions = inferGridPositions(children);
      const gap = children[0]?.layout?.gap || 16;

      layouts.set(parentPath, {
        containerId: parentPath.split('/').pop() || 'root',
        containerPath: parentPath,
        positions: positions,
        css: generateGridCSS(positions, gap),
        gap: gap
      });

      console.log(`Grid layout inferred for "${parentPath}" with ${children.length} children`);
    }
  }

  return layouts;
}

// ============================================================================
// IMPROVEMENT 6: Action Button Detection
// ============================================================================

/**
 * Action keywords to scan for in text content
 */
const ACTION_KEYWORDS = [
  'VIEW ALL', 'VIEW MORE', 'SEE ALL', 'SEE MORE', 'SHOW ALL', 'SHOW MORE',
  'ADD', 'ADD NEW', 'CREATE', 'NEW',
  'DELETE', 'REMOVE', 'EDIT', 'UPDATE', 'MODIFY',
  'PDF', 'DOWNLOAD', 'EXPORT', 'PRINT',
  'SAVE', 'SUBMIT', 'CANCEL', 'CLOSE',
  'NEXT', 'PREVIOUS', 'BACK', 'CONTINUE'
];

interface Action {
  type: 'navigation' | 'create' | 'delete' | 'edit' | 'download' | 'submit' | 'other';
  label: string;
  location: 'header' | 'inline' | 'footer' | 'unknown';
  nodeId?: string;
}

/**
 * Extract action buttons/links from a section
 */
function extractActions(section: FigmaNode): Action[] {
  const actions: Action[] = [];
  const textNodes = findAllTextNodes(section);
  const sectionBounds = section.absoluteBoundingBox;

  for (const textNode of textNodes) {
    const text = (textNode.characters || '').toUpperCase();

    for (const keyword of ACTION_KEYWORDS) {
      if (text.includes(keyword)) {
        actions.push({
          type: inferActionType(keyword),
          label: textNode.characters || '',
          location: getRelativePosition(textNode, sectionBounds),
          nodeId: textNode.id
        });
        break; // Only one action per text node
      }
    }
  }

  // Also check for clickable-looking elements (buttons)
  const buttonLikeNodes = findButtonLikeNodes(section);
  for (const button of buttonLikeNodes) {
    const buttonText = getTextFromNode(button);
    if (buttonText && !actions.some(a => a.label === buttonText)) {
      actions.push({
        type: 'other',
        label: buttonText,
        location: getRelativePosition(button, sectionBounds),
        nodeId: button.id
      });
    }
  }

  return actions;
}

function inferActionType(keyword: string): Action['type'] {
  if (['VIEW ALL', 'VIEW MORE', 'SEE ALL', 'SEE MORE', 'SHOW ALL', 'SHOW MORE', 'NEXT', 'PREVIOUS', 'BACK', 'CONTINUE'].includes(keyword)) {
    return 'navigation';
  }
  if (['ADD', 'ADD NEW', 'CREATE', 'NEW'].includes(keyword)) {
    return 'create';
  }
  if (['DELETE', 'REMOVE'].includes(keyword)) {
    return 'delete';
  }
  if (['EDIT', 'UPDATE', 'MODIFY'].includes(keyword)) {
    return 'edit';
  }
  if (['PDF', 'DOWNLOAD', 'EXPORT', 'PRINT'].includes(keyword)) {
    return 'download';
  }
  if (['SAVE', 'SUBMIT'].includes(keyword)) {
    return 'submit';
  }
  return 'other';
}

function getRelativePosition(
  node: FigmaNode,
  sectionBounds: { x: number; y: number; height: number } | undefined
): Action['location'] {
  if (!sectionBounds || !node.absoluteBoundingBox) return 'unknown';

  const nodeBounds = node.absoluteBoundingBox;
  const relativeY = nodeBounds.y - sectionBounds.y;
  const sectionHeight = sectionBounds.height;

  if (relativeY < sectionHeight * 0.2) return 'header';
  if (relativeY > sectionHeight * 0.8) return 'footer';
  return 'inline';
}

function findAllTextNodes(node: FigmaNode): FigmaNode[] {
  const textNodes: FigmaNode[] = [];

  function traverse(n: FigmaNode) {
    if (n.type === 'TEXT') {
      textNodes.push(n);
    }
    if (n.children) {
      for (const child of n.children) {
        traverse(child);
      }
    }
  }

  traverse(node);
  return textNodes;
}

function findButtonLikeNodes(node: FigmaNode): FigmaNode[] {
  const buttons: FigmaNode[] = [];

  function traverse(n: FigmaNode) {
    // Check if node looks like a button
    if ((n.type === 'FRAME' || n.type === 'INSTANCE') && n.absoluteBoundingBox) {
      const bounds = n.absoluteBoundingBox;
      const isSmallHeight = bounds.height < 50;
      const hasFill = n.fills?.some(f => f.visible !== false);
      const hasBorder = (n.strokes?.length || 0) > 0;
      const hasCornerRadius = (n.cornerRadius || 0) > 0;
      const hasText = findAllTextNodes(n).length === 1;

      if (isSmallHeight && (hasFill || hasBorder) && hasCornerRadius && hasText) {
        buttons.push(n);
      }
    }

    if (n.children) {
      for (const child of n.children) {
        traverse(child);
      }
    }
  }

  traverse(node);
  return buttons;
}

function getTextFromNode(node: FigmaNode): string | null {
  const textNodes = findAllTextNodes(node);
  if (textNodes.length === 1) {
    return textNodes[0].characters || null;
  }
  return null;
}

function inferSectionType(node: FigmaNode): SectionType {
  const name = node.name.toLowerCase();

  if (name.includes('header') || name.includes('nav')) return 'header';
  if (name.includes('hero')) return 'hero';
  if (name.includes('footer')) return 'footer';
  if (name.includes('sidebar')) return 'sidebar';
  if (name.includes('content') || name.includes('main')) return 'content';
  if (name.includes('card') || name.includes('grid')) return 'card-grid';
  if (name.includes('form')) return 'form';
  if (name.includes('table') || name.includes('list')) return 'data-display';
  if (name.includes('invoice')) return 'list';
  if (name.includes('transaction')) return 'list';
  if (name.includes('billing') || name.includes('payment')) return 'card';
  if (name.includes('stat') || name.includes('metric')) return 'stat-card';

  return 'section';
}
```

### Step 3b: UI Pattern Detection

Recognize common UI patterns to improve extraction accuracy:

```typescript
/**
 * UI Pattern definitions for common dashboard components
 */
const UI_PATTERNS = {
  'stat-card': {
    name: 'Stat Card',
    structure: 'icon-box + large-value + small-label',
    detect: (node: FigmaNode): boolean => {
      if (!node.children || node.children.length < 2) return false;

      // Look for: small container (icon) + text with large font + text with small font
      const hasIconBox = node.children.some(c =>
        c.type === 'FRAME' &&
        c.absoluteBoundingBox?.width < 60 &&
        c.absoluteBoundingBox?.height < 60
      );
      const textNodes = findTextNodes(node);
      const hasLargeText = textNodes.some(t => t.style?.fontSize >= 20);
      const hasSmallText = textNodes.some(t => t.style?.fontSize <= 14);

      return hasIconBox && hasLargeText && hasSmallText;
    }
  },

  'credit-card': {
    name: 'Credit Card Display',
    structure: 'gradient-bg + chip-icon + card-number + holder-info',
    detect: (node: FigmaNode): boolean => {
      // Check for gradient fill
      const hasGradient = node.fills?.some(f => f.type === 'GRADIENT_LINEAR');
      // Check for card number pattern (4 groups of 4)
      const textNodes = findTextNodes(node);
      const hasCardNumber = textNodes.some(t =>
        /\d{4}[\s•]+\d{4}[\s•]+\d{4}[\s•]+\d{4}/.test(t.characters || '')
      );

      return hasGradient && hasCardNumber;
    }
  },

  'list-item': {
    name: 'List Item',
    structure: 'icon/avatar + content-stack + optional-action',
    detect: (node: FigmaNode): boolean => {
      if (!node.children || node.children.length < 2) return false;

      const layout = node.layoutMode;
      if (layout !== 'HORIZONTAL') return false;

      // First child is small (icon/avatar)
      const firstChild = node.children[0];
      const isSmallLeading = firstChild?.absoluteBoundingBox?.width < 60;

      // Has text content
      const hasText = findTextNodes(node).length > 0;

      return isSmallLeading && hasText;
    }
  },

  'info-card': {
    name: 'Info Card',
    structure: 'title + key-value-pairs + action-buttons',
    detect: (node: FigmaNode): boolean => {
      const textNodes = findTextNodes(node);
      // Multiple text pairs suggest key-value structure
      const hasMultiplePairs = textNodes.length >= 4;
      // Look for action links/buttons
      const hasActions = node.children?.some(c =>
        c.name.toLowerCase().includes('action') ||
        c.name.toLowerCase().includes('button') ||
        c.name.toLowerCase().includes('edit') ||
        c.name.toLowerCase().includes('delete')
      );

      return hasMultiplePairs && hasActions;
    }
  },

  'table-row': {
    name: 'Table Row',
    structure: 'cell + cell + ... (consistent columns)',
    detect: (node: FigmaNode): boolean => {
      if (!node.children || node.children.length < 3) return false;

      // Horizontal layout
      if (node.layoutMode !== 'HORIZONTAL') return false;

      // Children have similar widths (table columns)
      const widths = node.children.map(c => c.absoluteBoundingBox?.width || 0);
      const avgWidth = widths.reduce((a, b) => a + b, 0) / widths.length;
      const isConsistent = widths.every(w => Math.abs(w - avgWidth) < avgWidth * 0.5);

      return isConsistent;
    }
  },

  'action-button': {
    name: 'Action Button',
    structure: 'text + optional-icon with fill/border',
    detect: (node: FigmaNode): boolean => {
      const hasFill = node.fills?.some(f => f.visible !== false);
      const hasBorder = node.strokes?.length > 0;
      const hasText = findTextNodes(node).length === 1;
      const isSmall = (node.absoluteBoundingBox?.height || 0) < 50;

      return (hasFill || hasBorder) && hasText && isSmall;
    }
  }
};

/**
 * Detect which UI pattern a node matches
 */
function detectUIPattern(node: FigmaNode): string | null {
  for (const [patternId, pattern] of Object.entries(UI_PATTERNS)) {
    if (pattern.detect(node)) {
      return patternId;
    }
  }
  return null;
}

/**
 * Find all text nodes within a node tree
 */
function findTextNodes(node: FigmaNode): FigmaNode[] {
  const textNodes: FigmaNode[] = [];

  function traverse(n: FigmaNode) {
    if (n.type === 'TEXT') {
      textNodes.push(n);
    }
    if (n.children) {
      for (const child of n.children) {
        traverse(child);
      }
    }
  }

  traverse(node);
  return textNodes;
}
```

### Step 3c: Inventory Validation (--thorough mode)

When using `--thorough` mode, validate extracted sections against the visual inventory:

```typescript
function validateAgainstInventory(
  extractedSections: Section[],
  inventoryPath: string
): ValidationResult {
  const inventory = loadInventory(inventoryPath);

  const result: ValidationResult = {
    expected: inventory.totalSections,
    found: extractedSections.length,
    coverage: 0,
    missing: [],
    extra: []
  };

  // Compare section IDs
  const inventoryIds = new Set(inventory.sections.map(s => s.id));
  const extractedIds = new Set(extractedSections.map(s => s.id));

  for (const id of inventoryIds) {
    if (!extractedIds.has(id)) {
      result.missing.push(id);
    }
  }

  for (const id of extractedIds) {
    if (!inventoryIds.has(id)) {
      result.extra.push(id);
    }
  }

  result.coverage = (result.found - result.missing.length) / result.expected * 100;

  return result;
}
```
```

### Step 4: Detect Responsive Variants

Look for frames with same base name but different widths:
```typescript
function detectResponsiveVariants(frames: ScreenFrame[]): ResponsiveSet[] {
  // Group by base name
  const groups = new Map<string, ScreenFrame[]>();
  
  for (const frame of frames) {
    const baseName = frame.name.replace(/\s*(mobile|tablet|desktop|sm|md|lg|xl)/i, '').trim();
    if (!groups.has(baseName)) groups.set(baseName, []);
    groups.get(baseName)!.push(frame);
  }
  
  // Return groups with multiple sizes
  return [...groups.entries()]
    .filter(([_, frames]) => frames.length > 1)
    .map(([name, frames]) => ({
      name,
      breakpoints: frames.map(f => ({
        width: f.width,
        label: inferBreakpoint(f.width),
        frameId: f.id
      })).sort((a, b) => a.width - b.width)
    }));
}

function inferBreakpoint(width: number): string {
  if (width <= 390) return 'mobile';
  if (width <= 768) return 'tablet';
  if (width <= 1024) return 'laptop';
  return 'desktop';
}
```

### Step 5: Document Layout Patterns

Identify common patterns:
```typescript
const LAYOUT_PATTERNS = {
  'sidebar-content': {
    detect: (sections) => 
      sections.some(s => s.type === 'sidebar') &&
      sections.some(s => s.type === 'content'),
    description: 'Fixed sidebar with scrollable content area'
  },
  
  'header-content-footer': {
    detect: (sections) =>
      sections[0]?.type === 'header' &&
      sections[sections.length - 1]?.type === 'footer',
    description: 'Standard page layout with sticky header/footer'
  },
  
  'dashboard-grid': {
    detect: (sections) =>
      sections.filter(s => s.type === 'card-grid').length >= 2,
    description: 'Grid-based dashboard with multiple card sections'
  },
  
  'split-screen': {
    detect: (sections) =>
      sections.length === 2 &&
      Math.abs(sections[0].bounds.width - sections[1].bounds.width) < 50,
    description: 'Two equal columns, often used for auth pages'
  }
};
```

### Step 6: Generate Per-Screen Documentation

**IMPORTANT:** Create INDIVIDUAL files for each screen layout found in the Figma file.

#### Output Structure:

```
design-system/
└── specs/
    ├── layouts.md              # Index file linking to all screens
    └── layouts/                # Individual screen specs (one per frame)
        ├── {ScreenName1}.md    # e.g., if Figma has "Dashboard" frame
        ├── {ScreenName2}.md    # e.g., if Figma has "Settings" frame
        └── ...                 # One file per top-level screen frame
```

#### Naming Convention:

Convert Figma frame names to valid filenames:
```typescript
function frameNameToFilename(frameName: string): string {
  return frameName
    .replace(/[^a-zA-Z0-9\s-]/g, '')  // Remove special chars
    .trim()
    .replace(/\s+/g, '-')              // Spaces to hyphens
    .replace(/-+/g, '-');              // Collapse multiple hyphens
}
// "Dashboard - Sidebar" → "Dashboard-Sidebar.md"
// "🚀 Dashboard" → "Dashboard.md"
```

#### Index file (`layouts.md`):

```markdown
# Layout Specifications

> Extracted from: {fileName}
> Generated: {date}
> Screens: {screenCount}

## Available Screens

| Screen | Dimensions | Pattern | Details |
|--------|------------|---------|---------|
{{#each screens}}
| [{name}](layouts/{filename}.md) | {width}×{height} | {pattern} | {sectionCount} sections |
{{/each}}

## Common Patterns Found

{{#each patterns}}
- **{name}**: {description} (used in: {screenList})
{{/each}}
```

#### Individual screen file (`layouts/{ScreenName}.md`):

Each screen gets its own detailed specification file:

```markdown
# {ScreenName} Layout

> Frame: {figmaFrameName}
> Dimensions: {width}×{height}
> Pattern: {layoutPattern}

## Breakpoints (if responsive variants found)

| Breakpoint | Width | Frame Name |
|------------|-------|------------|
{{#each breakpoints}}
| {label} | {width}px | {frameName} |
{{/each}}

## Grid System

- **Columns**: {columnCount}
- **Gutter**: {gutterSize}px
- **Margin**: {marginSize}px
- **Max-width**: {maxWidth}px

## Structure

{asciiDiagram}

## Sections

| Section | Type | Dimensions | Grid Position | Spacing |
|---------|------|------------|---------------|---------|
{{#each sections}}
| {name} | {type} | {width}×{height} | col {gridPosition.column}, span {gridPosition.columnSpan}{{#if gridPosition.rowSpan > 1}}, row-span {gridPosition.rowSpan}{{/if}} | {spacing} |
{{/each}}

## Grid Layouts

{{#each gridLayouts}}
### {containerPath}

```css
{css}
```

**Sections in this grid:**
{{#each positions}}
- `{sectionName}`: column {column}{{#if columnSpan > 1}}-{column + columnSpan - 1}{{/if}}, row {row}{{#if rowSpan > 1}}-{row + rowSpan - 1}{{/if}}
{{/each}}
{{/each}}

## Components Used

{{#each componentInstances}}
- `{componentName}` ({instanceCount} instances)
{{/each}}

## Token Usage

- Background: {backgroundToken}
- Section gaps: {gapToken}
- Content padding: {paddingToken}

## Responsive Behavior

{{#if hasResponsiveVariants}}
**{largerBreakpoint} → {smallerBreakpoint}:**
{{#each layoutChanges}}
- {description}
{{/each}}
{{else}}
No responsive variants found for this screen.
{{/if}}

### Token Usage

- Background: `--color-surface`
- Section gaps: `--spacing-lg` (24px)
- Content padding: `--spacing-xl` (32px)

```

### Step 7: Update Metadata

```json
{
  "screens": {
    "{ScreenName}": {
      "nodeId": "{nodeId}",
      "hash": "{contentHash}",
      "pageId": "{pageId}",
      "breakpoints": ["{breakpoint1}", "{breakpoint2}"],
      "pattern": "{detectedPattern}",
      "lastModified": "{timestamp}"
    }
    // ... one entry per screen frame found
  }
}
```

### Step 8: Report

```
✓ Layouts extracted

Found {count} screen layouts:

┌─────────────────┬────────────┬───────────────────────┬────────────┐
│ Screen          │ Breakpoints│ Pattern               │ Sections   │
├─────────────────┼────────────┼───────────────────────┼────────────┤
{{#each screens}}
│ {name}          │ {breakpointCount} │ {pattern}       │ {sectionCount} │
{{/each}}
└─────────────────┴────────────┴───────────────────────┴────────────┘

Grid systems detected:
{{#each grids}}
├── {columns}-column grid ({width}px)
{{/each}}

Output:
├── layouts.md (index)
└── layouts/{screenName}.md (one per screen)
```

## Edge Cases

### No Grid Defined
```
ℹ Info: No layout grid defined on "{frameName}".
Layout inferred from auto-layout structure.
Consider adding layout grids in Figma for precise specs.
```

### Overlapping Elements
```
⚠ Warning: Overlapping elements detected in "{frameName}".
This may indicate absolute positioning.
Document as "positioned" layout type.
```

### Very Long Pages
For scrolling pages (height > 3000px):
```
ℹ Info: Long scrolling page detected ({height}px).
Documenting visible sections. Full page may have {n} sections.
```

## Validation

Check and report:
- [ ] All screens have names
- [ ] Responsive variants are consistent
- [ ] Grid system is defined
- [ ] Sections follow logical order
- [ ] No orphaned/floating elements

## Fallbacks

Handle common variations gracefully:

- **Non-standard screen sizes?** Include any frame with height > 400px or screen-like name
- **No layout grid defined?** Infer structure from auto-layout properties
- **Mixed content on page?** Filter by screen-like characteristics, ignore component frames
- **No clear sections?** Document structure as flat list of children
- **Overlapping elements?** Note as "positioned layout" rather than failing
- **Single screen only?** Create single layout file, still useful

The goal is to document all screen layouts found, adapting to how the file is organized.

## Image Extraction (--thorough mode)

When using `--thorough` mode, automatically extract image assets from each screen:

### Step 8b: Extract Screen Images

In thorough mode, export images from Figma for each screen being processed:

```typescript
interface ImageExportOptions {
  format: 'png' | 'jpg' | 'svg';
  scale: 1 | 2 | 3;  // Export at 2x by default for retina
  types: ('banner' | 'background' | 'avatar' | 'photo' | 'illustration' | 'logo')[];
}

const THOROUGH_IMAGE_OPTIONS: ImageExportOptions = {
  format: 'png',
  scale: 2,
  types: ['banner', 'background', 'avatar', 'photo', 'illustration', 'logo']
};

/**
 * Extract and export images for a screen layout
 * Called automatically in --thorough mode
 */
async function extractScreenImages(
  screenFrame: FigmaNode,
  screenName: string,
  fileKey: string,
  options: ImageExportOptions = THOROUGH_IMAGE_OPTIONS
): Promise<ExportedImage[]> {
  const exportedImages: ExportedImage[] = [];

  // Find all image nodes in the screen
  const imageNodes = findAllImages(screenFrame);

  // Filter by requested types
  const toExport = imageNodes.filter(img => options.types.includes(img.type));

  if (toExport.length === 0) {
    console.log(`ℹ No images found in ${screenName} for export`);
    return exportedImages;
  }

  console.log(`📸 Exporting ${toExport.length} images from ${screenName}...`);

  // Collect node IDs for batch export
  const nodeIds = toExport.map(img => img.id);

  // Call Figma API to get image URLs
  // GET /v1/images/{fileKey}?ids={nodeIds.join(',')}&format={format}&scale={scale}
  const imageUrls = await fetchFigmaImages(fileKey, nodeIds, options.format, options.scale);

  // Download and save each image
  for (const img of toExport) {
    const url = imageUrls.get(img.id);
    if (!url) continue;

    // Determine output path based on image type
    const subdir = getImageSubdirectory(img.type);
    const filename = sanitizeFilename(`${screenName}-${img.name}.${options.format}`);
    const outputPath = `design-system/assets/images/${subdir}/${filename}`;

    // Download and save
    await downloadAndSave(url, outputPath);

    exportedImages.push({
      id: img.id,
      name: img.name,
      type: img.type,
      path: outputPath,
      dimensions: img.dimensions,
      screen: screenName
    });

    console.log(`  ✓ Saved: ${outputPath}`);
  }

  return exportedImages;
}

function getImageSubdirectory(type: string): string {
  switch (type) {
    case 'banner':
    case 'background':
      return 'backgrounds';
    case 'avatar':
      return 'avatars';
    case 'photo':
    case 'illustration':
      return 'content';
    case 'logo':
      return 'logos';
    default:
      return 'misc';
  }
}

function sanitizeFilename(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9.-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Fetch image URLs from Figma API
 */
async function fetchFigmaImages(
  fileKey: string,
  nodeIds: string[],
  format: string,
  scale: number
): Promise<Map<string, string>> {
  const FIGMA_TOKEN = process.env.FIGMA_TOKEN;
  if (!FIGMA_TOKEN) {
    console.log('⚠ FIGMA_TOKEN not set - skipping image export');
    return new Map();
  }

  const idsParam = nodeIds.join(',');
  const url = `https://api.figma.com/v1/images/${fileKey}?ids=${idsParam}&format=${format}&scale=${scale}`;

  const response = await fetch(url, {
    headers: { 'X-Figma-Token': FIGMA_TOKEN }
  });

  if (!response.ok) {
    console.log(`⚠ Figma API error: ${response.status}`);
    return new Map();
  }

  const data = await response.json();
  const imageMap = new Map<string, string>();

  if (data.images) {
    for (const [nodeId, imageUrl] of Object.entries(data.images)) {
      if (imageUrl) {
        imageMap.set(nodeId, imageUrl as string);
      }
    }
  }

  return imageMap;
}
```

### Output Structure (images):

```
design-system/
└── assets/
    └── images/
        ├── backgrounds/       # Banner and background images
        │   ├── profile-banner.png
        │   ├── signin-wave.png
        │   └── ...
        ├── avatars/           # User avatars
        │   ├── profile-alec.png
        │   └── ...
        ├── content/           # Photos and illustrations
        │   ├── profile-project-modern.png
        │   └── ...
        └── logos/             # Company/brand logos
            └── ...
```

### Update Asset Manifest

After exporting images, update `design-system/assets/asset-manifest.json`:

```typescript
function updateAssetManifestWithExports(
  manifest: AssetManifest,
  exportedImages: ExportedImage[]
): void {
  for (const exported of exportedImages) {
    // Find the image entry in manifest
    const entry = manifest.images.find(img => img.id === exported.id);
    if (entry) {
      entry.exportPath = exported.path;
      entry.hasOriginal = true;
    }
  }

  // Update summary
  manifest.summary.exported = manifest.images.filter(img => img.exportPath).length;
  manifest.summary.placeholders = manifest.summary.totalImages - manifest.summary.exported;

  // Save updated manifest
  writeFileSync(
    'design-system/assets/asset-manifest.json',
    JSON.stringify(manifest, null, 2)
  );
}
```

### Thorough Mode Report Addition

When `--thorough` mode is used, add image export to the report:

```
✓ Layouts extracted (thorough mode)

Image Assets Exported:
├── Backgrounds: {count} images
├── Avatars: {count} images
├── Content: {count} images
└── Total: {totalExported} of {totalDetected} images

Output:
├── layouts.md (index)
├── layouts/{screenName}.md (one per screen)
└── assets/images/{category}/*.png (exported images)
```

## Next Step

⚠️ **DO NOT SKIP TO VALIDATION YET** - Asset extraction is required first!

Proceed to: `extract-icons.md` (extract icons before validation)
