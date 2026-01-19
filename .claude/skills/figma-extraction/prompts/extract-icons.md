# 10 - Extract Icons and Map to Library

## Purpose

Detect icon usage throughout the Figma file and map them to a standard icon library (Lucide by default). This enables consistent icon rendering in HTML previews and React components.

## Sources in Figma

1. **Icon Components** - COMPONENT or COMPONENT_SET nodes with icon-like characteristics
2. **Icon Instances** - INSTANCE nodes referencing icon components
3. **Icon Frames** - Small frames containing vector graphics
4. **Named Icons** - Nodes with names containing "icon", "ic-", etc.

## Output Structure

```
design-system/
├── config/
│   └── icon-mapping.json     # Base mapping (already exists)
├── assets/
│   ├── icon-manifest.json    # Detected icons and mappings
│   └── icons/                # Custom SVG icons (if extracted)
│       └── {icon-name}.svg
```

## Process

### Step 1: Load Icon Mapping Configuration

```typescript
interface IconMappingConfig {
  library: string;           // "lucide"
  cdnUrl: string;            // CDN URL for the library
  mappings: Record<string, string>;  // figma-name → library-icon
  patterns: Array<{
    match: string;           // Pattern like "nav-*"
    strip: string;           // Part to remove: "nav-"
  }>;
  sizeMapping: Record<string, number>;
  defaultSize: string;
}

// Load from design-system/config/icon-mapping.json
const config = loadIconMappingConfig();
```

### Step 2: Detect Icon Nodes

Scan the Figma document for icon-like nodes:

```typescript
function isIconLikeNode(node: FigmaNode): boolean {
  // Check 1: Size-based detection (small, roughly square)
  const { width, height } = node.absoluteBoundingBox || {};
  const isSmall = width <= 48 && height <= 48;
  const isSquareish = Math.abs(width - height) <= 4;

  // Check 2: Name-based detection
  const iconNamePatterns = [
    /^icon[-_]/i,
    /[-_]icon$/i,
    /^ic[-_]/i,
    /^i[-_]/i,
    /\bicon\b/i
  ];
  const hasIconName = iconNamePatterns.some(p => p.test(node.name));

  // Check 3: Type-based detection
  const isVectorGroup = node.type === 'GROUP' && hasOnlyVectorChildren(node);
  const isVectorFrame = node.type === 'FRAME' && hasOnlyVectorChildren(node);
  const isComponent = node.type === 'COMPONENT' || node.type === 'INSTANCE';

  // Check 4: Structure-based (contains vectors, no text)
  const hasVectors = containsVectorNodes(node);
  const hasNoText = !containsTextNodes(node);

  return (
    (isSmall && isSquareish && hasVectors && hasNoText) ||
    hasIconName ||
    (isComponent && isSmall && isSquareish)
  );
}

function findAllIcons(node: FigmaNode, icons: IconInfo[] = []): IconInfo[] {
  if (isIconLikeNode(node)) {
    icons.push({
      id: node.id,
      name: node.name,
      type: node.type,
      dimensions: {
        width: node.absoluteBoundingBox?.width,
        height: node.absoluteBoundingBox?.height
      },
      parentPath: getParentPath(node)
    });
  }

  if (node.children) {
    for (const child of node.children) {
      findAllIcons(child, icons);
    }
  }

  return icons;
}
```

### Step 3: Normalize Icon Names

Clean up Figma icon names for mapping:

```typescript
function normalizeIconName(figmaName: string, config: IconMappingConfig): string {
  let normalized = figmaName.toLowerCase().trim();

  // Apply pattern stripping (nav-dashboard → dashboard)
  for (const pattern of config.patterns) {
    if (pattern.match.startsWith('*')) {
      const suffix = pattern.match.slice(1);
      if (normalized.endsWith(suffix.toLowerCase())) {
        normalized = normalized.slice(0, -pattern.strip.length);
      }
    } else if (pattern.match.endsWith('*')) {
      const prefix = pattern.match.slice(0, -1);
      if (normalized.startsWith(prefix.toLowerCase())) {
        normalized = normalized.slice(pattern.strip.length);
      }
    }
  }

  // Clean up common separators
  normalized = normalized
    .replace(/[-_\s]+/g, '-')  // Normalize separators
    .replace(/^-|-$/g, '');    // Trim separators

  return normalized;
}
```

### Step 4: Map to Library Icons

```typescript
interface IconMapping {
  figmaName: string;
  normalizedName: string;
  libraryIcon: string | null;
  confidence: 'exact' | 'fuzzy' | 'inferred' | 'unmapped';
  usedIn: string[];  // Node IDs where this icon is used
}

function mapIconToLibrary(
  icon: IconInfo,
  config: IconMappingConfig
): IconMapping {
  const normalized = normalizeIconName(icon.name, config);

  // Try exact match
  if (config.mappings[normalized]) {
    return {
      figmaName: icon.name,
      normalizedName: normalized,
      libraryIcon: config.mappings[normalized],
      confidence: 'exact',
      usedIn: [icon.id]
    };
  }

  // Try partial/fuzzy match
  const fuzzyMatch = findFuzzyMatch(normalized, config.mappings);
  if (fuzzyMatch) {
    return {
      figmaName: icon.name,
      normalizedName: normalized,
      libraryIcon: fuzzyMatch.icon,
      confidence: 'fuzzy',
      usedIn: [icon.id]
    };
  }

  // Try semantic inference
  const inferred = inferIconFromContext(icon);
  if (inferred && config.mappings[inferred]) {
    return {
      figmaName: icon.name,
      normalizedName: normalized,
      libraryIcon: config.mappings[inferred],
      confidence: 'inferred',
      usedIn: [icon.id]
    };
  }

  // Unmapped - will need custom extraction or manual mapping
  return {
    figmaName: icon.name,
    normalizedName: normalized,
    libraryIcon: null,
    confidence: 'unmapped',
    usedIn: [icon.id]
  };
}

function findFuzzyMatch(
  name: string,
  mappings: Record<string, string>
): { key: string; icon: string } | null {
  // Check if name contains a known icon key
  for (const [key, icon] of Object.entries(mappings)) {
    if (name.includes(key) || key.includes(name)) {
      return { key, icon };
    }
  }

  // Check word-level matches
  const words = name.split('-');
  for (const word of words) {
    if (mappings[word]) {
      return { key: word, icon: mappings[word] };
    }
  }

  return null;
}

function inferIconFromContext(icon: IconInfo): string | null {
  // Infer from parent path
  const path = icon.parentPath.join('/').toLowerCase();

  if (path.includes('sidebar') || path.includes('nav')) {
    // Navigation context - look for common nav icons
    if (icon.name.includes('1') || path.includes('first')) return 'dashboard';
    if (path.includes('table')) return 'table';
    if (path.includes('billing')) return 'billing';
    if (path.includes('profile')) return 'profile';
  }

  if (path.includes('action') || path.includes('button')) {
    if (icon.dimensions.width < 20) return 'chevron-right';
  }

  return null;
}
```

### Step 5: Collect Icon Usage Context

Track where each icon is used for the manifest:

```typescript
interface IconUsageContext {
  screenName: string;
  sectionName: string;
  componentType: string;  // sidebar, navbar, card, button, etc.
  size: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

function collectIconUsage(
  icons: IconInfo[],
  screens: ScreenInfo[]
): Map<string, IconUsageContext[]> {
  const usage = new Map<string, IconUsageContext[]>();

  for (const icon of icons) {
    const contexts: IconUsageContext[] = [];

    for (const screen of screens) {
      if (isDescendantOf(icon.id, screen.nodeId)) {
        const section = findContainingSection(icon.id, screen.sections);
        const size = inferIconSize(icon.dimensions);

        contexts.push({
          screenName: screen.name,
          sectionName: section?.name || 'unknown',
          componentType: section?.type || 'unknown',
          size
        });
      }
    }

    usage.set(icon.id, contexts);
  }

  return usage;
}

function inferIconSize(dimensions: { width: number; height: number }): string {
  const size = Math.max(dimensions.width, dimensions.height);
  if (size <= 14) return 'xs';
  if (size <= 18) return 'sm';
  if (size <= 22) return 'md';
  if (size <= 28) return 'lg';
  return 'xl';
}
```

### Step 6: Generate Icon Manifest

```typescript
interface IconManifest {
  version: string;
  extractedAt: string;
  library: string;
  cdnUrl: string;
  summary: {
    total: number;
    mapped: number;
    unmapped: number;
    exactMatches: number;
    fuzzyMatches: number;
    inferredMatches: number;
  };
  icons: {
    mapped: Array<{
      figmaName: string;
      libraryIcon: string;
      confidence: string;
      usedIn: IconUsageContext[];
    }>;
    unmapped: Array<{
      figmaName: string;
      nodeId: string;
      dimensions: { width: number; height: number };
      usedIn: IconUsageContext[];
      suggestedAction: 'extract-svg' | 'manual-map' | 'use-placeholder';
    }>;
  };
}

function generateIconManifest(
  mappings: IconMapping[],
  usage: Map<string, IconUsageContext[]>,
  config: IconMappingConfig
): IconManifest {
  const mapped = mappings.filter(m => m.libraryIcon !== null);
  const unmapped = mappings.filter(m => m.libraryIcon === null);

  return {
    version: '1.0',
    extractedAt: new Date().toISOString(),
    library: config.library,
    cdnUrl: config.cdnUrl,
    summary: {
      total: mappings.length,
      mapped: mapped.length,
      unmapped: unmapped.length,
      exactMatches: mapped.filter(m => m.confidence === 'exact').length,
      fuzzyMatches: mapped.filter(m => m.confidence === 'fuzzy').length,
      inferredMatches: mapped.filter(m => m.confidence === 'inferred').length
    },
    icons: {
      mapped: mapped.map(m => ({
        figmaName: m.figmaName,
        libraryIcon: m.libraryIcon!,
        confidence: m.confidence,
        usedIn: m.usedIn.flatMap(id => usage.get(id) || [])
      })),
      unmapped: unmapped.map(m => ({
        figmaName: m.figmaName,
        nodeId: m.usedIn[0],
        dimensions: { width: 24, height: 24 }, // Default, actual would be from IconInfo
        usedIn: m.usedIn.flatMap(id => usage.get(id) || []),
        suggestedAction: suggestAction(m)
      }))
    }
  };
}

function suggestAction(mapping: IconMapping): string {
  // Brand icons or logos should be extracted
  if (/logo|brand|company/i.test(mapping.figmaName)) {
    return 'extract-svg';
  }
  // Simple icons can use placeholder
  if (mapping.usedIn.length === 1) {
    return 'use-placeholder';
  }
  // Frequently used icons should be manually mapped
  return 'manual-map';
}
```

### Step 7: Output Files

Write the manifest to `design-system/assets/icon-manifest.json`:

```json
{
  "version": "1.0",
  "extractedAt": "2026-01-16T10:30:00Z",
  "library": "lucide",
  "cdnUrl": "https://unpkg.com/lucide@latest",
  "summary": {
    "total": 45,
    "mapped": 38,
    "unmapped": 7,
    "exactMatches": 30,
    "fuzzyMatches": 5,
    "inferredMatches": 3
  },
  "icons": {
    "mapped": [
      {
        "figmaName": "nav-dashboard",
        "libraryIcon": "layout-dashboard",
        "confidence": "exact",
        "usedIn": [
          { "screenName": "Dashboard", "sectionName": "sidebar", "componentType": "Sidebar", "size": "md" }
        ]
      },
      {
        "figmaName": "search-icon",
        "libraryIcon": "search",
        "confidence": "exact",
        "usedIn": [
          { "screenName": "Dashboard", "sectionName": "navbar", "componentType": "Navbar", "size": "sm" }
        ]
      }
    ],
    "unmapped": [
      {
        "figmaName": "soft-ui-logo",
        "nodeId": "1:234",
        "dimensions": { "width": 32, "height": 32 },
        "usedIn": [
          { "screenName": "Dashboard", "sectionName": "sidebar", "componentType": "Sidebar", "size": "lg" }
        ],
        "suggestedAction": "extract-svg"
      }
    ]
  }
}
```

### Step 8: Update Extraction Metadata

Add icon extraction info to `extraction-meta.json`:

```json
{
  "icons": {
    "extractedAt": "2026-01-16T10:30:00Z",
    "hash": "{contentHash}",
    "total": 45,
    "mapped": 38,
    "unmapped": 7,
    "library": "lucide"
  }
}
```

### Step 9: Report

```
✓ Icons extracted and mapped

Icon Summary:
├── Total icons detected: 45
├── Mapped to Lucide: 38 (84%)
│   ├── Exact matches: 30
│   ├── Fuzzy matches: 5
│   └── Inferred: 3
└── Unmapped: 7 (16%)
    └── Suggested: 3 extract, 2 manual-map, 2 placeholder

Top icons by usage:
┌─────────────────────┬────────────────────┬───────┐
│ Figma Name          │ Lucide Icon        │ Uses  │
├─────────────────────┼────────────────────┼───────┤
│ nav-dashboard       │ layout-dashboard   │ 6     │
│ search-icon         │ search             │ 6     │
│ notification        │ bell               │ 6     │
│ settings            │ settings           │ 6     │
│ profile             │ user               │ 5     │
└─────────────────────┴────────────────────┴───────┘

Unmapped icons requiring attention:
┌─────────────────────┬────────────────────────────┐
│ Figma Name          │ Suggested Action           │
├─────────────────────┼────────────────────────────┤
│ soft-ui-logo        │ extract-svg (brand icon)   │
│ custom-chart-icon   │ manual-map                 │
│ decorative-star     │ use-placeholder            │
└─────────────────────┴────────────────────────────┘

Output:
├── assets/icon-manifest.json (2.4 KB)
└── config/icon-mapping.json (updated if new mappings added)
```

## Edge Cases

### No Icons Found
```
ℹ Info: No icon-like nodes detected in this file.
This may indicate:
- Icons are embedded as images (not vectors)
- Icons use non-standard naming
- File doesn't use icons

Proceeding without icon manifest.
```

### All Icons Unmapped
```
⚠ Warning: No icons could be mapped to {library}.
Consider:
1. Adding custom mappings to config/icon-mapping.json
2. Using a different icon library
3. Extracting SVGs directly from Figma
```

### Large Icon Sets (Component Libraries)
```
ℹ Info: Detected icon library component set with {count} icons.
This appears to be a dedicated icon library.
Consider extracting as a complete icon set.
```

## Integration

This step runs AFTER component extraction (06) and BEFORE content extraction (07b).

The icon manifest is used by:
- `extract-content.md` - Add icon references to section data
- `preview.md` - Render icons using Lucide CDN

## Fallbacks

- **No icon config?** Use default Lucide mappings from this prompt
- **Mapping fails?** Use placeholder icon (`circle`) and log warning
- **Custom icons?** Mark for manual SVG extraction (future enhancement)

## Next Step

Proceed to: `extract-assets.md` (image asset handling)
