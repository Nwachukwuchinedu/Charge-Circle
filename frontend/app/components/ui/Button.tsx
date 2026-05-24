'use client';

import { forwardRef } from 'react';

type ButtonVariant = 'primary' | 'emerald' | 'secondary' | 'ghost' | 'danger';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 ' +
    'text-white font-bold shadow-lg shadow-indigo-500/25',
  emerald:
    'bg-gradient-to-r from-emerald-600 to-cyan-500 hover:from-emerald-500 hover:to-cyan-400 ' +
    'text-white font-bold shadow-lg shadow-emerald-500/25',
  secondary:
    'bg-zinc-800/60 text-zinc-200 border border-zinc-700/60 hover:bg-emerald-600 hover:border-emerald-500 ' +
    'hover:text-white hover:shadow-lg hover:shadow-emerald-500/10',
  ghost:
    'text-zinc-400 hover:text-white hover:bg-zinc-800',
  danger:
    'text-rose-400 hover:text-rose-300 hover:bg-rose-500/10',
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', isLoading, leftIcon, rightIcon, children, className = '', disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 font-bold text-sm transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 ${variantStyles[variant]} ${className}`}
        {...props}
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <svg
              className="animate-spin -ml-1 mr-1 h-4 w-4 text-current"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            {children}
          </span>
        ) : (
          <>
            {leftIcon}
            {children}
            {rightIcon}
          </>
        )}
      </button>
    );
  },
);

Button.displayName = 'Button';

export default Button;
