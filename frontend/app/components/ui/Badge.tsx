import React from 'react';

type BadgeVariant = 'success' | 'warning' | 'info' | 'error' | 'neutral';

interface BadgeProps {
  variant: BadgeVariant;
  children: React.ReactNode;
  dot?: boolean;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25',
  warning: 'bg-amber-500/10 text-amber-400 border-amber-500/25',
  info: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/25',
  error: 'bg-rose-500/10 text-rose-400 border-rose-500/25',
  neutral: 'bg-zinc-800/40 text-zinc-500 border-zinc-700/40',
};

export default function Badge({ variant, children, dot, className = '' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-semibold border ${variantStyles[variant]} ${className}`}>
      {dot && (
        <span className={`h-1.5 w-1.5 rounded-full ${
          variant === 'success' ? 'bg-emerald-400' :
          variant === 'warning' ? 'bg-amber-400' :
          variant === 'info' ? 'bg-indigo-400' :
          variant === 'error' ? 'bg-rose-400' :
          'bg-zinc-500'
        }`} />
      )}
      {children}
    </span>
  );
}
