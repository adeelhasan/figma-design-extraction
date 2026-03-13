import { forwardRef, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

type ButtonVariant = 'solid' | 'outline' | 'icon';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode;
  iconOnly?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'solid',
      size = 'md',
      icon,
      iconOnly = false,
      className,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        className={cn(
          // Base
          'inline-flex items-center justify-center font-bold uppercase tracking-wide transition-all',
          'font-[var(--font-family-primary)] text-[length:var(--font-size-sm)]',
          'rounded-[var(--radius-md)]',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(226,147,211,0.5)]',
          'disabled:opacity-50 disabled:pointer-events-none',

          // Variant: solid
          variant === 'solid' && [
            'bg-[image:var(--gradient-primary)] text-white',
            'shadow-[0_2px_4px_-1px_rgba(0,0,0,0.07),0_4px_6px_-1px_rgba(0,0,0,0.12)]',
            'hover:scale-[1.02] active:opacity-85',
          ],

          // Variant: outline
          variant === 'outline' && [
            'bg-transparent border border-[var(--color-primary)] text-[var(--color-primary)]',
            'shadow-[0_2px_4px_-1px_rgba(0,0,0,0.07),0_4px_6px_-1px_rgba(0,0,0,0.12)]',
            'hover:scale-[1.02] active:opacity-85',
          ],

          // Variant: icon (no label)
          variant === 'icon' && [
            'bg-[image:var(--gradient-primary)] text-white',
            'shadow-[0_2px_4px_-1px_rgba(0,0,0,0.07),0_4px_6px_-1px_rgba(0,0,0,0.12)]',
            'hover:scale-[1.02] active:opacity-85',
          ],

          // Sizes
          iconOnly
            ? 'h-10 w-10 p-0'
            : size === 'sm'
              ? 'h-8 px-[var(--spacing-3)] py-[var(--spacing-1)]'
              : size === 'lg'
                ? 'h-[47px] px-[var(--spacing-8)] py-[var(--spacing-2)]'
                : 'h-10 px-[var(--spacing-4)] py-[var(--spacing-2)]',

          className
        )}
        {...props}
      >
        {icon && (
          <span className={cn('shrink-0', !iconOnly && children && 'mr-[var(--spacing-2)]')}>
            {icon}
          </span>
        )}
        {!iconOnly && children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button, type ButtonProps, type ButtonVariant, type ButtonSize };
