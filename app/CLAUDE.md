# App Instructions

This app uses a Figma-extracted design system. All UI must follow the design specs.

## Before Building UI

**Read these files first:**
- `design-system/specs/components.md` - Component variants, dimensions, states
- `design-system/specs/layouts.md` - Layout patterns and structure

## Rules

1. **Use existing components** from `src/components/ui/`
2. **Never hardcode colors** — use `var(--color-*)` tokens
3. **Never hardcode spacing** — use `var(--spacing-*)` tokens
4. **Follow layout specs** — match patterns in layouts.md
5. **Check component specs** — use correct variants and props

## Token Usage

### In JSX
```tsx
<div style={{
  padding: 'var(--spacing-6)',
  background: 'var(--color-surface)',
  borderRadius: 'var(--radius-2xl)',
  border: '1px solid var(--color-border)'
}}>
  Content
</div>
```

### With Tailwind
```tsx
<button className="
  px-[var(--spacing-3)]
  py-[var(--spacing-2)]
  bg-[var(--color-primary)]
  rounded-[var(--radius-DEFAULT)]
">
  Click me
</button>
```

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `/gen-component Button` | Generate a component |
| `/gen-component --all` | Generate all components |
| `/build-screen Dashboard` | Build a screen from layout spec |

## File Structure

```
app/
├── design-system/          # Extracted design tokens
│   ├── tokens/             # CSS custom properties
│   └── specs/              # Component & layout specs
├── src/
│   ├── app/                # Next.js pages
│   ├── components/ui/      # Generated components
│   └── lib/utils.ts        # cn() utility
└── tailwind.config.ts      # Extended with tokens
```
