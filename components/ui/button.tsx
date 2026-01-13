// components/ui/button.tsx - FIXED TEXT COLORS
import * as React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'default',
      size = 'default',
      isLoading,
      children,
      ...props
    },
    ref
  ) => {
    const variants = {
      default: 'bg-blue-600 text-white hover:bg-blue-700', // ✅ White text
      secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300', // ✅ Dark text
      outline: 'border border-gray-300 bg-white text-gray-900 hover:bg-gray-50', // ✅ Dark text
      ghost: 'text-gray-900 hover:bg-gray-100', // ✅ Dark text
      destructive: 'bg-red-600 text-white hover:bg-red-700', // ✅ White text
    };

    const sizes = {
      default: 'h-10 px-4 py-2',
      sm: 'h-8 px-3 text-sm',
      lg: 'h-12 px-8',
      icon: 'h-10 w-10',
    };

    return (
      <button
        className={cn(
          'inline-flex items-center justify-center whitespace-nowrap rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:pointer-events-none disabled:opacity-50',
          variants[variant],
          sizes[size],
          className
        )}
        ref={ref}
        disabled={isLoading}
        {...props}
      >
        {isLoading && (
          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button };