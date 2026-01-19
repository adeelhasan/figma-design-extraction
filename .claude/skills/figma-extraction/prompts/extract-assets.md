# 11 - Extract Image Assets

## Purpose

Detect image nodes in the Figma file, generate an asset manifest, and optionally export images. This enables HTML previews to show proper placeholders and React components to reference actual assets.

## Sources in Figma

1. **Image Fills** - Nodes with `fills` containing `type: "IMAGE"`
2. **Large Non-Vector Nodes** - Frames/rectangles > 100x100 without vector children
3. **Named Images** - Nodes named "image", "photo", "avatar", "illustration", etc.
4. **Background Images** - Full-width nodes at top of frames (banners, headers)

## Output Structure

```
design-system/
├── assets/
│   ├── asset-manifest.json   # All detected assets
│   ├── icon-manifest.json    # From step 10
│   └── images/               # Exported images (optional)
│       ├── decorative-wave.png
│       ├── user-avatar-1.png
│       └── ...
```

## Process

### Step 1: Detect Image Nodes

Scan the document for image-like nodes:

```typescript
interface ImageNodeInfo {
  id: string;
  name: string;
  type: 'image' | 'avatar' | 'illustration' | 'banner' | 'background' | 'photo' | 'logo';
  dimensions: { width: number; height: number };
  aspectRatio: number;
  hasImageFill: boolean;
  parentPath: string[];
  position: { x: number; y: number };
}

function isImageNode(node: FigmaNode): boolean {
  // Check 1: Has image fill
  if (node.fills?.some(f => f.type === 'IMAGE')) {
    return true;
  }

  // Check 2: Name suggests image
  const imageNamePatterns = [
    /\bimage\b/i,
    /\bphoto\b/i,
    /\bavatar\b/i,
    /\billustration\b/i,
    /\bbanner\b/i,
    /\bbackground\b/i,
    /\bthumbnail\b/i,
    /\bpicture\b/i,
    /\bcover\b/i,
    /\bhero\b/i
  ];
  if (imageNamePatterns.some(p => p.test(node.name))) {
    return true;
  }

  // Check 3: Large rectangle without text (likely image placeholder)
  const { width, height } = node.absoluteBoundingBox || {};
  const isLarge = width > 100 && height > 100;
  const isRectangle = node.type === 'RECTANGLE' || node.type === 'FRAME';
  const hasNoText = !containsTextNodes(node);
  const hasNoVectors = !containsVectorNodes(node);

  if (isLarge && isRectangle && hasNoText && hasNoVectors) {
    // Check if it has a solid/gradient fill (placeholder) rather than content
    const hasFill = node.fills?.some(f =>
      f.type === 'SOLID' || f.type === 'GRADIENT_LINEAR' || f.type === 'GRADIENT_RADIAL'
    );
    if (hasFill) {
      return true;
    }
  }

  return false;
}

function findAllImages(node: FigmaNode, images: ImageNodeInfo[] = []): ImageNodeInfo[] {
  if (isImageNode(node)) {
    const { width, height, x, y } = node.absoluteBoundingBox || {};

    images.push({
      id: node.id,
      name: node.name,
      type: inferImageType(node),
      dimensions: { width, height },
      aspectRatio: width / height,
      hasImageFill: node.fills?.some(f => f.type === 'IMAGE') || false,
      parentPath: getParentPath(node),
      position: { x, y }
    });
  }

  if (node.children) {
    for (const child of node.children) {
      findAllImages(child, images);
    }
  }

  return images;
}
```

### Step 2: Classify Image Types

Determine the semantic type of each image:

```typescript
function inferImageType(node: FigmaNode): ImageNodeInfo['type'] {
  const name = node.name.toLowerCase();
  const { width, height } = node.absoluteBoundingBox || {};
  const aspectRatio = width / height;

  // Avatar detection (square, small-medium)
  if (
    /avatar/i.test(name) ||
    (Math.abs(aspectRatio - 1) < 0.1 && width >= 32 && width <= 150)
  ) {
    return 'avatar';
  }

  // Banner/Hero detection (wide, at top)
  if (
    /banner|hero|header/i.test(name) ||
    (aspectRatio > 2 && width > 500)
  ) {
    return 'banner';
  }

  // Logo detection
  if (/logo/i.test(name)) {
    return 'logo';
  }

  // Illustration detection
  if (/illustration|graphic|artwork/i.test(name)) {
    return 'illustration';
  }

  // Photo detection (medium-large, rectangular)
  if (
    /photo|picture|thumbnail/i.test(name) ||
    (width > 200 && height > 150 && aspectRatio > 0.5 && aspectRatio < 2)
  ) {
    return 'photo';
  }

  // Background detection (very large, full-width-ish)
  if (width > 800 || height > 600) {
    return 'background';
  }

  // Default to image
  return 'image';
}
```

### Step 3: Determine Placeholder Strategy

For each image, decide how to handle it in previews:

```typescript
interface PlaceholderStrategy {
  type: 'gradient' | 'solid' | 'pattern' | 'svg' | 'initials';
  config: Record<string, any>;
}

function determinePlaceholder(image: ImageNodeInfo): PlaceholderStrategy {
  switch (image.type) {
    case 'avatar':
      return {
        type: 'initials',
        config: {
          gradient: 'var(--gradient-secondary)',
          shape: 'rounded',
          fallbackText: image.name.charAt(0).toUpperCase()
        }
      };

    case 'banner':
    case 'background':
      return {
        type: 'gradient',
        config: {
          gradient: 'var(--gradient-primary)',
          direction: '135deg'
        }
      };

    case 'illustration':
      return {
        type: 'svg',
        config: {
          placeholder: 'illustration-placeholder',
          backgroundColor: 'var(--color-gray-2)'
        }
      };

    case 'logo':
      return {
        type: 'solid',
        config: {
          backgroundColor: 'var(--color-gray-3)',
          text: 'LOGO'
        }
      };

    case 'photo':
    default:
      return {
        type: 'gradient',
        config: {
          gradient: 'var(--gradient-secondary)',
          icon: 'image'  // Lucide icon
        }
      };
  }
}
```

### Step 4: Collect Usage Context

Track where each image is used:

```typescript
interface ImageUsageContext {
  screenName: string;
  sectionName: string;
  role: 'decorative' | 'content' | 'avatar' | 'background' | 'branding';
  cssClasses: string[];  // Suggested CSS classes
}

function collectImageUsage(
  images: ImageNodeInfo[],
  screens: ScreenInfo[]
): Map<string, ImageUsageContext[]> {
  const usage = new Map<string, ImageUsageContext[]>();

  for (const image of images) {
    const contexts: ImageUsageContext[] = [];

    for (const screen of screens) {
      if (isDescendantOf(image.id, screen.nodeId)) {
        const section = findContainingSection(image.id, screen.sections);

        contexts.push({
          screenName: screen.name,
          sectionName: section?.name || 'unknown',
          role: inferImageRole(image, section),
          cssClasses: generateCssClasses(image)
        });
      }
    }

    usage.set(image.id, contexts);
  }

  return usage;
}

function inferImageRole(image: ImageNodeInfo, section: SectionInfo | null): string {
  // Background images
  if (image.type === 'banner' || image.type === 'background') {
    return 'background';
  }

  // Avatar in user-related sections
  if (image.type === 'avatar') {
    return 'avatar';
  }

  // Logo/branding
  if (image.type === 'logo') {
    return 'branding';
  }

  // Decorative (illustrations, abstract graphics)
  if (image.type === 'illustration') {
    return 'decorative';
  }

  // Default to content
  return 'content';
}

function generateCssClasses(image: ImageNodeInfo): string[] {
  const classes = [`asset-${image.type}`];

  // Add aspect ratio class
  if (image.aspectRatio > 1.5) {
    classes.push('aspect-wide');
  } else if (image.aspectRatio < 0.75) {
    classes.push('aspect-tall');
  } else {
    classes.push('aspect-square');
  }

  // Add size class
  const maxDim = Math.max(image.dimensions.width, image.dimensions.height);
  if (maxDim < 100) classes.push('size-sm');
  else if (maxDim < 300) classes.push('size-md');
  else classes.push('size-lg');

  return classes;
}
```

### Step 5: Generate Asset Manifest

```typescript
interface AssetManifest {
  version: string;
  extractedAt: string;
  summary: {
    totalImages: number;
    byType: Record<string, number>;
    exported: number;
    placeholders: number;
  };
  images: Array<{
    id: string;
    name: string;
    type: string;
    dimensions: { width: number; height: number };
    aspectRatio: number;
    hasOriginal: boolean;
    exportPath: string | null;
    placeholder: PlaceholderStrategy;
    usedIn: ImageUsageContext[];
  }>;
  placeholderStyles: {
    css: string;  // CSS for placeholder classes
  };
}

function generateAssetManifest(
  images: ImageNodeInfo[],
  usage: Map<string, ImageUsageContext[]>,
  exportedPaths: Map<string, string>
): AssetManifest {
  const byType: Record<string, number> = {};

  for (const image of images) {
    byType[image.type] = (byType[image.type] || 0) + 1;
  }

  return {
    version: '1.0',
    extractedAt: new Date().toISOString(),
    summary: {
      totalImages: images.length,
      byType,
      exported: exportedPaths.size,
      placeholders: images.length - exportedPaths.size
    },
    images: images.map(image => ({
      id: image.id,
      name: image.name,
      type: image.type,
      dimensions: image.dimensions,
      aspectRatio: Math.round(image.aspectRatio * 100) / 100,
      hasOriginal: image.hasImageFill,
      exportPath: exportedPaths.get(image.id) || null,
      placeholder: determinePlaceholder(image),
      usedIn: usage.get(image.id) || []
    })),
    placeholderStyles: {
      css: generatePlaceholderCSS(images)
    }
  };
}
```

### Step 6: Generate Placeholder CSS

Create CSS for rendering placeholders in previews:

```typescript
function generatePlaceholderCSS(images: ImageNodeInfo[]): string {
  return `
/* Asset Placeholder Styles */
/* Generated from Figma extraction */

.asset-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

/* Type-based placeholders */
.asset-avatar {
  background: var(--gradient-secondary);
  border-radius: var(--radius-lg);
  color: var(--color-white);
  font-weight: var(--font-weight-semibold);
  font-size: 1.25em;
}

.asset-banner,
.asset-background {
  background: var(--gradient-primary);
}

.asset-illustration {
  background: var(--color-gray-2);
  border: 1px dashed var(--color-gray-5);
}

.asset-photo,
.asset-image {
  background: var(--gradient-secondary);
}

.asset-logo {
  background: var(--color-gray-3);
  color: var(--color-gray-7);
  font-weight: var(--font-weight-bold);
  font-size: 0.75em;
  text-transform: uppercase;
}

/* Aspect ratio classes */
.aspect-wide { aspect-ratio: 16/9; }
.aspect-square { aspect-ratio: 1; }
.aspect-tall { aspect-ratio: 3/4; }

/* Size classes */
.size-sm { max-width: 100px; max-height: 100px; }
.size-md { max-width: 300px; max-height: 300px; }
.size-lg { max-width: 100%; }

/* Placeholder icon */
.asset-placeholder-icon {
  opacity: 0.5;
  width: 32px;
  height: 32px;
}
`;
}
```

### Step 7: Optional - Export Images from Figma

If enabled, export actual images via Figma API:

```typescript
// NOTE: This requires Figma API access and may not work with MCP
// Implement if image export capability is added to MCP

async function exportImages(
  images: ImageNodeInfo[],
  fileKey: string,
  options: { format: 'png' | 'jpg' | 'svg'; scale: number }
): Promise<Map<string, string>> {
  const exportedPaths = new Map<string, string>();

  // Filter to only images that have actual image fills
  const exportable = images.filter(img => img.hasImageFill);

  if (exportable.length === 0) {
    console.log('ℹ No exportable images found (no image fills)');
    return exportedPaths;
  }

  // Figma API export endpoint
  // GET /v1/images/{fileKey}?ids={nodeIds}&format={format}&scale={scale}

  // For each exportable image:
  // 1. Call Figma API to get image URL
  // 2. Download image
  // 3. Save to design-system/assets/images/
  // 4. Record path in exportedPaths

  console.log(`⚠ Image export requires direct Figma API access.
To export images manually:
1. Select images in Figma
2. Export as PNG @2x
3. Save to design-system/assets/images/
4. Update asset-manifest.json with paths`);

  return exportedPaths;
}
```

### Step 8: Output Files

Write manifest to `design-system/assets/asset-manifest.json`:

```json
{
  "version": "1.0",
  "extractedAt": "2026-01-16T10:30:00Z",
  "summary": {
    "totalImages": 18,
    "byType": {
      "avatar": 8,
      "banner": 2,
      "illustration": 3,
      "photo": 4,
      "logo": 1
    },
    "exported": 0,
    "placeholders": 18
  },
  "images": [
    {
      "id": "0:567",
      "name": "decorative-wave",
      "type": "banner",
      "dimensions": { "width": 720, "height": 400 },
      "aspectRatio": 1.8,
      "hasOriginal": true,
      "exportPath": null,
      "placeholder": {
        "type": "gradient",
        "config": {
          "gradient": "var(--gradient-primary)",
          "direction": "135deg"
        }
      },
      "usedIn": [
        {
          "screenName": "SignIn",
          "sectionName": "decorative",
          "role": "decorative",
          "cssClasses": ["asset-banner", "aspect-wide", "size-lg"]
        }
      ]
    },
    {
      "id": "1:234",
      "name": "user-avatar",
      "type": "avatar",
      "dimensions": { "width": 74, "height": 74 },
      "aspectRatio": 1,
      "hasOriginal": true,
      "exportPath": null,
      "placeholder": {
        "type": "initials",
        "config": {
          "gradient": "var(--gradient-secondary)",
          "shape": "rounded",
          "fallbackText": "U"
        }
      },
      "usedIn": [
        {
          "screenName": "Profile",
          "sectionName": "header",
          "role": "avatar",
          "cssClasses": ["asset-avatar", "aspect-square", "size-sm"]
        }
      ]
    }
  ],
  "placeholderStyles": {
    "css": "/* ... generated CSS ... */"
  }
}
```

### Step 9: Update Extraction Metadata

Add asset info to `extraction-meta.json`:

```json
{
  "assets": {
    "extractedAt": "2026-01-16T10:30:00Z",
    "hash": "{contentHash}",
    "totalImages": 18,
    "exported": 0,
    "byType": {
      "avatar": 8,
      "banner": 2,
      "illustration": 3,
      "photo": 4,
      "logo": 1
    }
  }
}
```

### Step 10: Report

```
✓ Image assets detected

Asset Summary:
├── Total images: 18
├── By type:
│   ├── Avatars: 8
│   ├── Photos: 4
│   ├── Illustrations: 3
│   ├── Banners: 2
│   └── Logos: 1
├── With original image fills: 12
└── Exported: 0 (export requires manual Figma action)

Image details by screen:
┌─────────────┬────────┬────────────────────────────────┐
│ Screen      │ Images │ Types                          │
├─────────────┼────────┼────────────────────────────────┤
│ SignIn      │ 1      │ banner (1)                     │
│ SignUp      │ 1      │ banner (1)                     │
│ Dashboard   │ 2      │ illustration (2)               │
│ Tables      │ 6      │ avatar (6)                     │
│ Billing     │ 0      │ -                              │
│ Profile     │ 8      │ avatar (4), photo (4)          │
└─────────────┴────────┴────────────────────────────────┘

Placeholder CSS generated: 45 lines

Note: Actual image export requires Figma file access.
Run `/export-assets` from Figma desktop app to export images.

Output:
├── assets/asset-manifest.json (8.2 KB)
└── (Placeholder CSS included in manifest)
```

## Edge Cases

### No Images Found
```
ℹ Info: No image assets detected.
This file may use:
- Icons only (handled by icon extraction)
- CSS backgrounds (handled by token extraction)
- No visual assets

Proceeding without asset manifest.
```

### Images Without Fills
```
⚠ Warning: {count} images detected but have no exportable fills.
These may be placeholder shapes in Figma.
Placeholder strategies will be used for HTML previews.
```

### Very Large Images
```
ℹ Info: {count} large images detected (>1920px dimension).
Consider exporting at reduced resolution for web use.
Suggested: Export at 2x for retina, max 1920px width.
```

## Integration

This step runs AFTER icon extraction (10) and BEFORE content extraction (07b).

The asset manifest is used by:
- `extract-content.md` - Add asset references to sections
- `preview.md` - Render placeholders with appropriate styles

## Fallbacks

- **No Figma API access?** Generate manifest with placeholders only
- **Export fails?** Log warning, continue with placeholders
- **Unknown image type?** Default to 'image' with gradient placeholder

## Next Step

Proceed to: `extract-content.md` (enhanced with asset references)
