'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Medal, Zap, ChevronRight, X } from 'lucide-react';
import type { LeaderboardEntry as LeaderboardEntryType } from '../../types';

const rankColors = ['text-amber-400', 'text-zinc-300', 'text-amber-700'];

export default function Leaderboard({
  entries,
  userId,
  isOpen,
  onClose,
}: {
  entries: LeaderboardEntryType[];
  userId: string;
  isOpen: boolean;
  onClose?: () => void;
}) {
  return (
    <>
      {/* Desktop sidebar */}
      <AnimatePresence>
        {isOpen && (
          <motion.aside
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            transition={{ type: 'spring', damping: 25, stiffness: 250 }}
            className="hidden md:flex w-72 bg-[#0a0b10]/95 backdrop-blur-xl border-l border-zinc-800/50 h-full overflow-y-auto shrink-0 flex-col"
          >
            <LeaderboardContent entries={entries} userId={userId} />
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Mobile drawer */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
              onClick={onClose}
            />
            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 260 }}
              className="fixed right-0 top-0 bottom-0 z-50 w-[300px] max-w-[85vw] bg-[#0a0b10]/95 backdrop-blur-xl border-l border-zinc-800/50 shadow-2xl flex flex-col md:hidden"
            >
              <div className="flex items-center justify-between p-4 border-b border-zinc-800/40">
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                  <Trophy size={14} className="text-amber-400" />
                  Leaderboard
                </h3>
                {onClose && (
                  <button
                    onClick={onClose}
                    className="p-1 rounded-lg hover:bg-zinc-800/50 text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
                    aria-label="Close leaderboard"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
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
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

function LeaderboardContent({
  entries,
  userId,
}: {
  entries: LeaderboardEntryType[];
  userId: string;
}) {
  return (
    <>
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
    </>
  );
}
