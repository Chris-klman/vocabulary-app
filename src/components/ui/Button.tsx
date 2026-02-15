import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'success' | 'error' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', fullWidth = false, children, disabled, ...props }, ref) => {
    const baseClasses = 'btn inline-flex items-center justify-center font-medium transition-default rounded-lg disabled:opacity-50 disabled:cursor-not-allowed';

    const variantClasses = {
      primary: 'btn-primary',
      success: 'btn-success',
      error: 'btn-error',
      ghost: 'bg-transparent text-black hover:bg-gray-100',
    };

    const sizeClasses = {
      sm: 'min-h-[36px] px-4 py-2 text-sm',
      md: 'min-h-button px-6 py-3 text-body',
      lg: 'min-h-[52px] px-8 py-4 text-lg',
    };

    return (
      <button
        ref={ref}
        className={cn(
          baseClasses,
          variantClasses[variant],
          sizeClasses[size],
          fullWidth && 'w-full',
          className
        )}
        disabled={disabled}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button };
