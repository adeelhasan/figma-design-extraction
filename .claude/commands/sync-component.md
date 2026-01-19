# Sync Specific Component

Sync a specific component specification from Figma.

## Usage

```
/sync-component <component-name>
```

## Arguments

- `component-name` (required): Name of the component in Figma
  - Case-insensitive matching
  - Partial matches supported

## Process

1. **Find component**
   - Search Figma file for component/component set matching name
   - If multiple matches, show selection

2. **Load current spec**
   - Read from `design-system/components.md`
   - Extract current properties and hash

3. **Fetch from Figma**
   - Get latest component definition
   - Extract variants, dimensions, token usage

4. **Show diff**
   ```
   Component: Button
   
   Changes:
   - Variants: +1 (added "ghost")
   - Padding: 12px → 16px (md size)
   - New state: "loading"
   
   Apply changes? [y/n]
   ```

5. **Update spec**
   - Update entry in `components.md`
   - Update hash in `extraction-meta.json`

6. **Check implementations**
   - Look for matching file in `src/components/`
   - Warn if implementation may need updates

## Example

```
/sync-component Button

Finding "Button" in Figma...
✓ Found: Button (component set, 12 variants)

Current spec:
- Variants: primary, secondary
- Sizes: sm, md, lg

Figma (latest):
- Variants: primary, secondary, ghost   ← NEW
- Sizes: sm, md, lg

Changes:
+ Added variant: ghost
~ Modified: md size padding (12px → 16px)

Apply changes? [y/n]: y

✓ Updated components.md
✓ Updated extraction-meta.json

⚠️ Implementation found: src/components/ui/Button.tsx
   May need updates for:
   - New "ghost" variant
   - Updated padding values
```

## Notes

- Only updates the component specification
- Does not automatically update code implementations
- Use after designer modifies a specific component
