# Sync Specific Screen Layout

Sync or add a specific screen/page layout from Figma, including image assets.

## Usage

```
/sync-screen <screen-name> [--with-images]
```

## Arguments

- `screen-name` (required): Name of the screen/frame in Figma
  - Usually top-level frames named like "Dashboard", "Settings", "Profile"
  - Case-insensitive matching

## Options

- `--with-images`: Also extract and export image assets from the screen
  - Exports banners, backgrounds, avatars, photos, and illustrations
  - Saves to `design-system/assets/images/{category}/`
  - Updates `asset-manifest.json` with export paths

## Process

1. **Find screen**
   - Search Figma pages for matching frame
   - Look for top-level frames with screen-like dimensions

2. **Check existing**
   - Is this screen already in `design-system/layouts.md`?
   - If yes: show diff
   - If no: add as new

3. **Extract layout**
   - Grid system
   - Section structure
   - Component usage
   - Responsive variants

4. **Extract images** (with `--with-images` flag)
   - Detect image nodes in the screen (banners, avatars, photos, etc.)
   - Export via Figma Images API at 2x resolution
   - Save to categorized directories under `design-system/assets/images/`
   - Update `asset-manifest.json` with export paths

5. **Show diff or preview**
   ```
   Screen: Settings (NEW)

   Layout: header-content-footer
   Grid: 12 columns, 24px gutter

   Sections:
   1. Header (64px)
   2. Navigation (sidebar, 240px)
   3. Content (scrollable)
   4. Footer (48px)

   Images found: 3
   - hero-banner (background)
   - user-avatar (avatar)
   - feature-illustration (illustration)

   Add to layouts.md? [y/n]
   ```

6. **Update files**
   - Add or update screen entry in layouts.md
   - Update metadata
   - Save exported images (if --with-images)
   - Update asset-manifest.json

## Example

```
/sync-screen Profile --with-images

Finding "Profile" in Figma...
✓ Found: Profile (1440×1409, Page: Main)

This screen is NEW (not in current layouts.md)

Analyzing layout...
✓ Pattern: sidebar-content
✓ Grid: content-based auto-layout

Sections detected:
1. Profile Banner (hero, 1121×308)
2. Platform Settings (card, toggles)
3. Profile Information (card, bio)
4. Conversations (list, 5 items)
5. Projects (card-grid, 4 cards)

Components used:
- Profile Banner ×1
- Avatar ×6
- Toggle Switch ×6
- Project Card ×4

Extracting images...
📸 Found 8 images to export:
  ✓ profile-banner.png (backgrounds/)
  ✓ alec-avatar.png (avatars/)
  ✓ project-modern.png (content/)
  ✓ project-scandinavian.png (content/)
  ✓ project-minimalist.png (content/)
  ✓ sophie-avatar.png (avatars/)
  ✓ anne-avatar.png (avatars/)
  ✓ ivanna-avatar.png (avatars/)

Add to layouts.md? [y/n]: y

✓ Added "Profile" to layouts.md
✓ Exported 8 images to design-system/assets/images/
✓ Updated asset-manifest.json
✓ Updated extraction-meta.json

Next: Generate the page with /gen-screen Profile
```

## Image Export Details

When `--with-images` is specified:

### Image Types Detected
| Type | Description | Output Directory |
|------|-------------|------------------|
| `banner` | Full-width hero/header images | `backgrounds/` |
| `background` | Decorative background patterns | `backgrounds/` |
| `avatar` | User profile photos | `avatars/` |
| `photo` | Content photos (projects, etc.) | `content/` |
| `illustration` | Decorative illustrations | `content/` |
| `logo` | Brand/company logos | `logos/` |

### Export Settings
- Format: PNG
- Scale: 2x (for retina displays)
- Naming: `{screen}-{image-name}.png`

### Asset Manifest Update
The `design-system/assets/asset-manifest.json` is updated with:
```json
{
  "id": "profile-banner",
  "type": "banner",
  "exportPath": "design-system/assets/images/backgrounds/profile-banner.png",
  "hasOriginal": true,
  "usedIn": ["Profile"]
}
```

## Notes

- Great for when designers add new pages
- Detects responsive variants automatically
- Documents component usage for implementation
- Image extraction requires `FIGMA_TOKEN` environment variable
- Exported images can be referenced in rendered HTML previews
