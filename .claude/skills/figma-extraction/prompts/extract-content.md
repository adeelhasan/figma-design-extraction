# 07b - Extract Screen Content (Deep Content Extraction)

## Purpose

Extract **complete content and data schemas** from each screen frame in Figma. This captures not just structure, but actual text, values, patterns, actions, **and asset references** - enabling pixel-perfect layouts in the app.

## Prerequisites

Before running this step, ensure these have been extracted:
- `assets/icon-manifest.json` from step 10 (icon extraction)
- `assets/asset-manifest.json` from step 11 (image asset extraction)

## Output Structure

Screens are discovered **dynamically** from Figma (not hardcoded). For each screen found:

```
design-system/preview/layouts/
├── data/
│   ├── {screen-name}.json    # Content data (e.g., dashboard.json, billing.json)
│   └── {screen-name}.ts      # TypeScript schema
├── {screen-name}.html        # Standalone preview (e.g., dashboard.html)
└── index.html                # Overview linking all screens (layouts.html moved here)
```

Screen names are derived from Figma frame names, converted to lowercase kebab-case:
- "Dashboard" → `dashboard.json`, `dashboard.html`
- "Sign In" → `sign-in.json`, `sign-in.html`
- "Billing Page" → `billing-page.json`, `billing-page.html`

## Process

### Step 1: Extract ALL Text Content

For each screen frame, recursively extract every TEXT node:

```typescript
interface TextNode {
  id: string;
  characters: string;           // The actual text content
  fontSize: number;
  fontWeight: number;
  fills: Paint[];               // Text color
  bounds: BoundingBox;          // Position in frame
  parentPath: string[];         // Hierarchy: ["Sidebar", "NavItem", "Label"]
  // Extended style properties for fidelity
  lineHeight: number | 'AUTO';  // node.style.lineHeightPx or 'AUTO'
  letterSpacing: number;        // node.style.letterSpacing
  textCase: 'ORIGINAL' | 'UPPER' | 'LOWER' | 'TITLE';  // node.style.textCase
  textDecoration: 'NONE' | 'UNDERLINE' | 'STRIKETHROUGH';
  opacity: number;              // node.opacity (0-1)
  textAlign: 'LEFT' | 'CENTER' | 'RIGHT' | 'JUSTIFIED';
}

function extractAllText(node: FigmaNode, parentPath: string[] = []): TextNode[] {
  const texts: TextNode[] = [];

  if (node.type === 'TEXT') {
    texts.push({
      id: node.id,
      characters: node.characters,
      fontSize: node.style?.fontSize,
      fontWeight: node.style?.fontWeight,
      fills: node.fills,
      bounds: node.absoluteBoundingBox,
      parentPath: parentPath,
      // Extended properties
      lineHeight: node.style?.lineHeightPx || 'AUTO',
      letterSpacing: node.style?.letterSpacing || 0,
      textCase: node.style?.textCase || 'ORIGINAL',
      textDecoration: node.style?.textDecoration || 'NONE',
      opacity: node.opacity ?? 1,
      textAlign: node.style?.textAlignHorizontal || 'LEFT'
    });
  }

  if (node.children) {
    for (const child of node.children) {
      texts.push(...extractAllText(child, [...parentPath, node.name]));
    }
  }

  return texts;
}
```

### Step 2: Group by Section (Enhanced with Bounds and Metadata)

Organize text nodes by their containing section, capturing full metadata:

```typescript
interface EnhancedSectionContent {
  id: string;
  name: string;
  type: SectionType;
  pattern: string | null;          // Detected UI pattern
  bounds: {                        // Full bounds information
    x: number;
    y: number;
    width: number;
    height: number;
  };
  header: {
    title: string | null;
    subtitle: string | null;
    action: ActionComposition | null;  // e.g., "VIEW ALL" button
  } | null;
  texts: TextNode[];
  children: FigmaNode[];
  itemCount: number;               // Total items in section
  extractedItemCount: number;      // Items successfully extracted
  depth: number;                   // Nesting depth from root
  path: string;                    // Hierarchy path e.g., "Main/Content/Cards"
}

function groupBySection(texts: TextNode[], frame: FigmaNode, thorough: boolean = false): EnhancedSectionContent[] {
  const sections: EnhancedSectionContent[] = [];
  const config = thorough ? { maxDepth: 10, minSize: 50 } : { maxDepth: 3, minSize: 100 };

  // Recursively extract sections
  function extractSections(node: FigmaNode, depth: number, path: string): void {
    if (depth > config.maxDepth) return;

    const bounds = node.absoluteBoundingBox;
    if (!bounds || bounds.width < config.minSize || bounds.height < config.minSize) return;

    // Check if this is a meaningful section
    if (isMeaningfulSection(node)) {
      const sectionTexts = texts.filter(t =>
        t.parentPath.includes(node.name)
      );

      const header = extractSectionHeader(node, sectionTexts);
      const itemCount = countItems(node);

      sections.push({
        id: inferSectionId(node.name),
        name: node.name,
        type: inferSectionType(node),
        pattern: detectUIPattern(node),
        bounds: {
          x: bounds.x,
          y: bounds.y,
          width: bounds.width,
          height: bounds.height
        },
        header,
        texts: sectionTexts,
        children: node.children || [],
        itemCount,
        extractedItemCount: 0,  // Updated after extraction
        depth,
        path: `${path}/${node.name}`
      });
    }

    // Recurse into children
    for (const child of node.children || []) {
      if (child.type === 'FRAME' || child.type === 'GROUP' || child.type === 'INSTANCE') {
        extractSections(child, depth + 1, `${path}/${node.name}`);
      }
    }
  }

  // Start extraction from frame root
  extractSections(frame, 0, '');

  return sections;
}

/**
 * Extract section header with title, subtitle, and action button
 */
function extractSectionHeader(node: FigmaNode, texts: TextNode[]): EnhancedSectionContent['header'] | null {
  // Find title - typically first large/bold text at top
  const sortedByY = [...texts].sort((a, b) => a.bounds.y - b.bounds.y);
  const topTexts = sortedByY.filter(t =>
    t.bounds.y < node.absoluteBoundingBox.y + 60  // Within top 60px
  );

  if (topTexts.length === 0) return null;

  // Title is usually the largest or boldest text at top
  const title = topTexts.find(t => t.fontWeight >= 600 || t.fontSize >= 16);
  const subtitle = topTexts.find(t =>
    t !== title &&
    t.fontSize < (title?.fontSize || 16) &&
    t.bounds.y > (title?.bounds.y || 0)
  );

  // Look for action in header row
  const headerAction = findHeaderAction(node);

  return {
    title: title?.characters || null,
    subtitle: subtitle?.characters || null,
    action: headerAction
  };
}

/**
 * Find action button/link in section header
 */
function findHeaderAction(node: FigmaNode): ActionComposition | null {
  // Search first-level children for action-like elements
  for (const child of node.children || []) {
    const name = (child.name || '').toLowerCase();
    const text = findTextInNode(child);

    // Common header action patterns
    if (
      name.includes('action') ||
      name.includes('button') ||
      name.includes('link') ||
      (text && /^(view|see|add|edit|more|all)/i.test(text))
    ) {
      return extractActionComposition(child);
    }
  }
  return null;
}

/**
 * Count items in a section (for lists, tables, cards)
 */
function countItems(node: FigmaNode): number {
  // Look for repeated patterns in children
  const children = node.children || [];
  if (children.length < 2) return children.length;

  // Count children with similar structure (same pattern)
  const patterns = children.map(c => getNodeSignature(c));
  const mostCommonPattern = findMostCommon(patterns);
  return patterns.filter(p => p === mostCommonPattern).length;
}

/**
 * Get a signature of node structure for pattern matching
 */
function getNodeSignature(node: FigmaNode): string {
  const childTypes = (node.children || [])
    .slice(0, 5)  // First 5 children
    .map(c => c.type)
    .join(',');
  return `${node.type}:${childTypes}`;
}

function isMeaningfulSection(node: FigmaNode): boolean {
  // Must be a container
  if (!['FRAME', 'GROUP', 'COMPONENT', 'INSTANCE'].includes(node.type)) return false;

  // Must have content
  if (!node.children || node.children.length === 0) return false;

  // Must have meaningful name (not generic)
  const name = node.name.toLowerCase();
  const isGeneric = /^(frame|group|instance|rectangle)\s*\d*$/i.test(name);
  if (isGeneric) return false;

  return true;
}
```

### Step 3: Infer Data Patterns

Analyze text groupings to identify patterns:

```typescript
function inferDataPattern(section: SectionContent): DataPattern {
  const texts = section.texts;

  // LIST PATTERN: Multiple similar text groupings
  // e.g., Invoices with repeated date/id/amount pattern
  if (hasRepeatingStructure(texts)) {
    return {
      type: 'list',
      schema: inferListSchema(texts),
      items: parseListItems(texts)
    };
  }

  // KEY-VALUE PATTERN: Labels paired with values
  // e.g., "Email:" followed by "mark@example.com"
  if (hasKeyValuePairs(texts)) {
    return {
      type: 'key-value',
      pairs: parseKeyValuePairs(texts)
    };
  }

  // TABLE PATTERN: Grid of aligned text
  if (hasTableStructure(texts)) {
    return {
      type: 'table',
      headers: parseTableHeaders(texts),
      rows: parseTableRows(texts)
    };
  }

  // GROUPED LIST: Lists with group headers
  // e.g., "NEWEST" header followed by items, "YESTERDAY" header...
  if (hasGroupedStructure(texts)) {
    return {
      type: 'grouped-list',
      groups: parseGroups(texts)
    };
  }

  // CARD PATTERN: Title + description + metadata
  if (hasCardStructure(texts)) {
    return {
      type: 'card',
      cards: parseCards(texts)
    };
  }

  // FALLBACK: Raw text content
  return {
    type: 'text',
    content: texts.map(t => t.characters)
  };
}

// Pattern detection helpers
function hasRepeatingStructure(texts: TextNode[]): boolean {
  // Group texts by their relative Y position
  // If we have 3+ groups with similar text patterns, it's a list
  const groups = groupByVerticalPosition(texts);
  if (groups.length < 2) return false;

  // Check if groups have similar structure
  const patterns = groups.map(g => g.map(t => categorizeText(t)));
  return patterns.slice(1).every(p =>
    arraysMatch(p, patterns[0])
  );
}

function categorizeText(text: TextNode): string {
  // Categorize by visual properties
  if (text.fontWeight >= 600) return 'label';
  if (/^\$[\d,]+/.test(text.characters)) return 'currency';
  if (/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/.test(text.characters)) return 'date';
  if (/^#[A-Z0-9-]+$/.test(text.characters)) return 'id';
  if (/^\+?\-?\$?[\d,]+(\.\d+)?%?$/.test(text.characters)) return 'number';
  if (text.characters.length < 20) return 'short-text';
  return 'text';
}
```

### Step 4: Integrate Asset References

Link detected icons and images to section content:

```typescript
interface AssetReference {
  type: 'icon' | 'image';
  name: string;
  ref: string;           // "lucide:icon-name" or "assets/images/filename.png"
  placeholder?: PlaceholderStrategy;
}

interface SectionAssets {
  icons: AssetReference[];
  images: AssetReference[];
}

function integrateAssets(
  section: SectionContent,
  iconManifest: IconManifest,
  assetManifest: AssetManifest
): SectionAssets {
  const assets: SectionAssets = { icons: [], images: [] };

  // Find icons in this section
  for (const icon of iconManifest.icons.mapped) {
    const usedInSection = icon.usedIn.some(
      ctx => ctx.sectionName.toLowerCase() === section.name.toLowerCase()
    );
    if (usedInSection) {
      assets.icons.push({
        type: 'icon',
        name: icon.figmaName,
        ref: `lucide:${icon.libraryIcon}`
      });
    }
  }

  // Add unmapped icons with placeholders
  for (const icon of iconManifest.icons.unmapped) {
    const usedInSection = icon.usedIn.some(
      ctx => ctx.sectionName.toLowerCase() === section.name.toLowerCase()
    );
    if (usedInSection) {
      assets.icons.push({
        type: 'icon',
        name: icon.figmaName,
        ref: 'lucide:circle', // Fallback icon
        placeholder: { type: 'circle', name: icon.figmaName }
      });
    }
  }

  // Find images in this section
  for (const image of assetManifest.images) {
    const usedInSection = image.usedIn.some(
      ctx => ctx.sectionName.toLowerCase() === section.name.toLowerCase()
    );
    if (usedInSection) {
      assets.images.push({
        type: 'image',
        name: image.name,
        ref: image.exportPath || `placeholder:${image.type}`,
        placeholder: image.placeholder
      });
    }
  }

  return assets;
}

// Load manifests
function loadManifests(): { icons: IconManifest | null; assets: AssetManifest | null } {
  const iconPath = 'design-system/assets/icon-manifest.json';
  const assetPath = 'design-system/assets/asset-manifest.json';

  return {
    icons: fileExists(iconPath) ? loadJson(iconPath) : null,
    assets: fileExists(assetPath) ? loadJson(assetPath) : null
  };
}
```

### Step 5: Extract Actions (Composition-Aware)

Identify interactive elements, preserving icon + text composition:

```typescript
// Action with full composition details
interface ActionComposition {
  type: 'button' | 'icon-button' | 'link' | 'icon-action';
  label?: string;
  icon?: {
    ref: string;           // "lucide:icon-name"
    position: 'left' | 'right' | 'only';
    size: number;          // Actual pixel size from Figma
  };
  variant: 'primary' | 'secondary' | 'outline' | 'text' | 'danger';
  gap?: number;            // Space between icon and text (from auto-layout)
  style?: {
    fontWeight: number;
    textCase: string;
  };
}

function extractActions(section: SectionContent): ActionComposition[] {
  const actions: ActionComposition[] = [];

  for (const child of section.children) {
    const action = extractActionComposition(child);
    if (action) {
      actions.push(action);
    }
  }

  return actions;
}

// Extract icon + text as unified composition
function extractActionComposition(node: FigmaNode): ActionComposition | null {
  const textChild = findTextChild(node);
  const iconChild = findIconChild(node);

  // Must have at least icon or text to be an action
  if (!textChild && !iconChild) return null;

  // Skip if this doesn't look interactive
  if (!isButtonLike(node) && !isLinkText(textChild) && !isActionIcon(iconChild)) {
    return null;
  }

  const composition: ActionComposition = {
    type: iconChild && !textChild ? 'icon-button' :
          textChild && !iconChild ? 'link' : 'button',
    label: textChild?.characters,
    variant: inferVariantFromVisuals(node, textChild)
  };

  // Capture icon details if present
  if (iconChild) {
    composition.icon = {
      ref: mapToLucide(iconChild.name),
      position: determineIconPosition(iconChild, textChild, node),
      size: iconChild.absoluteBoundingBox?.width || 16
    };

    // Get gap from auto-layout if available
    if (textChild && node.itemSpacing) {
      composition.gap = node.itemSpacing;
    }
  }

  // Capture text styling
  if (textChild) {
    composition.style = {
      fontWeight: textChild.style?.fontWeight || 400,
      textCase: textChild.style?.textCase || 'ORIGINAL'
    };
  }

  return composition;
}

// Infer variant from visual properties (generalizable)
function inferVariantFromVisuals(node: FigmaNode, textChild: TextNode | null): string {
  const fill = getBackgroundColor(node);
  const textColor = textChild?.fills?.[0]?.color;

  // Check for danger colors (red-ish)
  if (textColor && isRedColor(textColor)) return 'danger';
  // No fill = text button
  if (!hasFill(node)) return 'text';
  // Outline only = outline variant
  if (hasOutlineOnly(node)) return 'outline';
  // Gradient fill = primary
  if (isGradientFill(fill)) return 'primary';
  return 'secondary';
}

function isButtonLike(node: FigmaNode): boolean {
  // Has background fill + text + small size
  return (
    node.type === 'FRAME' &&
    hasFill(node) &&
    hasTextChild(node) &&
    node.absoluteBoundingBox.width < 200 &&
    node.absoluteBoundingBox.height < 60
  );
}

function isLinkText(node: FigmaNode): boolean {
  if (!node || node.type !== 'TEXT') return false;
  const text = node.characters;
  // Common link patterns: uppercase, short
  return (
    text === text.toUpperCase() &&
    text.length < 20 &&
    ['VIEW', 'SEE', 'ADD', 'EDIT', 'DELETE', 'MORE', 'ALL'].some(w => text.includes(w))
  );
}

// Determine icon position relative to text
function determineIconPosition(iconNode: FigmaNode, textNode: TextNode | null, parent: FigmaNode): 'left' | 'right' | 'only' {
  if (!textNode) return 'only';

  const iconX = iconNode.absoluteBoundingBox?.x || 0;
  const textX = textNode.bounds?.x || 0;

  return iconX < textX ? 'left' : 'right';
}
```

### Step 5b: Extract Action Clusters (Grouped Interactive Elements)

For sections with clusters of interactive elements (toolbars, headers, action bars), extract them as groups:

```typescript
interface ActionCluster {
  search?: {
    placeholder: string;
    icon: string;
  };
  links: Array<{
    label: string;
    icon?: string;
  }>;
  iconButtons: Array<{
    icon: string;
    label?: string;      // Aria label inferred from icon name
    badge?: Badge;
  }>;
}

interface Badge {
  type: 'dot' | 'count';
  value?: number;
  color: string;
}

function extractActionCluster(node: FigmaNode): ActionCluster | null {
  const cluster: ActionCluster = { links: [], iconButtons: [] };
  let hasContent = false;

  for (const child of node.children || []) {
    // Detect search/input patterns
    if (isInputLike(child)) {
      cluster.search = {
        placeholder: findPlaceholderText(child) || '...',
        icon: findIconInNode(child) || 'lucide:search'
      };
      hasContent = true;
      continue;
    }

    // Detect icon-only buttons (may have badges)
    if (isIconOnly(child)) {
      const iconBtn = {
        icon: mapToLucide(child.name || findIconInNode(child)),
        label: inferAriaLabel(child.name),
        badge: extractBadgeIfPresent(child)
      };
      cluster.iconButtons.push(iconBtn);
      hasContent = true;
      continue;
    }

    // Detect text links with optional icons
    if (isLinkLike(child)) {
      cluster.links.push({
        label: findTextInNode(child),
        icon: findIconInNode(child)
      });
      hasContent = true;
    }
  }

  return hasContent ? cluster : null;
}

// Generic input detection (works for any Figma file)
function isInputLike(node: FigmaNode): boolean {
  const name = (node.name || '').toLowerCase();
  const text = (findTextInNode(node) || '').toLowerCase();
  return (
    name.includes('search') ||
    name.includes('input') ||
    name.includes('field') ||
    text.includes('...') ||
    text.includes('type here') ||
    text.includes('enter')
  );
}

// Icon-only button detection
function isIconOnly(node: FigmaNode): boolean {
  const hasIcon = findIconInNode(node) !== null;
  const hasText = findTextChild(node) !== null;
  return hasIcon && !hasText && node.absoluteBoundingBox?.width < 50;
}

// Link-like element detection
function isLinkLike(node: FigmaNode): boolean {
  const text = findTextChild(node);
  if (!text) return false;
  // Short text, possibly with icon
  return text.characters.length < 30;
}

// Badge detection (small circles/ellipses overlaid on icons)
function extractBadgeIfPresent(node: FigmaNode): Badge | null {
  const badgeNode = (node.children || []).find(c =>
    c.type === 'ELLIPSE' ||
    (c.type === 'FRAME' && c.absoluteBoundingBox?.width < 20)
  );

  if (!badgeNode) return null;

  const textChild = findTextInNode(badgeNode);
  return {
    type: textChild ? 'count' : 'dot',
    value: textChild ? parseInt(textChild) : undefined,
    color: extractFillColor(badgeNode) || 'var(--color-error)'
  };
}

// Infer aria label from icon/node name
function inferAriaLabel(name: string): string {
  return name
    .replace(/[-_]/g, ' ')
    .replace(/icon|btn|button/gi, '')
    .trim()
    .toLowerCase();
}
```

### Step 6: Generate content.json

Create structured output for each screen, including asset references:

```json
{
  "screen": "Billing",
  "dimensions": { "width": 1440, "height": 1204 },
  "extractedAt": "2026-01-15T17:00:00Z",
  "sections": [
    {
      "id": "navbar",
      "name": "Navbar",
      "type": "navigation",
      "componentType": "Navbar",
      "bounds": { "x": 290, "y": 0, "width": 1150, "height": 75 },
      "assets": {
        "icons": [
          { "name": "search", "ref": "lucide:search" },
          { "name": "settings", "ref": "lucide:settings" },
          { "name": "notification", "ref": "lucide:bell" }
        ],
        "images": []
      },
      "tokens": {
        "background": "var(--color-white)",
        "shadow": "var(--shadow-sm)"
      },
      "content": {
        "breadcrumb": ["Pages", "Billing"],
        "search": { "placeholder": "Type here..." },
        "actions": [
          { "type": "icon", "icon": "user", "label": "Sign In" },
          { "type": "icon", "icon": "settings" },
          { "type": "icon", "icon": "bell", "badge": true }
        ]
      }
    },
    {
      "id": "payment-method",
      "name": "Payment Method",
      "type": "card-grid",
      "bounds": { "x": 290, "y": 99, "width": 546, "height": 262 },
      "content": {
        "title": "Payment Method",
        "cards": [
          {
            "type": "mastercard",
            "number": "7852",
            "holder": "Jack Peterson",
            "expires": "11/22"
          },
          {
            "type": "visa",
            "number": "5765",
            "holder": "Jack Peterson",
            "expires": "11/22"
          }
        ]
      },
      "actions": [{ "type": "button", "label": "ADD A NEW CARD" }]
    },
    {
      "id": "invoices",
      "name": "Invoices",
      "type": "list",
      "bounds": { "x": 860, "y": 99, "width": 546, "height": 262 },
      "content": {
        "title": "Invoices",
        "items": [
          { "date": "March, 01, 2021", "id": "#MS-415646", "amount": "$180" },
          { "date": "February, 10, 2021", "id": "#RV-126749", "amount": "$250" },
          { "date": "April, 05, 2021", "id": "#QW-103578", "amount": "$120" },
          { "date": "June, 25, 2021", "id": "#MS-415646", "amount": "$180" },
          { "date": "March, 01, 2021", "id": "#AR-803481", "amount": "$300" }
        ]
      },
      "actions": [{ "type": "link", "label": "VIEW ALL" }],
      "itemActions": [{ "type": "icon", "icon": "download", "action": "downloadPdf" }]
    },
    {
      "id": "billing-info",
      "name": "Billing Information",
      "type": "card-list",
      "bounds": { "x": 290, "y": 385, "width": 546, "height": 445 },
      "content": {
        "title": "Billing Information",
        "items": [
          {
            "name": "Oliver Liam",
            "company": "Viking Burrito",
            "email": "oliver@burrito.com",
            "vat": "FRB1235476"
          },
          {
            "name": "Lucas Harper",
            "company": "Stone Tech Zone",
            "email": "lucas@stone-tech.com",
            "vat": "FRB1235476"
          },
          {
            "name": "Ethan James",
            "company": "Fiber Notion",
            "email": "ethan@fiber.com",
            "vat": "FRB1235476"
          }
        ]
      },
      "itemActions": [
        { "type": "button", "label": "DELETE", "variant": "text-danger" },
        { "type": "button", "label": "EDIT", "variant": "text-muted" }
      ]
    },
    {
      "id": "transactions",
      "name": "Your Transactions",
      "type": "grouped-list",
      "bounds": { "x": 860, "y": 385, "width": 546, "height": 445 },
      "content": {
        "title": "Your Transactions",
        "dateRange": "23 - 30 March 2021",
        "groups": [
          {
            "label": "NEWEST",
            "items": [
              { "name": "Netflix", "date": "27 March 2021, at 12:30 PM", "amount": "- $2,500", "type": "expense", "icon": "minus-circle" },
              { "name": "Apple", "date": "27 March 2021, at 04:30 AM", "amount": "+ $2,000", "type": "income", "icon": "plus-circle" }
            ]
          },
          {
            "label": "YESTERDAY",
            "items": [
              { "name": "Stripe", "date": "26 March 2021, at 13:45 PM", "amount": "+ $750", "type": "income", "icon": "plus-circle" },
              { "name": "HubSpot", "date": "26 March 2021, at 12:30 PM", "amount": "+ $1,000", "type": "income", "icon": "plus-circle" },
              { "name": "Creative Tim", "date": "26 March 2021, at 08:30 AM", "amount": "+ $2,500", "type": "income", "icon": "plus-circle" },
              { "name": "Webflow", "date": "26 March 2021, at 05:00 AM", "amount": "Pending", "type": "pending", "icon": "exclamation-circle" }
            ]
          }
        ]
      }
    }
  ],
  "sidebar": {
    "type": "navigation-sidebar",
    "componentType": "Sidebar",
    "logo": "Soft UI Dashboard",
    "assets": {
      "icons": [
        { "name": "dashboard", "ref": "lucide:layout-dashboard" },
        { "name": "tables", "ref": "lucide:table-2" },
        { "name": "billing", "ref": "lucide:credit-card" },
        { "name": "rtl", "ref": "lucide:languages" },
        { "name": "profile", "ref": "lucide:user" },
        { "name": "sign-in", "ref": "lucide:log-in" },
        { "name": "sign-up", "ref": "lucide:user-plus" },
        { "name": "help", "ref": "lucide:help-circle" }
      ],
      "images": [
        { "name": "logo", "ref": "placeholder:logo", "placeholder": { "type": "solid", "text": "LOGO" } }
      ]
    },
    "menuItems": [
      { "icon": "lucide:layout-dashboard", "label": "Dashboard", "path": "/dashboard" },
      { "icon": "lucide:table-2", "label": "Tables", "path": "/tables" },
      { "icon": "lucide:credit-card", "label": "Billing", "path": "/billing", "active": true },
      { "icon": "lucide:languages", "label": "RTL", "path": "/rtl" },
      { "divider": true, "label": "ACCOUNT PAGES" },
      { "icon": "lucide:user", "label": "Profile", "path": "/profile" },
      { "icon": "lucide:log-in", "label": "Sign In", "path": "/sign-in" },
      { "icon": "lucide:user-plus", "label": "Sign Up", "path": "/sign-up" }
    ],
    "helpCard": {
      "icon": "lucide:help-circle",
      "title": "Need help?",
      "description": "Please check our docs",
      "button": "DOCUMENTATION"
    }
  }
}
```

### Step 7: Generate TypeScript Schema

Create type definitions from extracted patterns:

```typescript
// Auto-generated schema for Billing screen

export interface InvoiceItem {
  date: string;
  id: string;
  amount: string;
}

export interface PaymentCard {
  type: 'mastercard' | 'visa';
  number: string;
  holder: string;
  expires: string;
}

export interface BillingInfoItem {
  name: string;
  company: string;
  email: string;
  vat: string;
}

export interface TransactionItem {
  name: string;
  date: string;
  amount: string;
  type: 'income' | 'expense' | 'pending';
  icon: string;
}

export interface TransactionGroup {
  label: string;
  items: TransactionItem[];
}

export interface BillingPageData {
  paymentMethod: {
    title: string;
    cards: PaymentCard[];
  };
  invoices: {
    title: string;
    items: InvoiceItem[];
  };
  billingInfo: {
    title: string;
    items: BillingInfoItem[];
  };
  transactions: {
    title: string;
    dateRange: string;
    groups: TransactionGroup[];
  };
}
```

### Step 8: Generate Per-Screen HTML Preview

Create standalone preview with actual content:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>{ScreenName} - Preview</title>
  <link rel="stylesheet" href="../../tokens/colors.css">
  <link rel="stylesheet" href="../../tokens/typography.css">
  <link rel="stylesheet" href="../../tokens/spacing.css">
  <link rel="stylesheet" href="../../tokens/effects.css">
  <style>
    /* Layout styles using tokens */
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: var(--font-family-sans);
      background: var(--color-gray-100);
    }
    .page-wrapper {
      display: grid;
      grid-template-columns: 258px 1fr;
      min-height: 100vh;
    }
    /* ... section-specific styles ... */
  </style>
</head>
<body>
  <div class="page-wrapper">
    <!-- Sidebar with actual menu items -->
    <aside class="sidebar">
      {/* Render sidebar from content.json */}
    </aside>

    <!-- Main content with actual data -->
    <main class="content">
      {/* Render each section with actual content from content.json */}
    </main>
  </div>
</body>
</html>
```

## Integration with Other Steps

This step runs AFTER layout detection and asset extraction, BEFORE preview generation.

**Workflow:**
```
06-extract-components.md   → Component specs with types
07-extract-layouts.md      → Screen frames and structure
10-extract-icons.md        → Icon manifest with Lucide mappings
11-extract-assets.md       → Image asset manifest
     ↓
07b-extract-content.md     → THIS STEP: Content + asset refs
     ↓
09-preview.md              → HTML previews with icons/placeholders
```

**Dependencies:**
- Reads `assets/icon-manifest.json` for icon references
- Reads `assets/asset-manifest.json` for image references
- Uses component types from `specs/components.md` for section classification

## Figma API Requirements

To extract text content, request nodes with:
- `depth=100` or sufficient depth to get all TEXT nodes
- Include `absoluteBoundingBox` for positioning
- Include `characters` for text content
- Include `style` for font properties

Example API call:
```
GET /v1/files/{fileKey}/nodes?ids={screenNodeIds}&depth=100
```

## Inventory Comparison (--thorough mode)

When running with `--thorough` flag, compare extraction against visual inventory:

```typescript
interface ExtractionCoverage {
  screenName: string;
  inventoryPath: string;
  expectedSections: number;
  extractedSections: number;
  coverage: number;                // Percentage 0-100
  missingSections: string[];       // Section IDs not found
  extraSections: string[];         // Sections found but not in inventory
  itemCoverage: {
    section: string;
    expectedItems: number;
    extractedItems: number;
    coverage: number;
  }[];
  patternMatches: {
    pattern: string;
    expectedCount: number;
    foundCount: number;
  }[];
}

function compareToInventory(
  extracted: EnhancedSectionContent[],
  inventoryPath: string
): ExtractionCoverage {
  const inventory = loadInventory(inventoryPath);

  const coverage: ExtractionCoverage = {
    screenName: inventory.screenName,
    inventoryPath,
    expectedSections: inventory.totalSections,
    extractedSections: extracted.length,
    coverage: 0,
    missingSections: [],
    extraSections: [],
    itemCoverage: [],
    patternMatches: []
  };

  // Compare section IDs
  const inventoryIds = new Set(inventory.sections.map(s => s.id));
  const extractedIds = new Set(extracted.map(s => s.id));

  for (const section of inventory.sections) {
    if (!extractedIds.has(section.id)) {
      coverage.missingSections.push(section.id);
    }

    // Check item counts
    const extractedSection = extracted.find(e => e.id === section.id);
    if (extractedSection && section.children?.count) {
      coverage.itemCoverage.push({
        section: section.id,
        expectedItems: section.children.count,
        extractedItems: extractedSection.extractedItemCount,
        coverage: (extractedSection.extractedItemCount / section.children.count) * 100
      });
    }
  }

  for (const section of extracted) {
    if (!inventoryIds.has(section.id)) {
      coverage.extraSections.push(section.id);
    }
  }

  // Compare patterns
  for (const [patternId, patternData] of Object.entries(inventory.patterns || {})) {
    const foundCount = extracted.filter(s => s.pattern === patternId).length;
    coverage.patternMatches.push({
      pattern: patternId,
      expectedCount: patternData.count,
      foundCount
    });
  }

  // Calculate overall coverage
  const matched = coverage.expectedSections - coverage.missingSections.length;
  coverage.coverage = (matched / coverage.expectedSections) * 100;

  return coverage;
}

/**
 * Generate coverage report
 */
function generateCoverageReport(coverage: ExtractionCoverage): string {
  const status = coverage.coverage >= 90 ? '✓' : coverage.coverage >= 70 ? '⚠' : '❌';

  let report = `
${status} Extraction Coverage: ${coverage.coverage.toFixed(1)}%

Sections: ${coverage.extractedSections}/${coverage.expectedSections}
`;

  if (coverage.missingSections.length > 0) {
    report += `
Missing sections:
${coverage.missingSections.map(s => `  - ${s}`).join('\n')}
`;
  }

  if (coverage.itemCoverage.length > 0) {
    report += `
Item coverage:
${coverage.itemCoverage.map(ic =>
  `  - ${ic.section}: ${ic.extractedItems}/${ic.expectedItems} (${ic.coverage.toFixed(0)}%)`
).join('\n')}
`;
  }

  if (coverage.patternMatches.length > 0) {
    report += `
Pattern detection:
${coverage.patternMatches.map(pm =>
  `  - ${pm.pattern}: ${pm.foundCount}/${pm.expectedCount}`
).join('\n')}
`;
  }

  return report;
}
```

## Validation

For each screen, verify:
- [ ] All visible text is captured in content.json
- [ ] Data patterns are correctly identified (list, table, etc.)
- [ ] Actions/buttons are captured with correct labels
- [ ] Schema matches actual content structure
- [ ] HTML preview renders all extracted content
- [ ] (--thorough) Coverage >= 90% against visual inventory
- [ ] (--thorough) All patterns from inventory are detected

## Error Handling

```
⚠ Warning: Could not determine pattern for section "{sectionName}".
  Falling back to raw text extraction.
  Review content.json for manual structure adjustment.

⚠ Warning: No text nodes found in section "{sectionName}".
  This section may be purely visual (images/icons).
```

## Report

```
✓ Content extracted for {screenCount} screens

Screen: Billing
├── 5 sections extracted
├── 23 text nodes captured
├── 12 data items parsed
├── 8 actions identified
├── Patterns: list (2), grouped-list (1), card-list (1), navigation (1)
└── Files:
    ├── preview/screens/Billing/content.json (4.2 KB)
    ├── preview/screens/Billing/schema.ts (1.8 KB)
    └── preview/screens/Billing/index.html (12.4 KB)

[Repeat for each screen...]
```

## Next Step

Proceed to: `validate.md` (validate extraction before generating previews)
