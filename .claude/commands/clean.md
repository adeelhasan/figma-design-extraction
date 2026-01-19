# Clean Design System Output

Delete all extracted and generated files to start fresh.

## Usage

```
/clean [--all]
```

## What gets deleted (default)

- `design-system/tokens/` - Extracted CSS token files
- `design-system/specs/` - Component and layout specifications
- `design-system/preview/` - HTML preview files
- `design-system/extraction-meta.json` - Sync metadata
- `design-system/extraction-report.md` - Validation report
- `app/design-system/` - Copied design system in app
- `app/src/components/ui/` - Generated React components

## Options

- `--all`: Also delete generated app pages (dashboard, signin, etc.)

## Process

1. Run the cleanup script:
   ```bash
   ./scripts/clean-output.sh
   ```
   Or with `--all`:
   ```bash
   ./scripts/clean-output.sh --all
   ```

2. Verify cleanup completed

3. Ready to run `/extract-design` again

## Example

```
/clean

Cleaning design system output...
✓ Removed design-system/tokens/
✓ Removed design-system/specs/
✓ Removed design-system/preview/
✓ Removed design-system/extraction-meta.json
✓ Removed design-system/extraction-report.md
✓ Removed app/design-system/
✓ Removed app/src/components/ui/

Done. Run /extract-design to start fresh.
```

## Notes

- This does NOT delete:
  - `.claude/` commands and skills (infrastructure)
  - `design-system/SKILL.md` and `design-system/README.md` (documentation)
  - `app/` configuration files (package.json, tailwind.config.ts, etc.)
  - `app/src/app/page.tsx` (home page)

- Use `--all` to also remove generated pages like `/dashboard`, `/signin`
