# Design System Fingerprinting (Phase 2)

## Purpose

Analyze Figma screenshots to identify the design system family and extract semantic color mappings that inform all subsequent extraction phases.

**Output**: `design-system-context.json` — read by token extraction agents BEFORE they extract.

This prevents:
- Arbitrary numbered token names instead of semantic names
- Inverted gray scales
- Lost gradient angles
- Wrong primary color identification

## Input

- Figma screenshots: `${OUTPUT_DIR}/preview/layouts/screenshots/*.png` (primary input — visual analysis)
- Figma file metadata: `${OUTPUT_DIR}/extraction-meta.json`
- Essentials file: `${OUTPUT_DIR}/figma-essentials.json`

### Figma Query Tool (for value confirmation)

**DO NOT read the full cache file.** Use the query tool to confirm color and gradient values:

```bash
QUERY="python3 .claude/skills/figma-extraction/scripts/figma-query.py --cache ${OUTPUT_DIR}/.cache/figma-file.json"

# Confirm color identification from screenshots
$QUERY colors       # → all unique hex values with usage context (~10KB)

# Confirm gradient angles and stops
$QUERY gradients    # → all gradient definitions (~5KB)
```

Screenshots are your primary input for visual classification. The query tool is for confirming exact hex values and gradient angles.

## Process

### Step 1: Visual Analysis

Examine 2-3 representative screenshots and identify:

1. **Shadow Characteristics** — Single vs multi-layer, spread/blur values, neutral vs tinted
2. **Surface Treatment** — Solid, gradients, transparency/blur, textures
3. **Border Radius Patterns** — Sharp (0-4px), rounded (8-16px), pill (full radius)
4. **Color Palette** — Vibrant gradients vs muted solids, tonal variations
5. **Typography Style** — System font vs custom, weight distribution
6. **Component Patterns** — Card elevation, button treatment, toggle/switch style

### Step 2: System Classification

| Classification | Key Indicators |
|---------------|----------------|
| `soft-ui` | Multi-layer shadows, gradient accents, floating cards, gradient toggles |
| `material-3` | Tonal surfaces, 5-level elevation, dynamic color, filled/outlined buttons |
| `neumorphic` | Inset shadows, embossed appearance, monochromatic |
| `flat` | No shadows, solid fills, minimal depth |
| `glassmorphic` | Heavy blur, transparency, frosted glass |
| `custom` | Mixed or unique characteristics |

### Step 3: Extract Semantic Colors (CRITICAL)

Identify exact hex values for semantic roles. Token agents match against these.

**Identification strategies:**

1. **Primary Color** — Button gradients dominant color, named styles with "primary"/"brand"/"accent"
2. **Secondary Color** — Muted gray-blue, secondary text/borders
3. **Semantic States** — Success (green), Warning (yellow/orange), Error (red), Info (cyan/blue)
4. **Gray Scale** — Lightest (background/cards) to darkest (text/headings), determine gray-50 direction

### Step 4: Extract Gradient Rules

1. Find gradients on primary buttons, extract angle (e.g., 310deg for Soft UI)
2. Extract start/end color stops, map to semantic gradient names

### Step 5: Extract Design Hints

For the detected system, output extraction hints covering shadows, gradients, surfaces, and radius patterns.

## Output

Write to: **`${OUTPUT_DIR}/design-system-context.json`**

```json
{
  "$schema": "design-system-context-v1",
  "figmaFile": "{fileName}",
  "designSystemType": "soft-ui",
  "confidence": 0.92,

  "semanticColors": {
    "primary": {
      "hex": "#cb0c9f",
      "role": "Brand primary, used in CTAs and accents",
      "source": "Button gradient, named style 'Primary'"
    },
    "secondary": { "hex": "#8392ab", "role": "Secondary text, muted elements" },
    "success": { "hex": "#82d616", "role": "Success states" },
    "warning": { "hex": "#fbcf33", "role": "Warning states" },
    "error": { "hex": "#ea0606", "role": "Error states, destructive" },
    "info": { "hex": "#17c1e8", "role": "Info states, links" }
  },

  "gradientRules": {
    "primaryAngle": "310deg",
    "semanticMapping": {
      "gradient-primary": {
        "angle": "310deg",
        "stops": ["#7928ca", "#ff0080"],
        "usage": "Primary buttons, accent elements"
      },
      "gradient-dark": {
        "angle": "135deg",
        "stops": ["#3a416f", "#141727"],
        "usage": "Dark backgrounds, sidebar"
      }
    }
  },

  "grayScaleConvention": "light-to-dark",
  "grayScaleMapping": {
    "gray-50": "#fafafa",
    "gray-100": "#f8f9fa",
    "gray-200": "#e9ecef",
    "gray-300": "#dee2e6",
    "gray-400": "#ced4da",
    "gray-500": "#adb5bd",
    "gray-600": "#8392ab",
    "gray-700": "#67748e",
    "gray-800": "#344767",
    "gray-900": "#141727"
  },

  "shadowStyle": {
    "mode": "multi-layer",
    "signature": "0 8px 26px -4px rgba(20,20,20,0.15), 0 8px 9px -5px rgba(20,20,20,0.06)",
    "softVariant": "0 20px 27px 0 rgba(0,0,0,0.05)"
  },

  "extractionHints": {
    "colorMatching": { "tolerance": 5 },
    "gradientMatching": { "angleTolerance": 10 },
    "surfaces": { "glassmorphicElements": ["sidebar"], "backdropBlur": "10px" },
    "radius": { "cardRadius": "16px", "buttonRadius": "8px" }
  },

  "metadata": {
    "createdAt": "{ISO timestamp}",
    "screenshotsAnalyzed": 3,
    "indicators": [
      "Multi-layer shadows on cards",
      "310deg gradient on buttons",
      "Magenta primary (#cb0c9f)",
      "Floating sidebar with blur"
    ]
  }
}
```

### Validation Before Writing

1. Primary color is NOT cyan/blue unless the design clearly uses blue as primary
2. Gray-50 should be lightest in most systems
3. Gradient angle matches what's visible in button gradients
4. All semantic colors have hex values — no empty or placeholder values

## Error Handling

| Scenario | Action |
|----------|--------|
| Screenshots not found | Skip fingerprinting, token agents use numbered naming |
| Low confidence (<70%) | Mark as "custom", extract conservatively |
| Mixed signals | Identify primary and secondary system types |

## Next Step

After fingerprinting, proceed to Phase 3 (Token Extraction). Each token agent reads `design-system-context.json` before extracting.
