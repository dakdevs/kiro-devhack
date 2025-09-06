"use client"

import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'tertiary' | 'destructive';
  size?: 'small' | 'medium' | 'large';
  children: React.ReactNode;
}

export function Button({ 
  variant = 'primary', 
  size = 'medium', 
  className = '', 
  children, 
  disabled,
  ...props 
}: ButtonProps) {
  const baseClasses = "inline-flex items-center justify-center gap-1 border-none rounded-lg font-system font-semibold leading-tight no-underline cursor-pointer transition-all duration-150 ease-out outline-none focus-visible:outline-2 focus-visible:outline-apple-blue focus-visible:outline-offset-2";
  
  const sizeClasses = {
    small: "min-h-[36px] px-3 py-2 text-[15px]",
    medium: "min-h-[44px] px-4 py-3 text-[17px]",
    large: "min-h-[52px] px-6 py-4 text-[19px]"
  };

  const variantClasses = {
    primary: "bg-apple-blue text-white hover:bg-[#0056CC] hover:-translate-y-px active:bg-[#004499] active:translate-y-0",
    secondary: "bg-gray-50 dark:bg-gray-900 text-black dark:text-white border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800",
    tertiary: "bg-transparent text-apple-blue hover:bg-apple-blue/10 active:bg-apple-blue/20",
    destructive: "bg-apple-red text-white hover:bg-red-600 active:bg-red-700"
  };

  const disabledClasses = "opacity-60 cursor-not-allowed hover:transform-none active:transform-none";

  const combinedClasses = [
    baseClasses,
    sizeClasses[size],
    variantClasses[variant],
    disabled ? disabledClasses : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <button 
      className={combinedClasses}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}