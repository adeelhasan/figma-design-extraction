# Extract Design System from Figma

Extract design tokens, component specs, and layout patterns from a Figma file.

## Usage

```
/extract-design <figma-url> [--thorough]
```

## Arguments

- `figma-url` (required): Full Figma file URL
  - `https://www.figma.com/file/{key}/{name}`
  - `https://www.figma.com/design/{key}/{name}`

## Options

- `--thorough`: Enable deep extraction with visual verification
  - Captures screenshots of each screen frame
  - Analyzes screenshots to create section inventory
  - Uses recursive traversal (10 levels vs 3)
  - Runs verification pass after extraction
  - Recommended for complex dashboards and high-fidelity handoffs

## Process

This command triggers a full extraction workflow:

1. **Read the extraction skill**
   ```
   @.claude/skills/figma-extraction/SKILL.md
   ```

2. **Connect to Figma**
   - Parse URL for file key
   - Connect via Figma MCP
   - Fetch file structure
   - Report contents to user

3. **(--thorough only) Visual Analysis - Phase 0**
   - Export each screen frame as PNG via Figma API
   - Analyze screenshots to identify all visible sections
   - Create section inventory for verification
   - Output: `preview/layouts/screenshots/*.png`
   - Output: `preview/layouts/data/{Screen}-inventory.json`

4. **Extract tokens** (in order)
   - Colors → `tokens/colors.css`
   - Typography → `tokens/typography.css`
   - Spacing → `tokens/spacing.css`
   - Effects → `tokens/effects.css`

5. **Extract specifications**
   - Components → `components.md`
   - Layouts → `layouts.md` (uses recursive traversal with --thorough)

6. **Extract assets and content**
   - Icons → `assets/icon-manifest.json`
   - Images → `assets/asset-manifest.json`
   - Content → `preview/layouts/data/{Screen}.json`

7. **Validate**
   - Run all validation checks
   - Generate `extraction-report.md`

8. **Generate previews**
   - Create `preview/index.html`
   - Show inline artifact preview

9. **(--thorough only) Verify Extraction - Phase 6**
   - Compare extracted sections against visual inventory
   - Calculate coverage percentages
   - Identify missing sections and patterns
   - Generate verification report
   - Output: `preview/layouts/data/{Screen}-verification.json`

10. **Complete**
    - Generate `SKILL.md` for design-system
    - Update `extraction-meta.json`
    - Report summary with coverage metrics (if --thorough)

## Output

Creates `design-system/` with:
- Token CSS files
- Component and layout specifications
- Validation report
- Visual preview

## Example (Standard)

```
/extract-design https://www.figma.com/file/abc123/MyApp-Design-System

Connecting to Figma...
✓ Connected to "MyApp Design System"

Structure:
├── Pages: 3
├── Styles: 24 colors, 8 text, 5 effects
└── Components: 12

Extracting...
✓ Colors (24 tokens)
✓ Typography (8 tokens)
✓ Spacing (12 tokens)
✓ Effects (9 tokens)
✓ Components (12 specs)
✓ Layouts (4 screens)

Validating...
✓ 0 errors, 2 warnings

Generated: design-system/

[Preview artifact shown]
```

## Example (Thorough)

```
/extract-design https://www.figma.com/file/abc123/MyApp-Design-System --thorough

Connecting to Figma...
✓ Connected to "MyApp Design System"

Structure:
├── Pages: 3
├── Styles: 24 colors, 8 text, 5 effects
└── Components: 12

Phase 0: Visual Analysis
├── Dashboard.png ✓ (8 sections identified)
├── Billing.png ✓ (10 sections identified)
├── Profile.png ✓ (7 sections identified)
└── Visual inventories saved

Extracting (deep traversal enabled)...
✓ Colors (24 tokens)
✓ Typography (8 tokens)
✓ Spacing (12 tokens)
✓ Effects (9 tokens)
✓ Components (12 specs)
✓ Layouts (4 screens, 25 sections)

Validating...
✓ 0 errors, 2 warnings

Phase 6: Verification
┌─────────────────┬────────┬──────────┬─────────────────────────┐
│ Screen          │ Status │ Coverage │ Issues                  │
├─────────────────┼────────┼──────────┼─────────────────────────┤
│ Dashboard       │ ✓ PASS │ 95.2%    │ -                       │
│ Billing         │ ✓ PASS │ 92.1%    │ -                       │
│ Profile         │ ✓ PASS │ 91.0%    │ -                       │
└─────────────────┴────────┴──────────┴─────────────────────────┘

Overall coverage: 92.8%

Generated: design-system/

[Preview artifact shown]
```

## When to Use --thorough

| Scenario | Recommended Mode |
|----------|------------------|
| Quick token extraction | Standard |
| Simple component library | Standard |
| Complex dashboard with nested sections | --thorough |
| High-fidelity design handoff | --thorough |
| Missing content in standard extraction | --thorough |
| CI/CD automated extraction | Standard (faster) |

## Notes

- Requires Figma Personal Access Token to be configured
- Requires file access (token must have permission)
- `--thorough` mode is slower but more complete
- For updates after initial extraction, use `/sync` commands
