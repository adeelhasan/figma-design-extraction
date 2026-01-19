# 10b - Export Icon SVGs from Figma

## Purpose

Actually export icon and small graphic assets as SVG files from Figma using the Figma API's image export endpoint. This supplements the icon mapping (step 10) by providing actual SVG files for:
- Brand icons (Mastercard, Visa, PayPal, etc.)
- Custom icons not available in Lucide
- Small decorative graphics
- Logo assets

## Prerequisites

- Figma file key from previous extraction
- FIGMA_ACCESS_TOKEN in environment
- Icon manifest from step 10 (identifies which icons need export)

## Output Structure

```
design-system/
├── assets/
│   ├── icon-manifest.json    # Updated with exportPath entries
│   └── icons/                # Exported SVG files
│       ├── brand/
│       │   ├── mastercard.svg
│       │   ├── visa.svg
│       │   ├── paypal.svg
│       │   └── ...
│       ├── custom/
│       │   ├── credit-card-chip.svg
│       │   └── ...
│       └── decorative/
│           └── ...
```

## Process

### Step 1: Identify Icons to Export

Read the icon manifest and find icons that need SVG export:

```python
import json

def get_icons_to_export(manifest_path):
    """Find icons that need SVG export."""
    with open(manifest_path) as f:
        manifest = json.load(f)

    to_export = []

    # Get unmapped icons (no Lucide equivalent)
    for icon in manifest.get('icons', []):
        if icon.get('lucideName') is None and icon.get('customSvg'):
            to_export.append({
                'id': icon['id'],
                'figmaName': icon['figmaName'],
                'category': icon.get('category', 'custom'),
                'nodeId': icon.get('nodeId')  # Figma node ID for export
            })

    # Also export brand/logo icons even if mapped
    for icon in manifest.get('icons', []):
        if icon.get('category') in ['brand', 'logo']:
            if icon not in to_export:
                to_export.append({
                    'id': icon['id'],
                    'figmaName': icon['figmaName'],
                    'category': icon.get('category'),
                    'nodeId': icon.get('nodeId')
                })

    return to_export
```

### Step 2: Find Icon Node IDs in Figma

Scan the Figma file to find node IDs for icons that need export:

```python
def find_icon_nodes(figma_data, icon_names):
    """Find Figma node IDs for icons by name matching."""

    def search_node(node, results):
        name = node.get('name', '').lower()
        node_id = node.get('id')

        # Check if this node matches any icon we're looking for
        for icon_name in icon_names:
            if icon_name.lower() in name or name in icon_name.lower():
                # Additional checks for icon-like nodes
                bbox = node.get('absoluteBoundingBox', {})
                width = bbox.get('width', 0)
                height = bbox.get('height', 0)

                # Icons are typically small and squarish
                if width > 0 and height > 0 and width <= 100 and height <= 100:
                    results.append({
                        'nodeId': node_id,
                        'name': node.get('name'),
                        'dimensions': {'width': width, 'height': height},
                        'type': node.get('type')
                    })

        # Recurse into children
        for child in node.get('children', []):
            search_node(child, results)

        return results

    return search_node(figma_data['document'], [])
```

### Step 3: Export SVGs via Figma API

Use the Figma API images endpoint to export SVGs:

```python
import requests
import os

def export_svgs_from_figma(file_key, node_ids, access_token, output_dir):
    """
    Export SVG images from Figma.

    Figma API endpoint: GET /v1/images/:file_key
    Params:
      - ids: comma-separated node IDs
      - format: svg
      - svg_include_id: false
      - svg_simplify_stroke: true
    """

    if not node_ids:
        return {}

    # Figma API limits to 500 IDs per request
    # Process in batches if needed
    batch_size = 100
    all_results = {}

    for i in range(0, len(node_ids), batch_size):
        batch = node_ids[i:i+batch_size]
        ids_param = ','.join(batch)

        url = f"https://api.figma.com/v1/images/{file_key}"
        params = {
            'ids': ids_param,
            'format': 'svg',
            'svg_include_id': 'false',
            'svg_simplify_stroke': 'true'
        }
        headers = {
            'X-Figma-Token': access_token
        }

        response = requests.get(url, params=params, headers=headers)

        if response.status_code == 200:
            data = response.json()
            if data.get('images'):
                all_results.update(data['images'])
        else:
            print(f"Error exporting batch: {response.status_code}")
            print(response.text)

    return all_results

def download_and_save_svgs(image_urls, icon_info, output_dir):
    """Download SVG content from URLs and save to files."""

    saved_files = {}

    for node_id, url in image_urls.items():
        if not url:
            continue

        # Find icon info for this node
        info = next((i for i in icon_info if i.get('nodeId') == node_id), None)
        if not info:
            continue

        # Determine output path based on category
        category = info.get('category', 'custom')
        category_dir = os.path.join(output_dir, category)
        os.makedirs(category_dir, exist_ok=True)

        # Clean filename
        filename = info['name'].lower()
        filename = filename.replace(' ', '-').replace('_', '-')
        filename = ''.join(c for c in filename if c.isalnum() or c == '-')
        filename = f"{filename}.svg"

        filepath = os.path.join(category_dir, filename)

        # Download SVG content
        try:
            response = requests.get(url)
            if response.status_code == 200:
                svg_content = response.text

                # Optionally clean up SVG
                svg_content = clean_svg(svg_content)

                with open(filepath, 'w') as f:
                    f.write(svg_content)

                saved_files[node_id] = {
                    'path': filepath,
                    'relativePath': os.path.relpath(filepath, output_dir),
                    'name': info['name'],
                    'category': category
                }

                print(f"  ✓ Saved: {filepath}")
        except Exception as e:
            print(f"  ✗ Failed to save {filename}: {e}")

    return saved_files

def clean_svg(svg_content):
    """Clean up SVG content for web use."""
    import re

    # Remove Figma-specific attributes
    svg_content = re.sub(r'\s*data-[\w-]+="[^"]*"', '', svg_content)

    # Ensure viewBox is present
    if 'viewBox' not in svg_content:
        # Try to extract width/height and add viewBox
        width_match = re.search(r'width="(\d+)"', svg_content)
        height_match = re.search(r'height="(\d+)"', svg_content)
        if width_match and height_match:
            w, h = width_match.group(1), height_match.group(1)
            svg_content = svg_content.replace(
                '<svg ',
                f'<svg viewBox="0 0 {w} {h}" '
            )

    # Add currentColor for fill if using solid black
    svg_content = svg_content.replace('fill="#000000"', 'fill="currentColor"')
    svg_content = svg_content.replace('fill="#000"', 'fill="currentColor"')
    svg_content = svg_content.replace("fill='#000000'", "fill='currentColor'")
    svg_content = svg_content.replace("fill='#000'", "fill='currentColor'")

    return svg_content
```

### Step 4: Update Icon Manifest

Add export paths to the icon manifest:

```python
def update_icon_manifest(manifest_path, exported_files):
    """Update icon manifest with export paths."""

    with open(manifest_path) as f:
        manifest = json.load(f)

    # Update icons with export paths
    for icon in manifest.get('icons', []):
        node_id = icon.get('nodeId') or icon.get('id')
        if node_id in exported_files:
            export_info = exported_files[node_id]
            icon['exportPath'] = export_info['relativePath']
            icon['svgFile'] = export_info['path']

    # Add exported icons summary
    manifest['exported'] = {
        'count': len(exported_files),
        'files': [
            {
                'name': info['name'],
                'path': info['relativePath'],
                'category': info['category']
            }
            for info in exported_files.values()
        ]
    }

    with open(manifest_path, 'w') as f:
        json.dump(manifest, f, indent=2)

    return manifest
```

### Step 5: Generate Icon Index

Create an index file for easy import in code:

```python
def generate_icon_index(output_dir, exported_files):
    """Generate an index file listing all exported icons."""

    index = {
        'generatedAt': datetime.now().isoformat(),
        'totalIcons': len(exported_files),
        'byCategory': {},
        'icons': []
    }

    for node_id, info in exported_files.items():
        category = info['category']
        if category not in index['byCategory']:
            index['byCategory'][category] = []

        icon_entry = {
            'name': info['name'],
            'path': info['relativePath'],
            'category': category
        }

        index['byCategory'][category].append(icon_entry)
        index['icons'].append(icon_entry)

    index_path = os.path.join(output_dir, 'index.json')
    with open(index_path, 'w') as f:
        json.dump(index, f, indent=2)

    return index_path
```

## Execution Flow

```bash
# 1. Read current icon manifest
# 2. Identify icons needing SVG export (unmapped + brand icons)
# 3. Search Figma file for matching nodes
# 4. Call Figma API to get SVG export URLs
# 5. Download and save SVGs
# 6. Update icon manifest with paths
# 7. Generate icon index
```

## Output Report

```
✓ Icon SVGs exported

Export Summary:
├── Total icons identified: 12
├── Successfully exported: 10
├── Failed: 2
│
├── By category:
│   ├── brand: 5 (mastercard, visa, paypal, apple, google)
│   ├── custom: 3 (credit-card-chip, soft-ui-logo, rocket-illustration)
│   └── decorative: 2 (wave-pattern, gradient-orb)
│
└── Output location: design-system/assets/icons/

Exported files:
├── brand/
│   ├── mastercard.svg (2.1 KB)
│   ├── visa.svg (1.8 KB)
│   ├── paypal.svg (3.2 KB)
│   ├── apple.svg (1.2 KB)
│   └── google.svg (2.8 KB)
├── custom/
│   ├── credit-card-chip.svg (0.9 KB)
│   ├── soft-ui-logo.svg (4.1 KB)
│   └── rocket-illustration.svg (5.6 KB)
└── decorative/
    ├── wave-pattern.svg (12.3 KB)
    └── gradient-orb.svg (8.7 KB)

Icon manifest updated: assets/icon-manifest.json
Icon index generated: assets/icons/index.json
```

## Usage in Previews

After export, icons can be referenced in HTML:

```html
<!-- Use exported SVG directly -->
<img src="../assets/icons/brand/mastercard.svg" alt="Mastercard" width="40">

<!-- Or inline for styling -->
<svg class="icon icon-mastercard">
  <use href="../assets/icons/brand/mastercard.svg#icon"></use>
</svg>

<!-- Or use a helper function -->
<script>
async function loadIcon(name, category = 'custom') {
  const response = await fetch(`../assets/icons/${category}/${name}.svg`);
  return response.text();
}
</script>
```

## Fallback for Missing Icons

If export fails or icon not found:

```javascript
function getIconFallback(iconName, category) {
  // Map to closest Lucide icon
  const fallbacks = {
    'mastercard': 'credit-card',
    'visa': 'credit-card',
    'paypal': 'wallet',
    'google': 'chrome',
    'apple': 'smartphone'
  };

  return fallbacks[iconName] || 'circle';
}
```

## Integration

This step runs AFTER `extract-icons.md` (step 10) and enhances it with actual SVG exports.

The exported icons are used by:
- Preview HTML files (direct `<img>` or inline SVG)
- Generated React components (import SVGs as components)
- Design documentation
