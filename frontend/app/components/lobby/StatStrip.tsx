'use client';

import { motion } from 'framer-motion';
import { Zap, Radio, Grid3x3, Activity } from 'lucide-react';
import AnimatedCounter from '../animated/AnimatedCounter';

export interface StatItem {
  label: string;
  value: number;
  suffix?: string;
  icon: 'zap' | 'radio' | 'grid' | 'activity';
  accent: 'indigo' | 'emerald' | 'cyan' | 'amber';
}

const iconMap = { zap: Zap, radio: Radio, grid: Grid3x3, activity: Activity };
const colorMap = {
  indigo: { bg: 'bg-indigo-500/15', text: 'text-indigo-400', icon: '#818cf8' },
  emerald: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', icon: '#34d399' },
  cyan: { bg: 'bg-cyan-500/15', text: 'text-cyan-400', icon: '#22d3ee' },
  amber: { bg: 'bg-amber-500/15', text: 'text-amber-400', icon: '#fbbf24' },
};

export default function StatStrip({ stats }: { stats: StatItem[] }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {stats.map((stat, i) => {
        const Icon = iconMap[stat.icon];
        const c = colorMap[stat.accent];
        return (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08, duration: 0.4 }}
            className="bg-[#0d0e12] border border-zinc-800/50 rounded-xl p-4 flex items-center gap-3"
          >
            <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${c.bg}`}>
              <Icon size={18} color={c.icon} />
            </div>
            <div>
              <div className={`text-lg font-black font-mono ${c.text}`}>
                <AnimatedCounter value={stat.value} suffix={stat.suffix || ''} />
              </div>
              <div className="text-[10px] text-zinc-500 uppercase tracking-wider mt-0.5">{stat.label}</div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
