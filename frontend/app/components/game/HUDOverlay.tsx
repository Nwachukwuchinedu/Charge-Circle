'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, MessageSquare } from 'lucide-react';
import { useUIStore } from '../../stores/ui.store';

interface HUDOverlayProps {
  side: 'queue' | 'chat';
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

export function HUDToggle({ side, label, icon, count }: { side: 'queue' | 'chat'; label: string; icon: React.ReactNode; count?: number }) {
  const toggle = useUIStore((s) => side === 'queue' ? s.toggleQueue : s.toggleChat);
  const isOpen = useUIStore((s) => side === 'queue' ? s.queueOpen : s.chatOpen);

  return (
    <button
      onClick={toggle}
      className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border cursor-pointer transition-all shadow-lg ${
        isOpen
          ? 'bg-indigo-600 text-white border-indigo-500 shadow-indigo-500/20'
          : 'bg-zinc-900/80 text-zinc-300 border-zinc-700/60 backdrop-blur-sm hover:bg-zinc-800 hover:border-zinc-600'
      }`}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
      {count !== undefined && (
        <span className={`h-5 min-w-[20px] flex items-center justify-center rounded-full text-[10px] font-bold px-1.5 transition-all ${
          side === 'chat'
            ? 'bg-rose-600 text-white animate-pulse shadow-md shadow-rose-600/30'
            : 'bg-zinc-800 text-zinc-400'
        }`}>
          {count}
        </span>
      )}
    </button>
  );
}

export function HUDDrawer({ side, title, icon, children }: HUDOverlayProps) {
  const isOpen = useUIStore((s) => side === 'queue' ? s.queueOpen : s.chatOpen);
  const close = useUIStore((s) => s.closeAll);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
            onClick={close}
          />
          <motion.div
            initial={{ x: 320, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 320, opacity: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-[340px] max-w-[90vw] bg-[#0d0e12] border-l border-zinc-800/60 shadow-2xl flex flex-col"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800/60">
              <div className="flex items-center gap-2 text-indigo-400 font-semibold text-sm">
                {icon}
                {title}
              </div>
              <button onClick={close} className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white cursor-pointer transition-colors">
                <X size={16} />
              </button>
            </div>
            <div className={`flex-1 p-4 min-h-0 ${side === 'chat' ? 'flex flex-col' : 'overflow-y-auto'}`}>
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
