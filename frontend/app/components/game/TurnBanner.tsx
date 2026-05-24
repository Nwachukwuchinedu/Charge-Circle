import { motion, AnimatePresence } from 'framer-motion';

export default function TurnBanner({ isMyTurn, activeNickname }: { isMyTurn: boolean; activeNickname: string }) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -40, opacity: 0 }}
        className={`pointer-events-none absolute left-1/2 -translate-x-1/2 top-4 z-50 px-5 py-2 rounded-full text-sm font-bold shadow-2xl border whitespace-nowrap ${
          isMyTurn
            ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40 shadow-emerald-500/10'
            : 'bg-zinc-900/80 text-zinc-300 border-zinc-700/50 backdrop-blur-sm'
        }`}
      >
        {isMyTurn ? (
          <span className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            YOUR TURN — Click an adjacent tile
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-indigo-400" />
            {activeNickname}'s turn
          </span>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
