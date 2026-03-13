# Future Extraction Improvements

> What changes when working with professional Figma files, and what the extraction skill would need to support.

---

## Context

The current skill was built against **Soft UI Dashboard Free (Community)** — a basic Figma file with:
- 0 published styles
- 0 component sets (uses hierarchy naming like `button/size/large/hover`)
- No Figma Variables
- Limited component states (no disabled, no error, no loading)
- Single viewport (1440px desktop only)

Professional Figma files are significantly more structured. This document catalogs what they contain and what skill changes would be needed.

---

## Improvement 1: Figma Variables

### What professional files have
Figma Variables (shipped 2023) are the native design token system. They support:
- **Multiple modes**: light/dark theme, compact/comfortable density
- **Semantic aliasing**: `color-danger` references `red-500`, not a raw hex
- **Scoping**: Variables can be scoped to fill, stroke, text, etc.
- **Collections**: Organized groups (Primitives, Semantic, Component)

### What we'd extract
```
primitives/          Semantic/           Component/
  red-500: #ef4444     color-danger        button-bg-primary
  red-600: #dc2626       light: red-500      light: gradient-primary
  blue-500: #3b82f6      dark: red-400       dark: gradient-primary-dark
  ...                  color-bg-page
                         light: #ffffff
                         dark: #0a0a0a
```

### Skill changes needed
| Area | Change |
|------|--------|
| Figma API | New endpoint: `GET /v1/files/:key/variables/local` |
| Query tool | New command: `figma-query.py variables` |
| Token extraction | Prefer Variables over node-scanning when available |
| Output | Multi-mode CSS: `:root` + `[data-theme="dark"]` blocks |
| Design context | Variables give us the designer's intended token taxonomy |

### Priority: HIGH
This is the single biggest improvement. Variables give canonical token definitions instead of inferring them from node usage. Eliminates color misidentification, gray scale confusion, and naming guesswork.

### Output example
```css
/* Generated from Figma Variables - 2 modes */
:root {
  --color-bg-page: #ffffff;
  --color-text-primary: #111827;
  --color-danger: #ef4444;
}

[data-theme="dark"] {
  --color-bg-page: #0a0a0a;
  --color-text-primary: #f9fafb;
  --color-danger: #f87171;
}
```

---

## Improvement 2: Published Styles

### What professional files have
Named, published styles for colors, text, effects, and grids. These are the designer's *intended* tokens — curated, not inferred.

### Current behavior
The skill scans all nodes in the file, deduplicates colors/fonts/effects by value, and infers names from context. This works but produces noise (e.g., one-off colors from illustrations get included).

### Skill changes needed
| Area | Change |
|------|--------|
| Figma API | Already available: `styles` field in file response |
| Query tool | New command: `figma-query.py published-styles` |
| Token extraction | Use published styles as primary source, node-scanning as fallback |
| Fingerprint | Published styles make fingerprinting much more reliable |

### Priority: HIGH
Complements Variables. Some files use published styles without Variables (older files), some use both.

---

## Improvement 3: Component Sets with Properties

### What professional files have
Instead of `button/size/large/hover` naming, professional files use Component Sets:
```
Button (Component Set)
  Properties:
    Size: small | medium | large
    Variant: filled | outline | ghost | text
    State: default | hover | active | focus | disabled | loading
    HasIcon: true | false
    IconPosition: left | right
```

### What we'd extract
- Explicit property names and allowed values
- Default values for each property
- All valid combinations (variant matrix)
- Instance swap slots (e.g., "icon" slot accepts any icon component)

### Skill changes needed
| Area | Change |
|------|--------|
| Query tool | Enhanced `components` command to detect Component Sets vs standalone |
| Component extraction | Parse `componentPropertyDefinitions` from API response |
| Component spec | Structured property table with types, defaults, constraints |
| Code generation | Props interface generated directly from Figma properties |

### Priority: HIGH
Currently we infer properties from naming convention parsing. Component Sets give this explicitly.

---

## Improvement 4: Additional Component States

### What professional files define
| State | Visual Treatment | Currently Extracted? |
|-------|-----------------|---------------------|
| Default | Base appearance | Yes |
| Hover | Subtle highlight | Yes (for Button) |
| Active/Pressed | Depressed look | Yes (for Button) |
| Focus | Focus ring/outline | Partial (Input only) |
| Disabled | Reduced opacity, muted | No |
| Loading | Spinner, skeleton | No |
| Error | Red border/text | No |
| Success | Green indicator | No |
| Empty | Placeholder content | No |
| Skeleton | Loading placeholder | No |

### Skill changes needed
| Area | Change |
|------|--------|
| Component extraction | Detect and catalog all state variants |
| Component spec | States section with transition hints |
| Code generation | Generate state-handling logic from spec |

### Priority: MEDIUM
The extraction already handles states it finds — the limitation is the Figma source, not the skill. But professional files will have more states, and the spec format should accommodate them cleanly.

---

## Improvement 5: Responsive Variants

### What professional files have
- Mobile (375px), Tablet (768px), Desktop (1440px) frames for same screen
- Components with responsive resize behavior (min/max width, fill/hug)
- Auto-layout constraints that define how layouts flex

### What we'd extract
- Breakpoint definitions and which screens have mobile/tablet variants
- Component resize behavior (fixed width vs. fill container)
- Layout changes per breakpoint (sidebar collapses, grid columns reduce)

### Skill changes needed
| Area | Change |
|------|--------|
| Screen detection | Group frames by name to find viewport variants |
| Screenshots | Capture at multiple widths |
| Layout spec | Breakpoint-aware grid definitions |
| HTML preview | Media queries / container queries |
| Screen extraction | Diff between viewport variants to produce responsive CSS |

### Priority: MEDIUM
Many professional files define responsive variants. The screen extraction agent would need to detect frame groups (e.g., "Dashboard - Mobile", "Dashboard - Desktop") and produce responsive output.

---

## Improvement 6: Prototype Flows & Interactions

### What professional files have
Figma prototyping defines:
- **Navigation**: Button X links to Screen Y
- **Transitions**: Dissolve, slide, push (with duration and easing)
- **Overlays**: Modal positioning, backdrop, dismiss behavior
- **Scroll**: Fixed headers, horizontal scroll regions
- **Hover interactions**: Tooltip triggers, dropdown reveals

### What we'd extract
```json
{
  "flows": [
    {
      "trigger": { "node": "sign-in-button", "event": "click" },
      "action": "navigate",
      "destination": "Dashboard",
      "transition": { "type": "dissolve", "duration": 300, "easing": "ease-out" }
    },
    {
      "trigger": { "node": "settings-icon", "event": "click" },
      "action": "overlay",
      "destination": "SettingsModal",
      "position": "center",
      "backdrop": true
    }
  ]
}
```

### Skill changes needed
| Area | Change |
|------|--------|
| Figma API | Parse `prototypeStartNodeID` and `transitionNodeID` fields |
| New phase | Interaction extraction (after screens, before preview) |
| New output | `specs/interactions.json` — flow map |
| New output | `tokens/motion.css` — timing and easing tokens |
| HTML preview | Could wire up click navigation between screen previews |
| Code generation | React components get transition props and navigation hints |

### Priority: LOW-MEDIUM
Valuable but complex. The Figma API exposes prototype connections, but parsing the full interaction graph is non-trivial. Start with basic navigation flows.

### Output example
```css
/* tokens/motion.css */
:root {
  --duration-fast: 150ms;
  --duration-normal: 300ms;
  --duration-slow: 500ms;
  --easing-default: cubic-bezier(0.4, 0, 0.2, 1);
  --easing-enter: cubic-bezier(0, 0, 0.2, 1);
  --easing-exit: cubic-bezier(0.4, 0, 1, 1);
}
```

---

## Improvement 7: Annotations & Documentation

### What professional files have
- Component descriptions (visible in Figma's inspect panel)
- Section annotations (via plugins like Figma Tokens, Anima, or native annotations)
- Usage guidelines embedded in component descriptions
- Dev handoff notes

### What we'd extract
- Component `description` field → usage notes in spec
- Annotation text → inline documentation
- Documentation links → reference URLs in spec

### Skill changes needed
| Area | Change |
|------|--------|
| Component extraction | Include `description` field from component metadata |
| Screen extraction | Detect annotation nodes/layers |
| Component spec | Usage guidelines section from descriptions |

### Priority: LOW
Straightforward to implement — the data is already in the API response, we just don't extract it yet because the test file had no descriptions.

---

## Implementation Roadmap

### Phase A: Variable & Style Support (High Impact)
```
1. Add `variables` command to figma-query.py
2. Add `published-styles` command to figma-query.py
3. Update token-extraction-agent.md to prefer Variables > Published Styles > Node Scanning
4. Add multi-mode CSS output (light/dark)
5. Update fingerprint to use Variables for semantic mapping
```

### Phase B: Component Set Support (High Impact)
```
1. Update `components` query to detect Component Sets
2. Parse componentPropertyDefinitions for explicit properties
3. Update component spec format for structured properties
4. Handle instance swap slots
```

### Phase C: Responsive Support (Medium Impact)
```
1. Add viewport variant detection to screen discovery
2. Group frames by base name + viewport suffix
3. Update screen extraction to produce responsive CSS
4. Capture screenshots at multiple widths
```

### Phase D: Interaction Support (Lower Impact)
```
1. Add prototype flow parsing to figma-query.py
2. New extraction phase for interactions
3. Generate motion tokens from transition settings
4. Wire up navigation in HTML previews
```

---

## How to Test

The best way to validate these improvements is to run the skill against a professional Figma file that uses these features. Good candidates:
- A file using Figma Variables with light/dark modes
- A file with Component Sets (not hierarchy naming)
- A file with mobile + desktop frames for the same screens

Run the extraction, check what's missing vs. a basic file, and iterate on the prompts.

---

## Related Documents

- [Visual Convergence Plan](./visual-convergence-plan.md) — iterative screenshot comparison loop
- [CHECKLIST.md](../.claude/skills/figma-extraction/prompts/CHECKLIST.md) — current extraction pipeline
- [MEMORY.md](../.claude/projects/-Users-adeelhasan-work-my-design-system-project/memory/MEMORY.md) — implementation history
