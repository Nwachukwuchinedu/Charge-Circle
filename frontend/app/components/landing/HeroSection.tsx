'use client';

import { motion } from 'framer-motion';
import { Zap, ChevronDown, Sparkles } from 'lucide-react';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.2 },
  },
};

const childVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' as const } },
};

const badgeVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    transition: { delay: 0.8 + i * 0.15, duration: 0.5, ease: 'easeOut' as const },
  }),
};

export default function HeroSection() {
  const scrollToFeatures = () => {
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center px-4 z-10">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="flex flex-col items-center text-center max-w-4xl"
      >
        {/* Tag */}
        <motion.div
          variants={childVariants}
          className="mb-5 flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-medium tracking-wider uppercase"
        >
          <Sparkles size={12} />
          Real-Time Multiplayer Grid Game
        </motion.div>

        {/* Title */}
        <motion.h1
          variants={childVariants}
          className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight leading-none"
        >
          <span className="bg-gradient-to-r from-indigo-300 via-cyan-300 to-indigo-400 bg-clip-text text-transparent">
            Charge
          </span>{' '}
          <span className="text-white">Circle</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          variants={childVariants}
          className="mt-5 text-base sm:text-lg text-zinc-400 max-w-xl leading-relaxed"
        >
          Collaborate with operators worldwide to guide the Energy Orb across the grid.
          Every move charges the circle. Every game powers the network.
        </motion.p>

        {/* CTAs */}
        <motion.div
          variants={childVariants}
          className="mt-8 flex flex-col sm:flex-row items-center gap-4"
        >
          <a
            href="/signup"
            className="group relative inline-flex items-center gap-2 px-7 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 text-white font-bold text-sm shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 transition-all duration-300 hover:scale-105"
          >
            <Zap size={16} className="group-hover:animate-pulse" />
            Join the Grid
          </a>
          <button
            onClick={scrollToFeatures}
            className="inline-flex items-center gap-2 px-7 py-3 rounded-xl border border-zinc-700 text-zinc-300 font-medium text-sm hover:bg-zinc-800/50 hover:border-zinc-600 transition-all duration-300"
          >
            <ChevronDown size={16} />
            Explore
          </button>
        </motion.div>
      </motion.div>

      {/* Floating stat badges */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-wrap justify-center gap-3 sm:gap-6">
        {[
          { label: 'Players Online', value: '1,024', icon: '👥' },
          { label: 'Games Today', value: '8,473', icon: '⚡' },
          { label: 'Grid Uptime', value: '99.9%', icon: '🔋' },
        ].map((badge, i) => (
          <motion.div
            key={badge.label}
            custom={i}
            variants={badgeVariants}
            initial="hidden"
            animate="visible"
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-zinc-900/70 backdrop-blur-sm border border-zinc-800/50 text-xs"
          >
            <span className="text-base">{badge.icon}</span>
            <div>
              <p className="text-zinc-400 font-mono text-[10px] uppercase tracking-wider">{badge.label}</p>
              <p className="text-white font-bold">{badge.value}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
