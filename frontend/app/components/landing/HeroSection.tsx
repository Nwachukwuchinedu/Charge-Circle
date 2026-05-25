'use client';

import { motion } from 'framer-motion';
import { Zap, Sparkles } from 'lucide-react';
import GameSimulation from './GameSimulation';

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

export default function HeroSection() {
  const scrollToFeatures = () => {
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center px-4 py-24 lg:py-0 z-10 overflow-hidden">
      <div className="max-w-6xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
        {/* Left Column: Copy */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="lg:col-span-7 flex flex-col items-start text-left"
        >
          {/* Tag */}
          <motion.div
            variants={childVariants}
            className="mb-5 flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold tracking-wider uppercase"
          >
            <Sparkles size={12} className="text-cyan-400 animate-pulse" />
            Real-Time Multiplayer Grid Game
          </motion.div>

          {/* Title */}
          <motion.h1
            variants={childVariants}
            className="text-5xl sm:text-6xl md:text-7xl font-black tracking-tight leading-none text-white"
          >
            <span className="bg-gradient-to-r from-indigo-400 via-cyan-400 to-indigo-500 bg-clip-text text-transparent">
              Charge
            </span>{' '}
            Circle
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            variants={childVariants}
            className="mt-6 text-base sm:text-lg text-zinc-400 leading-relaxed max-w-xl"
          >
            Collaborate with operators worldwide in a simultaneous, high-speed grid game. Guide your energy orb, capture shifting targets in real time, and power up the global network.
          </motion.p>

          {/* CTAs */}
          <motion.div
            variants={childVariants}
            className="mt-8 flex flex-wrap items-center gap-4 w-full sm:w-auto"
          >
            <a
              href="/signup"
              className="group relative inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 text-white font-bold text-sm shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 transition-all duration-300 hover:scale-[1.03]"
            >
              <Zap size={16} className="group-hover:animate-pulse" />
              Join the Grid
            </a>
            <button
              onClick={scrollToFeatures}
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl border border-zinc-800 text-zinc-300 font-medium text-sm hover:bg-zinc-900/50 hover:border-zinc-700 transition-all duration-300 cursor-pointer"
            >
              Explore Features
            </button>
          </motion.div>
        </motion.div>

        {/* Right Column: Interactive Simulator */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.4 }}
          className="lg:col-span-5 flex justify-center w-full"
        >
          <GameSimulation />
        </motion.div>
      </div>
    </section>
  );
}
