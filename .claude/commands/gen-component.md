# Generate Component Implementation

Generate a React component implementation based on design system specifications.

## Usage

```
/gen-component <component-name> [--path <output-path>]
/gen-component --all
```

## Arguments

- `component-name` (required unless `--all`): Name of component from `specs/components.md`
- `--all`: Generate all components from the spec
- `--path` (optional): Output directory (default: `src/components/ui/`)

## Process

1. **Load specification**
   - Read component from `design-system/specs/components.md`
   - Get variants, dimensions, tokens, states

2. **Load tokens**
   - Read all token files
   - Identify which tokens this component uses

3. **Generate code**
   - Create React component file
   - Include all variants as props
   - Use only design tokens (no hardcoded values)
   - Implement all states (hover, focus, disabled)

4. **Add types**
   - TypeScript interfaces for props
   - Variant union types

5. **Output**
   - Write to specified path
   - Report what was created

## Generated Code Structure

```tsx
// src/components/ui/Button.tsx
import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', isLoading, className, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          // Base styles (using tokens)
          'inline-flex items-center justify-center font-medium transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-offset-2',
          // ... variant and size styles using tokens
        )}
        {...props}
      >
        {isLoading ? <Spinner /> : children}
      </button>
    );
  }
);
```

## Example

```
/gen-component Button

Loading Button specification...
✓ Found in components.md

Specification:
- Variants: primary, secondary, ghost
- Sizes: sm, md, lg
- States: default, hover, pressed, disabled, loading

Tokens used:
- --color-primary, --color-primary-hover
- --color-surface, --color-text-primary
- --spacing-sm, --spacing-md, --spacing-lg
- --radius-md
- --shadow-ring (focus)

Generating...
✓ Created src/components/ui/Button.tsx

The component:
- Uses only design tokens
- Supports all variants from spec
- Includes hover/focus/disabled states
- Has TypeScript types
- Uses forwardRef for flexibility

Preview the component? [y/n]: y

[Artifact: Button component preview with all variants]
```

## Options

### Custom path
```
/gen-component Card --path src/features/dashboard/components/
```

### Preview only (no file creation)
```
/gen-component Badge --preview
```

## Notes

- Always uses design tokens, never hardcoded values
- Follows specification exactly
- Includes accessibility features (focus states, ARIA)
- Compatible with common patterns (forwardRef, className merging)
