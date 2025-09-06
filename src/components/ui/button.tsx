"use client"

import { forwardRef } from 'react';
import { cn } from '~/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'secondary' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'md', children, ...props }, ref) => {
    const baseClasses = 'inline-flex items-center justify-center gap-1 font-system font-semibold leading-tight no-underline cursor-pointer transition-all duration-150 ease-out outline-none focus-visible:outline-2 focus-visible:outline-apple-blue focus-visible:outline-offset-2 disabled:opacity-60 disabled:cursor-not-allowed';
    
    const variants = {
      default: 'bg-apple-blue text-white hover:bg-blue-600 hover:-translate-y-px active:bg-blue-700 active:translate-y-0',
      secondary: 'bg-gray-50 dark:bg-gray-900 text-black dark:text-white border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800',
      ghost: 'text-black dark:text-white hover:bg-gray-50 dark:hover:bg-gray-900',
      destructive: 'bg-apple-red text-white hover:bg-red-600 hover:-translate-y-px active:bg-red-700 active:translate-y-0'
    };
    
    const sizes = {
      sm: 'min-h-[36px] px-3 py-2 text-sm rounded-lg',
      md: 'min-h-[44px] px-4 py-3 text-[17px] rounded-lg',
      lg: 'min-h-[52px] px-6 py-4 text-lg rounded-xl'
    };

    return (
      <button
        ref={ref}
        className={cn(
          baseClasses,
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';