import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="flex flex-col gap-[var(--spacing-1)]">
        {label && (
          <label
            htmlFor={inputId}
            className="text-[length:var(--font-size-xs)] font-semibold text-[var(--color-dark)] uppercase"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            // Base
            'h-10 w-full rounded-[var(--radius-3)] border bg-white px-[var(--spacing-3)]',
            'font-[var(--font-family-primary)] text-[length:var(--font-size-sm)]',
            'transition-all outline-none',

            // Default state
            'border-[var(--gray-400)] text-[var(--color-dark)]',
            'placeholder:font-semibold placeholder:text-[var(--gray-400)]',

            // Focus state — primary-tinted border + glow
            'focus:border-[#e293d3] focus:shadow-[var(--shadow-focus)]',

            // Error
            error && 'border-[var(--color-error)] focus:border-[var(--color-error)] focus:shadow-none',

            // Disabled
            'disabled:opacity-50 disabled:cursor-not-allowed',

            className
          )}
          {...props}
        />
        {error && (
          <span className="text-[length:var(--font-size-xs)] text-[var(--color-error)]">
            {error}
          </span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input, type InputProps };
