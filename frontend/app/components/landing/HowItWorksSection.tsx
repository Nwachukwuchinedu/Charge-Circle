'use client';

import { motion } from 'framer-motion';
import { UserPlus, Gamepad2, Trophy } from 'lucide-react';

const steps = [
  {
    number: 1,
    icon: UserPlus,
    title: 'Connect',
    description: 'Create an account and join the network. Your node activates instantly — no downloads, no setup.',
    color: 'from-indigo-500 to-indigo-400',
  },
  {
    number: 2,
    icon: Gamepad2,
    title: 'Collaborate',
    description: 'Enter a room with other operators. Take turns moving the Energy Orb one tile at a time across the grid.',
    color: 'from-cyan-500 to-cyan-400',
  },
  {
    number: 3,
    icon: Trophy,
    title: 'Charge',
    description: 'Land on the glowing target to score and spawn a new one. The player with the most charges wins the round.',
    color: 'from-emerald-500 to-emerald-400',
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.2 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 60 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' as const } },
};

export default function HowItWorksSection() {
  return (
    <section className="relative z-10 py-24 sm:py-32 px-4">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <p className="text-indigo-400 text-xs font-semibold uppercase tracking-[0.2em] mb-3">How It Works</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            Three moves to mastery
          </h2>
          <p className="mt-3 text-zinc-400 text-sm max-w-lg mx-auto">
            Simple to learn, endlessly strategic. Here&apos;s how every round flows.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8"
        >
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.number}
                variants={cardVariants}
                className="relative group"
              >
                {/* Step connector line (desktop) */}
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-12 left-[calc(100%+0.5rem)] w-[calc(100%-2rem)] h-px bg-gradient-to-r from-indigo-500/30 to-cyan-500/30" />
                )}

                <div className="h-full p-6 sm:p-8 rounded-2xl bg-zinc-900/50 border border-zinc-800/50 backdrop-blur-sm hover:border-zinc-700/60 transition-all duration-300 hover:-translate-y-1">
                  <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${step.color} shadow-lg mb-5`}>
                    <Icon size={20} className="text-white" />
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-mono text-zinc-600 bg-zinc-800/80 px-2 py-0.5 rounded-full">
                      Step {step.number}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{step.title}</h3>
                  <p className="text-zinc-400 text-sm leading-relaxed">{step.description}</p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
