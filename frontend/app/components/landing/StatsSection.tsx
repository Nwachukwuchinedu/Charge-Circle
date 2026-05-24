'use client';

import { useRef } from 'react';
import { motion } from 'framer-motion';
import { Zap, Users, Activity, MapPin } from 'lucide-react';
import AnimatedCounter from '../animated/AnimatedCounter';

const stats = [
  { icon: Zap, label: 'Games Played', target: 10473, suffix: '+' },
  { icon: Users, label: 'Active Operators', target: 1240, suffix: '+' },
  { icon: Activity, label: 'Grid Uptime', target: 999, suffix: '%' },
  { icon: MapPin, label: 'Countries', target: 24, suffix: '' },
];

function CounterWrapper({ target, suffix }: { target: number; suffix: string }) {
  const ref = useRef<HTMLDivElement>(null);

  return (
    <div ref={ref} className="text-center">
      <p className="text-3xl sm:text-4xl font-black text-white font-mono tracking-tight">
        <AnimatedCounter value={target} suffix={suffix} duration={2000} />
      </p>
    </div>
  );
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' as const } },
};

export default function StatsSection() {
  return (
    <section className="relative z-10 py-20 sm:py-28 px-4">
      <div className="max-w-5xl mx-auto">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12"
        >
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                variants={itemVariants}
                className="flex flex-col items-center gap-2"
              >
                <Icon size={20} className="text-indigo-400" />
                <CounterWrapper target={stat.target} suffix={stat.suffix} />
                <p className="text-zinc-500 text-xs font-medium uppercase tracking-wider">{stat.label}</p>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
