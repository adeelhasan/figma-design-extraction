# 06 - Extract Component Specifications

## Purpose
Document component structures, variants, token usage, and **component types** from Figma component sets. Component type detection enables better React code generation and HTML preview rendering.

## Sources in Figma

1. **Component Sets** (variants)
   - Nodes with `type === 'COMPONENT_SET'`
   
2. **Components** (standalone)
   - Nodes with `type === 'COMPONENT'`

## Process

### Step 1: Find Components

```typescript
function findComponents(node: FigmaNode): ComponentInfo[] {
  const components: ComponentInfo[] = [];
  
  if (node.type === 'COMPONENT_SET') {
    components.push({
      type: 'set',
      name: node.name,
      id: node.id,
      variants: node.children.map(parseVariant),
      description: node.description
    });
  } else if (node.type === 'COMPONENT' && !isPartOfSet(node)) {
    components.push({
      type: 'standalone',
      name: node.name,
      id: node.id,
      description: node.description
    });
  }
  
  // Recurse
  if (node.children) {
    for (const child of node.children) {
      components.push(...findComponents(child));
    }
  }
  
  return components;
}
```

### Step 2: Parse Variants

Figma encodes variants in component names:
```
"Property1=Value1, Property2=Value2"

Example:
"Size=Large, State=Default, Type=Primary"
```

Parse into structured format:
```typescript
function parseVariant(node: FigmaNode): Variant {
  const props: Record<string, string> = {};

  // Parse "Prop=Value, Prop=Value" format
  const parts = node.name.split(',').map(s => s.trim());
  for (const part of parts) {
    const [key, value] = part.split('=').map(s => s.trim());
    if (key && value) {
      props[key] = value;
    }
  }

  return {
    name: node.name,
    properties: props,
    dimensions: {
      width: node.absoluteBoundingBox.width,
      height: node.absoluteBoundingBox.height
    }
  };
}
```

### Step 2.5: COMPLETE Variant Enumeration (CRITICAL)

**IMPORTANT:** Extract EVERY variant combination, not just a sample.

```typescript
function enumerateAllVariants(componentSet: ComponentSetNode): VariantMatrix {
  const allVariants = componentSet.children; // Each child is a variant
  const propertyValues: Record<string, Set<string>> = {};
  const variantDetails: VariantDetail[] = [];

  // Step 1: Parse ALL children to get complete property matrix
  for (const variant of allVariants) {
    const parsed = parseVariant(variant);

    // Collect all unique values for each property
    for (const [prop, value] of Object.entries(parsed.properties)) {
      if (!propertyValues[prop]) {
        propertyValues[prop] = new Set();
      }
      propertyValues[prop].add(value);
    }

    // Store full variant details including dimensions
    variantDetails.push({
      name: variant.name,
      properties: parsed.properties,
      width: variant.absoluteBoundingBox.width,
      height: variant.absoluteBoundingBox.height,
      // Extract padding from auto-layout
      paddingTop: variant.paddingTop || 0,
      paddingRight: variant.paddingRight || 0,
      paddingBottom: variant.paddingBottom || 0,
      paddingLeft: variant.paddingLeft || 0,
    });
  }

  // Step 2: Build complete matrix
  const matrix = {
    properties: Object.fromEntries(
      Object.entries(propertyValues).map(([k, v]) => [k, Array.from(v).sort()])
    ),
    totalVariants: allVariants.length,
    details: variantDetails
  };

  return matrix;
}
```

**Output format for complete enumeration:**

For Button component set, document:

```markdown
### Complete Variant Matrix

**Properties found:** Size, Variant, State

| Property | Values |
|----------|--------|
| Size | small, medium, large |
| Variant | default, outline, ghost, icon-only, with-icon |
| State | default, hover, active, disabled |

**Total variants in Figma:** 60 (Size × Variant × State = 3 × 5 × 4)

### Dimensions by Size

| Size | Height | Horizontal Padding | Vertical Padding |
|------|--------|-------------------|------------------|
| small | 32px | 16px | 8px |
| medium | 40px | 20px | 10px |
| large | 48px | 24px | 12px |

### All Variant Instances

| Variant Name | Width | Height |
|--------------|-------|--------|
| Size=small, Variant=default, State=default | 104px | 32px |
| Size=small, Variant=default, State=hover | 108px | 36px |
| Size=small, Variant=outline, State=default | 104px | 32px |
... (list ALL 60 variants)
```

This ensures:
- Every button size is documented
- Every button type/variant is captured
- Every state (hover, active, etc.) is included
- Exact dimensions for each combination are recorded

### Step 3: Detect Component Type

Classify each component into a semantic type for better code generation:

```typescript
// Component Type Taxonomy
type ComponentCategory = 'layout' | 'form' | 'card' | 'data' | 'navigation' | 'feedback' | 'overlay' | 'media' | 'unknown';

interface ComponentType {
  category: ComponentCategory;
  type: string;           // e.g., "Button", "StatCard", "Sidebar"
  confidence: 'high' | 'medium' | 'low';
  inferredFrom: string[]; // Reasons for classification
}

// Type detection rules (ordered by priority)
const typeRules: Array<{
  pattern: RegExp;
  category: ComponentCategory;
  type: string;
}> = [
  // Layout components
  { pattern: /\bsidebar\b/i, category: 'layout', type: 'Sidebar' },
  { pattern: /\bnavbar\b|\bnav[-_]?bar\b/i, category: 'layout', type: 'Navbar' },
  { pattern: /\bheader\b/i, category: 'layout', type: 'Header' },
  { pattern: /\bfooter\b/i, category: 'layout', type: 'Footer' },
  { pattern: /\bcontainer\b/i, category: 'layout', type: 'Container' },
  { pattern: /\bgrid\b/i, category: 'layout', type: 'Grid' },

  // Form components
  { pattern: /\bbutton\b|\bbtn\b/i, category: 'form', type: 'Button' },
  { pattern: /\binput\b|\btext[-_]?field\b/i, category: 'form', type: 'Input' },
  { pattern: /\bselect\b|\bdropdown\b/i, category: 'form', type: 'Select' },
  { pattern: /\bcheckbox\b/i, category: 'form', type: 'Checkbox' },
  { pattern: /\bradio\b/i, category: 'form', type: 'Radio' },
  { pattern: /\bswitch\b|\btoggle\b/i, category: 'form', type: 'Switch' },
  { pattern: /\bslider\b|\brange\b/i, category: 'form', type: 'Slider' },
  { pattern: /\btextarea\b/i, category: 'form', type: 'Textarea' },
  { pattern: /\bsearch\b/i, category: 'form', type: 'SearchInput' },

  // Card components
  { pattern: /\bstat[-_]?card\b/i, category: 'card', type: 'StatCard' },
  { pattern: /\binfo[-_]?card\b/i, category: 'card', type: 'InfoCard' },
  { pattern: /\bpromo[-_]?card\b/i, category: 'card', type: 'PromoCard' },
  { pattern: /\bcredit[-_]?card\b/i, category: 'card', type: 'CreditCard' },
  { pattern: /\bprofile[-_]?card\b/i, category: 'card', type: 'ProfileCard' },
  { pattern: /\bproject[-_]?card\b/i, category: 'card', type: 'ProjectCard' },
  { pattern: /\bcard\b/i, category: 'card', type: 'Card' },

  // Data display components
  { pattern: /\btable\b/i, category: 'data', type: 'Table' },
  { pattern: /\blist\b/i, category: 'data', type: 'List' },
  { pattern: /\bavatar\b/i, category: 'data', type: 'Avatar' },
  { pattern: /\bbadge\b|\btag\b|\bchip\b/i, category: 'data', type: 'Badge' },
  { pattern: /\bprogress\b/i, category: 'data', type: 'ProgressBar' },
  { pattern: /\btimeline\b/i, category: 'data', type: 'Timeline' },
  { pattern: /\bchart\b|\bgraph\b/i, category: 'data', type: 'Chart' },

  // Navigation components
  { pattern: /\btab\b|\btabs\b/i, category: 'navigation', type: 'Tabs' },
  { pattern: /\bbreadcrumb\b/i, category: 'navigation', type: 'Breadcrumb' },
  { pattern: /\bmenu\b/i, category: 'navigation', type: 'Menu' },
  { pattern: /\bpagination\b/i, category: 'navigation', type: 'Pagination' },
  { pattern: /\bstepper\b/i, category: 'navigation', type: 'Stepper' },

  // Feedback components
  { pattern: /\balert\b/i, category: 'feedback', type: 'Alert' },
  { pattern: /\btoast\b|\bnotification\b/i, category: 'feedback', type: 'Toast' },
  { pattern: /\bspinner\b|\bloading\b|\bloader\b/i, category: 'feedback', type: 'Spinner' },
  { pattern: /\bskeleton\b/i, category: 'feedback', type: 'Skeleton' },

  // Overlay components
  { pattern: /\bmodal\b|\bdialog\b/i, category: 'overlay', type: 'Modal' },
  { pattern: /\bpopover\b/i, category: 'overlay', type: 'Popover' },
  { pattern: /\btooltip\b/i, category: 'overlay', type: 'Tooltip' },
  { pattern: /\bdrawer\b/i, category: 'overlay', type: 'Drawer' },

  // Media components
  { pattern: /\bimage\b|\bpicture\b/i, category: 'media', type: 'Image' },
  { pattern: /\bicon\b/i, category: 'media', type: 'Icon' },
  { pattern: /\bvideo\b/i, category: 'media', type: 'Video' },
];

function detectComponentType(node: FigmaNode): ComponentType {
  const name = node.name;
  const inferredFrom: string[] = [];

  // Try name-based matching first
  for (const rule of typeRules) {
    if (rule.pattern.test(name)) {
      inferredFrom.push(`name matches "${rule.pattern}"`);
      return {
        category: rule.category,
        type: rule.type,
        confidence: 'high',
        inferredFrom
      };
    }
  }

  // Try structure-based inference
  const structureType = inferFromStructure(node);
  if (structureType) {
    return structureType;
  }

  // Try dimension-based inference
  const dimensionType = inferFromDimensions(node);
  if (dimensionType) {
    return dimensionType;
  }

  // Unknown type
  return {
    category: 'unknown',
    type: 'Component',
    confidence: 'low',
    inferredFrom: ['no matching pattern found']
  };
}

function inferFromStructure(node: FigmaNode): ComponentType | null {
  const children = node.children || [];
  const inferredFrom: string[] = [];

  // Button detection: small frame with text and optional icon
  if (
    node.type === 'FRAME' &&
    children.some(c => c.type === 'TEXT') &&
    node.absoluteBoundingBox?.height <= 60 &&
    node.absoluteBoundingBox?.width <= 250
  ) {
    inferredFrom.push('small frame with text child');
    return { category: 'form', type: 'Button', confidence: 'medium', inferredFrom };
  }

  // Input detection: frame with text child and border
  if (
    node.type === 'FRAME' &&
    children.some(c => c.type === 'TEXT') &&
    (node.strokes?.length > 0 || node.effects?.some(e => e.type === 'INNER_SHADOW'))
  ) {
    inferredFrom.push('frame with text and border/inner shadow');
    return { category: 'form', type: 'Input', confidence: 'medium', inferredFrom };
  }

  // Avatar detection: small square with image or gradient fill
  const { width, height } = node.absoluteBoundingBox || {};
  if (
    Math.abs(width - height) < 5 &&
    width >= 24 && width <= 100 &&
    node.cornerRadius >= width / 4
  ) {
    inferredFrom.push('small square with rounded corners');
    return { category: 'data', type: 'Avatar', confidence: 'medium', inferredFrom };
  }

  // Card detection: larger frame with shadow and multiple children
  if (
    node.type === 'FRAME' &&
    children.length >= 2 &&
    node.effects?.some(e => e.type === 'DROP_SHADOW') &&
    width > 150 && height > 100
  ) {
    inferredFrom.push('frame with shadow and multiple children');
    return { category: 'card', type: 'Card', confidence: 'medium', inferredFrom };
  }

  return null;
}

function inferFromDimensions(node: FigmaNode): ComponentType | null {
  const { width, height } = node.absoluteBoundingBox || {};
  const inferredFrom: string[] = [];

  // Icon detection: very small square
  if (width <= 32 && height <= 32 && Math.abs(width - height) < 4) {
    inferredFrom.push(`small square dimensions (${width}x${height})`);
    return { category: 'media', type: 'Icon', confidence: 'low', inferredFrom };
  }

  // Badge detection: small pill-shaped
  if (height <= 28 && width < 100 && width > height * 1.5) {
    inferredFrom.push(`pill-shaped dimensions (${width}x${height})`);
    return { category: 'data', type: 'Badge', confidence: 'low', inferredFrom };
  }

  return null;
}
```

**Output format for component types:**

```markdown
### Component Type

| Property | Value |
|----------|-------|
| Category | form |
| Type | Button |
| Confidence | high |
| Inferred From | name matches "/button/i" |
```

### Step 4: Analyze Component Structure

For each component/variant, extract:
```typescript
interface ComponentSpec {
  name: string;
  description: string;
  
  // Variant properties
  variants: {
    property: string;
    values: string[];
    default: string;
  }[];
  
  // Dimensions
  dimensions: {
    width: number | 'hug' | 'fill';
    height: number | 'hug' | 'fill';
    minWidth?: number;
    maxWidth?: number;
  };
  
  // Layout
  layout: {
    mode: 'horizontal' | 'vertical' | 'none';
    gap: number;
    padding: { top, right, bottom, left };
    align: string;
    justify: string;
  };
  
  // Token usage
  tokens: {
    colors: string[];      // Which color tokens used
    typography: string[];  // Which text styles used
    spacing: string[];     // Which spacing values used
    effects: string[];     // Which shadows/radii used
  };
  
  // Children structure
  slots: {
    name: string;
    type: 'icon' | 'text' | 'image' | 'slot';
    required: boolean;
  }[];
}
```

### Step 4: Map Token Usage

Traverse component tree to find token references:
```typescript
function findTokenUsage(node: FigmaNode, tokens: TokenUsage): void {
  // Color tokens
  if (node.fills) {
    for (const fill of node.fills) {
      if (fill.boundVariables?.color) {
        tokens.colors.add(fill.boundVariables.color.id);
      }
    }
  }
  
  // Text styles
  if (node.type === 'TEXT' && node.styles?.text) {
    tokens.typography.add(node.styles.text);
  }
  
  // Effect styles
  if (node.styles?.effect) {
    tokens.effects.add(node.styles.effect);
  }
  
  // Spacing (from auto-layout)
  if (node.itemSpacing) tokens.spacing.add(node.itemSpacing);
  if (node.paddingTop) tokens.spacing.add(node.paddingTop);
  // ... etc
  
  // Recurse
  if (node.children) {
    node.children.forEach(child => findTokenUsage(child, tokens));
  }
}
```

### Step 5: Identify Slots

Detect replaceable content areas:
```typescript
function identifySlots(node: FigmaNode): Slot[] {
  const slots: Slot[] = [];
  
  // Icons (frames with specific size, often square)
  if (isIconSlot(node)) {
    slots.push({ name: inferSlotName(node), type: 'icon' });
  }
  
  // Text content
  if (node.type === 'TEXT') {
    slots.push({ 
      name: inferSlotName(node), 
      type: 'text',
      placeholder: node.characters
    });
  }
  
  // Image placeholders
  if (hasImageFill(node)) {
    slots.push({ name: inferSlotName(node), type: 'image' });
  }
  
  return slots;
}
```

### Step 6: Generate Documentation

Output to `components.md`:

```markdown
# Component Specifications

> Extracted from: {fileName}
> Generated: {date}
> Components: {count}

---

## Button

Primary interactive element for actions.

### Component Type

| Property | Value |
|----------|-------|
| Category | form |
| Type | Button |
| Confidence | high |
| Inferred From | name matches pattern |

### Variants

| Property | Values | Default |
|----------|--------|---------|
| Size | `sm`, `md`, `lg` | `md` |
| Variant | `primary`, `secondary`, `ghost` | `primary` |
| State | `default`, `hover`, `pressed`, `disabled` | `default` |

### Dimensions

| Size | Width | Height | Padding |
|------|-------|--------|---------|
| sm | hug | 32px | 8px 12px |
| md | hug | 40px | 12px 16px |
| lg | hug | 48px | 16px 24px |

### Token Usage

**Colors:**
- Background: `--color-primary` (primary), `--color-surface` (secondary)
- Text: `--color-text-inverse` (primary), `--color-text-primary` (secondary)
- Border: `--color-border` (secondary, ghost)

**Typography:**
- Label: `--font-size-sm` / `--font-weight-medium`

**Effects:**
- Border radius: `--radius-md`
- Focus ring: `--shadow-ring`

### Slots

| Slot | Type | Required |
|------|------|----------|
| `icon-left` | icon | No |
| `label` | text | Yes |
| `icon-right` | icon | No |

### States

- **Default**: Base appearance
- **Hover**: Slight background darken
- **Pressed**: Further darken, slight scale
- **Disabled**: 50% opacity, no interaction

### Usage Notes

```tsx
<Button variant="primary" size="md">
  Click me
</Button>

<Button variant="secondary" size="lg" iconLeft={<Icon />}>
  With Icon
</Button>
```

---

## Card

{... next component ...}
```

### Step 7: Update Metadata

```json
{
  "components": {
    "Button": {
      "nodeId": "1:234",
      "hash": "{contentHash}",
      "variants": ["primary", "secondary", "ghost"],
      "sizes": ["sm", "md", "lg"],
      "lastModified": "{timestamp}"
    },
    "Card": {
      "nodeId": "1:567",
      "hash": "{contentHash}",
      "variants": ["default", "interactive"],
      "lastModified": "{timestamp}"
    }
  }
}
```

### Step 8: Report

```
✓ Components extracted

Found {count} components:

┌─────────────────┬──────────┬─────────────────────────┐
│ Component       │ Variants │ Properties              │
├─────────────────┼──────────┼─────────────────────────┤
│ Button          │ 12       │ Size, Variant, State    │
│ Card            │ 4        │ Type, Interactive       │
│ Input           │ 8        │ Size, State, Type       │
│ Badge           │ 6        │ Color, Size             │
│ Avatar          │ 4        │ Size                    │
└─────────────────┴──────────┴─────────────────────────┘

Token coverage:
├── Using color tokens: 18/24 (75%)
├── Using text styles: 6/8 (75%)
└── Using effect styles: 4/5 (80%)

Output: components.md
```

## Edge Cases

### Deeply Nested Components
For components within components:
```
⚠ Note: "{componentName}" contains nested components.
Sub-components documented separately:
- {nestedComponent1}
- {nestedComponent2}
```

### Unnamed/Poorly Named Variants
```
⚠ Warning: Component "{name}" has unnamed variants.
Variants named by index: variant-1, variant-2, ...
Consider naming variants in Figma.
```

### No Component Sets
If file uses only standalone components:
```
ℹ Info: No component sets found.
Standalone components documented without variants.
Consider using component sets in Figma for variant support.
```

## Validation

Check and report:
- [ ] All components have descriptions
- [ ] Variants are properly named
- [ ] Token usage is documented
- [ ] Interactive states exist (hover, pressed, disabled)
- [ ] Dimensions are reasonable

## Fallbacks

Handle common variations gracefully:

- **No component sets?** Document standalone components (type = COMPONENT)
- **Non-standard variant naming?** Try hierarchy parsing (Button/Large/Primary) as alternative to Property=Value
- **Missing interactive states?** Document what exists, note missing states (hover, disabled, etc.)
- **Unnamed variants?** Generate names from index or inferred properties
- **Deeply nested components?** Document separately, note relationships
- **No descriptions?** Leave empty, note as improvement opportunity

The goal is to document all components found, regardless of how they're organized.

## Next Step
Proceed to: `extract-layouts.md`
