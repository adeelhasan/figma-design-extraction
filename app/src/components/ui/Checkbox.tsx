import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
}

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, className, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <label
        htmlFor={inputId}
        className={cn('inline-flex items-center gap-[var(--spacing-2)] cursor-pointer', className)}
      >
        <span className="relative inline-flex items-center justify-center w-5 h-5">
          <input
            ref={ref}
            type="checkbox"
            id={inputId}
            className="peer sr-only"
            {...props}
          />
          {/* Unchecked box */}
          <span
            className={cn(
              'absolute inset-0 rounded-[var(--radius-sm)] border border-[var(--gray-400)] bg-white',
              'transition-all',
              'peer-checked:bg-[var(--color-dark)] peer-checked:border-[var(--color-dark)]',
              'peer-disabled:opacity-50 peer-disabled:cursor-not-allowed',
              'peer-focus-visible:ring-2 peer-focus-visible:ring-[rgba(226,147,211,0.5)]'
            )}
          />
          {/* Check mark */}
          <svg
            className="relative w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none"
            viewBox="0 0 12 12"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path
              d="M2.5 6L5 8.5L9.5 3.5"
              stroke="currentColor"
              strokeWidth="2"
            />
          </svg>
        </span>
        {label && (
          <span className="text-[length:var(--font-size-sm)] text-[var(--color-body)] select-none">
            {label}
          </span>
        )}
      </label>
    );
  }
);

Checkbox.displayName = 'Checkbox';

export { Checkbox, type CheckboxProps };
