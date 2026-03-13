# Icons and Assets Extraction Report

**Extracted:** 2026-02-06
**Source:** Figma - Soft UI Dashboard

## Icons Extraction

### Summary
- **Total icons identified:** 27
- **Mapped to Lucide:** 27 (100%)
- **Unmapped:** 0

### Mapping Strategy
Icons from the Figma design were mapped to [Lucide React](https://lucide.dev/) icon library:
- **Exact matches:** 14 icons with direct library equivalents
- **Fuzzy matches:** 9 icons with close semantic equivalents
- **Inferred matches:** 4 brand logos mapped to generic external-link icon

### Icon List

| Figma Name | Lucide Icon | Confidence |
|-----------|------------|-----------|
| access-key | key | fuzzy |
| arrow-right | arrow-right | exact |
| bell | bell | exact |
| cart | shopping-cart | exact |
| cog | settings | exact |
| collection | layers | fuzzy |
| credit-card | credit-card | exact |
| customer-support | headphones | fuzzy |
| diamond | diamond | exact |
| document | file-text | exact |
| html5 | code | fuzzy |
| logo-atlassian | external-link | inferred |
| logo-invision | external-link | inferred |
| logo-jira | external-link | inferred |
| logo-shopify | external-link | inferred |
| logo-slack | external-link | inferred |
| logo-spotify | external-link | inferred |
| money-coins | coins | exact |
| office | building-2| fuzzy |
| paper-diploma | award | fuzzy |
| plus | plus | exact |
| search | search | exact |
| settings | settings | exact |
| shop | shopping-bag | exact |
| spaceship | rocket | fuzzy |
| user-circle | user-circle | exact |
| world | globe | exact |

### Usage in App

All icons should be imported from the Lucide library:

```jsx
import { Bell, Settings, ShoppingCart, UserCircle } from 'lucide-react';

export function Dashboard() {
  return (
    <nav>
      <Bell size={24} />
      <Settings size={24} />
      <ShoppingCart size={24} />
      <UserCircle size={24} />
    </nav>
  );
}
```

## Image Assets Extraction

### Summary
- **Total images identified:** 249
- **By type:**
  - Avatars: 56 (22.5%)
  - Photos: 176 (70.7%)
  - Illustrations: 9 (3.6%)
  - Logos: 8 (3.2%)

### Asset Classification

#### Avatars (56)
User profile pictures and face components. These appear in:
- Team member displays
- User profiles
- Profile sections

**Placeholder strategy:** Solid color (#E8E8E8)

#### Photos (176)
General image content including:
- Dashboard frames
- Gradient backgrounds
- Color palette previews
- Typography samples
- Layout mockups

**Placeholder strategy:** Gradient (#E8E8E8 → #F5F5F5)

#### Illustrations (9)
Custom artwork and promotional graphics:
- Ad thumbnails
- Dashboard illustrations
- Hero sections

**Placeholder strategy:** Gradient (#E8E8E8 → #F5F5F5)

#### Logos (8)
Brand and logo assets:
- Atlassian
- InVision
- Jira
- Shopify
- Slack
- Spotify
- Custom logos

**Placeholder strategy:** Solid color (#E8E8E8)

## Output Files

### Files Created
1. **icon-manifest.json** - Complete icon mapping with Lucide equivalents
2. **asset-manifest.json** - Image asset inventory with classifications

### File Locations
```
design-system/
├── assets/
│   ├── icon-manifest.json
│   ├── asset-manifest.json
│   ├── EXTRACTION_REPORT.md (this file)
│   ├── icons/
│   └── images/
```

## Integration Guide

### Using Icons in React

```jsx
// Install lucide-react
npm install lucide-react

// Import and use
import { Bell, Settings, ShoppingCart } from 'lucide-react';

<Bell size={24} />
<Settings size={24} />
<ShoppingCart size={24} />
```

### Using Image Assets

Reference the `asset-manifest.json` for:
- Image IDs and names
- Dimensions for responsive layouts
- Placeholder configurations
- Asset classification

```jsx
import { assetManifest } from './design-system/assets/asset-manifest.json';

const avatar = assetManifest.images.find(img => img.name === 'face-1');

<img
  src={`/images/${avatar.name}.png`}
  width={avatar.dimensions.width}
  height={avatar.dimensions.height}
  alt="User Avatar"
/>
```

## Notes

- All brand logos (Atlassian, Shopify, Slack, etc.) are custom graphics and should be stored as SVGs in `/design-system/assets/images/`
- Fuzzy icon matches should be reviewed for visual accuracy
- Consider creating custom React components for brand logos instead of using generic icons
- Avatar components should support placeholder fallbacks using initials or solid colors
