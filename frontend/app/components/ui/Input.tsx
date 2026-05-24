'use client';

import { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, leftIcon, className = '', id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-sm text-zinc-400">
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">
              {leftIcon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={`w-full bg-[#181920] border rounded-xl px-4 py-2.5 text-white placeholder-zinc-600 transition-all outline-none focus:ring-1 ${
              error
                ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500'
                : 'border-zinc-800 focus:border-indigo-500 focus:ring-indigo-500'
            } ${leftIcon ? 'pl-10' : ''} ${className}`}
            {...props}
          />
        </div>
        {error && (
          <span className="text-xs text-rose-400 mt-0.5">{error}</span>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';

export default Input;
