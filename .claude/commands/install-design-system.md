# Install Design System into App

Installs the extracted design system into a target application, setting up token imports and generating the app's CLAUDE.md.

## Usage

```
/install-design-system [app-path]
```

## Arguments

- `app-path` (optional): Path to the target app (default: current directory)

## Process

1. **Verify design system exists**
   - Check for `design-system/` in the project root
   - Validate required files exist (tokens/, specs/, README.md)

2. **Detect/Create app structure**
   - If app doesn't exist, prompt to create with Next.js + Tailwind
   - If app exists, detect framework (Next.js, Vite, CRA)
   - Identify key files (globals.css, tailwind.config.js)

3. **Copy design system**
   - Copy `design-system/` to target app root
   - Preserve directory structure

4. **Set up token imports**
   - Find or create globals.css
   - Add token imports at the top:
     ```css
     @import '../design-system/tokens/colors.css';
     @import '../design-system/tokens/typography.css';
     @import '../design-system/tokens/spacing.css';
     @import '../design-system/tokens/effects.css';
     ```

5. **Configure Tailwind**
   - Update tailwind.config.js to extend theme with tokens
   - Add content paths for design system

6. **Generate CLAUDE.md**
   - Create app-specific CLAUDE.md with design system references
   - Include rules for using tokens and components
   - List available components and token categories

7. **Create utility file**
   - Generate `src/lib/utils.ts` with `cn()` helper

## Generated CLAUDE.md Structure

```markdown
# Project: [App Name]

## Design System

This app uses a Figma-extracted design system.

**IMPORTANT: Before building any UI, read these files:**
- `design-system/specs/components.md` - Component variants, dimensions, states
- `design-system/specs/layouts.md` - Layout patterns

### Rules
1. **Use existing components** from `src/components/ui/`
2. **Never hardcode colors** — use `var(--color-*)` tokens
3. **Never hardcode spacing** — use `var(--spacing-*)` tokens
4. **Follow layout specs** — match patterns in layouts.md
5. **Check component specs** — use correct variants and props

### Available Components
[List from specs/components.md]

### Token Quick Reference
[Summary from tokens]
```

## Example

```
/install-design-system app/

Checking design system...
✓ Found design-system/ with all required files

Analyzing target: app/
✓ Detected Next.js 14 with Tailwind CSS
✓ Found src/app/globals.css
✓ Found tailwind.config.ts

Installing design system...
✓ Copied design-system/ to app/design-system/
✓ Added token imports to globals.css
✓ Extended Tailwind config with tokens
✓ Created src/lib/utils.ts
✓ Generated CLAUDE.md

Installation complete!

Next steps:
1. Run `/gen-component --all` to generate all components
2. Run `/build-screen Dashboard` to build your first screen
3. Or just ask me to "build the dashboard page"

The design system is now active. All UI code will follow the specifications.
```

## Options

### Link instead of copy
```
/install-design-system --link
```
Creates symlink instead of copying (useful for monorepos)

### Skip CLAUDE.md
```
/install-design-system --no-claude-md
```
Installs tokens only, doesn't generate CLAUDE.md

### Specify CSS file
```
/install-design-system --css src/styles/global.css
```

## What Gets Created

```
app/
├── design-system/              # Copied from project root
│   ├── tokens/
│   ├── specs/
│   └── preview/
├── src/
│   ├── app/
│   │   └── globals.css         # Updated with token imports
│   └── lib/
│       └── utils.ts            # Created with cn() helper
├── tailwind.config.js          # Extended with tokens
└── CLAUDE.md                   # Generated with rules
```

## Notes

- Idempotent: Running again updates without duplicating
- Preserves existing app code
- Works with Next.js, Vite, and Create React App
- Requires design-system/ to exist in project root
