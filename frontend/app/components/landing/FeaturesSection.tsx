'use client';

import { motion } from 'framer-motion';
import { Zap, Users, Radio, Shield, BarChart3, Globe } from 'lucide-react';

const features = [
  { icon: Zap, title: 'Real-Time Moves', description: 'Every move propagates instantly via WebSockets. No refresh, no lag — just pure real-time gameplay.', color: 'text-indigo-400' },
  { icon: Users, title: 'Multiplayer Rooms', description: 'Create or join rooms with custom player limits. Play 1v1 or with a group in the same grid.', color: 'text-cyan-400' },
  { icon: Radio, title: 'Live Grid View', description: 'Watch all energy orbs glide across the canvas in real time as operators act simultaneously.', color: 'text-emerald-400' },
  { icon: Shield, title: 'Simultaneous Play', description: 'No turn queues or waiting. Every operator moves independently and instantly. Action without delays.', color: 'text-amber-400' },
  { icon: BarChart3, title: 'Live Scoring', description: 'Score updates broadcast to the room instantly. Track your charges and compete on the leaderboard.', color: 'text-rose-400' },
  { icon: Globe, title: 'Scalable Network', description: 'Built for thousands of concurrent players on Neon serverless Postgres with Redis-powered Socket.io.', color: 'text-purple-400' },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' as const } },
};

export default function FeaturesSection() {
  return (
    <section id="features" className="relative z-10 py-24 sm:py-32 px-4">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <p className="text-indigo-400 text-xs font-semibold uppercase tracking-[0.2em] mb-3">Why Charge Circle</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            Built for speed. Designed for scale.
          </h2>
          <p className="mt-3 text-zinc-400 text-sm max-w-lg mx-auto">
            Every detail engineered for a seamless multiplayer experience.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                variants={cardVariants}
                className="group p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800/40 hover:bg-zinc-900/70 hover:border-zinc-700/60 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-indigo-500/5"
              >
                <div className={`w-10 h-10 rounded-lg bg-zinc-800/80 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 ${feature.color}`}>
                  <Icon size={18} />
                </div>
                <h3 className="text-white font-bold text-sm mb-2">{feature.title}</h3>
                <p className="text-zinc-500 text-xs leading-relaxed">{feature.description}</p>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
