'use client';

interface LogoProps {
  variant?: 'indigo' | 'emerald';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const gradientMap = {
  indigo: 'from-indigo-500 to-cyan-400 shadow-indigo-500/20',
  emerald: 'from-emerald-500 to-cyan-400 shadow-emerald-500/20',
};

const sizeMap = {
  sm: 'h-8 w-8 text-sm',
  md: 'h-12 w-12 text-xl',
  lg: 'h-16 w-16 text-3xl',
};

export default function Logo({ variant = 'indigo', size = 'md', className = '' }: LogoProps) {
  return (
    <div className={`flex items-center justify-center rounded-xl bg-gradient-to-tr font-black text-white shadow-lg ${gradientMap[variant]} ${sizeMap[size]} ${className}`}>
      C
    </div>
  );
}
