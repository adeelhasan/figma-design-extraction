# Sync Design System with Figma

Check for changes and sync updates from Figma to the local design system.

## Usage

```
/sync [--check] [--all] [--tokens] [--components] [--screens]
```

## Modes

### Interactive (default)
```
/sync
```
Shows diff, asks what to sync.

### Check Only
```
/sync --check
```
Shows diff without applying changes.

### Selective
```
/sync --tokens       # Sync all token categories
/sync --components   # Sync all component specs
/sync --screens      # Sync all layout specs
```

### Full Re-extraction
```
/sync --all
```
Complete re-extraction (same as initial extract).

## Process

1. **Load metadata**
   - Read `design-system/extraction-meta.json`
   - Get last sync timestamps and hashes

2. **Connect to Figma**
   - Fetch current file state
   - Compare `lastModified` timestamps

3. **Detect changes**
   - Compare token hashes
   - Compare component node hashes
   - Compare screen node hashes

4. **Report diff**
   ```
   Changes detected:
   
   TOKENS
     Colors:     +2 added, ~1 modified
     Typography: no changes
     Spacing:    no changes
     Effects:    ~1 modified
   
   COMPONENTS
     Button:     ~modified
     Modal:      +NEW
   
   SCREENS
     Settings:   ~modified
     Onboarding: +NEW
   ```

5. **Apply changes** (if not `--check`)
   - Update selected token files
   - Update component specs
   - Update layout specs
   - Regenerate affected previews
   - Update metadata with new hashes

## Output

Shows:
- Summary of changes detected
- Details of what was updated
- Warnings about implementations that may need updates

## Example

```
/sync

Connecting to Figma...
✓ Last synced: 2 days ago
✓ Figma modified: 3 hours ago

Changes detected:

TOKENS
  Colors:     +2 added, ~1 modified
  Typography: no changes

COMPONENTS
  Button:     ~modified (new variant)
  Modal:      +NEW

What would you like to sync?
[1] Everything
[2] Tokens only
[3] Select specific items
[4] Cancel

> 3

Select items (comma-separated):
[1] Colors (+2, ~1)
[2] Button (~modified)
[3] Modal (+NEW)

> 1, 3

Syncing...
✓ Colors: Added brand-accent-500, brand-accent-600
         Modified primary-500 (#2563eb → #3b82f6)
✓ Modal: Added to components.md

Updated extraction-meta.json

⚠️ Note: Components using --color-primary-500 may need review
```

## See Also

- `/sync-tokens` — Sync just tokens
- `/sync-component <name>` — Sync specific component
- `/sync-screen <name>` — Sync specific screen
