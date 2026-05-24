import React from 'react';

type CardVariant = 'glass' | 'bordered' | 'flat';

interface CardProps {
  variant?: CardVariant;
  hover?: boolean;
  children: React.ReactNode;
  className?: string;
  as?: 'div' | 'section' | 'article' | 'form';
}

const variantStyles: Record<CardVariant, string> = {
  glass: 'bg-[#0d0e12]/60 backdrop-blur-xl border border-zinc-800/60 rounded-2xl shadow-xl',
  bordered: 'bg-[#0d0e12] border border-zinc-800/50 rounded-xl',
  flat: 'bg-[#0d0e12] rounded-xl',
};

export default function Card({ variant = 'bordered', hover = false, children, className = '', as: Tag = 'div' }: CardProps) {
  return (
    <Tag className={`${variantStyles[variant]} ${hover ? 'transition-all hover:border-indigo-500/40 hover:shadow-lg hover:shadow-indigo-500/5' : ''} ${className}`}>
      {children}
    </Tag>
  );
}
