'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import React from 'react';
import ParticleCanvas from '../particles/ParticleCanvas';
import Logo from '../ui/Logo';

interface AuthFormCardProps {
  title: string;
  subtitle: string;
  gradient?: 'indigo' | 'emerald';
  children: React.ReactNode;
  footer: { text: string; linkText: string; href: string };
}

export default function AuthFormCard({ title, subtitle, gradient = 'indigo', children, footer }: AuthFormCardProps) {
  return (
    <div className="fixed inset-0 bg-[#060709] text-zinc-100 flex items-center justify-center p-4">
      <ParticleCanvas particleCount={60} />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={`relative z-10 w-full max-w-md p-8 bg-[#0d0e12]/90 backdrop-blur-xl border border-zinc-800/60 rounded-2xl shadow-2xl ${
          gradient === 'indigo' ? 'shadow-indigo-500/5' : 'shadow-emerald-500/5'
        }`}
      >
        <div className="flex justify-center mb-6">
          <Logo variant={gradient} />
        </div>

        <h2 className="text-2xl font-bold mb-1 text-center text-white">{title}</h2>
        <p className="text-xs text-zinc-500 text-center mb-6">{subtitle}</p>

        {children}

        <p className="mt-6 text-center text-sm text-zinc-500">
          {footer.text}{' '}
          <Link
            href={footer.href}
            className={`font-medium transition-colors ${
              gradient === 'indigo'
                ? 'text-indigo-400 hover:text-indigo-300'
                : 'text-emerald-400 hover:text-emerald-300'
            }`}
          >
            {footer.linkText}
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
