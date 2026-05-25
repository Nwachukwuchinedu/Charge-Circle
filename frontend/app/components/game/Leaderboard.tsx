'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Medal, Zap, ChevronRight } from 'lucide-react';
import type { LeaderboardEntry as LeaderboardEntryType } from '../../types';

const rankColors = ['text-amber-400', 'text-zinc-300', 'text-amber-700'];

export default function Leaderboard({
  entries,
  userId,
  isOpen,
}: {
  entries: LeaderboardEntryType[];
  userId: string;
  isOpen: boolean;
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, x: 300 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 300 }}
          transition={{ type: 'spring', damping: 25, stiffness: 250 }}
          className="w-72 bg-[#0a0b10]/95 backdrop-blur-xl border-l border-zinc-800/50 h-full overflow-y-auto shrink-0"
        >
          <div className="p-4 border-b border-zinc-800/40">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
              <Trophy size={14} className="text-amber-400" />
              Leaderboard
            </h3>
          </div>

          <div className="p-2 space-y-0.5">
            {entries.map((entry, i) => {
              const isMe = entry.userId === userId;
              return (
                <motion.div
                  key={entry.userId}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                    isMe
                      ? 'bg-indigo-500/15 border border-indigo-500/20'
                      : 'hover:bg-zinc-800/30'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className={`w-5 text-center text-xs font-mono font-bold ${
                      i < 3 ? rankColors[i] : 'text-zinc-600'
                    }`}>
                      {i < 3 ? <Medal size={14} className={rankColors[i]} /> : `#${i + 1}`}
                    </span>
                    <span className={`truncate text-xs ${isMe ? 'text-indigo-200 font-semibold' : 'text-zinc-300'}`}>
                      {entry.nickname}
                    </span>
                    {isMe && <ChevronRight size={10} className="text-indigo-400 shrink-0" />}
                  </div>
                  <span className="font-mono text-xs text-cyan-400 font-bold flex items-center gap-1 shrink-0">
                    <Zap size={10} />
                    {entry.score}
                  </span>
                </motion.div>
              );
            })}

            {entries.length === 0 && (
              <div className="text-center py-8 text-zinc-600 text-xs">
                No players yet
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
