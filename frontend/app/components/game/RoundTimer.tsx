'use client';

import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';

export default function RoundTimer({ roundEndsAt }: { roundEndsAt: string | null | undefined }) {
  const [remaining, setRemaining] = useState(() => {
    if (!roundEndsAt) return 0;
    return Math.max(0, Math.floor((new Date(roundEndsAt).getTime() - Date.now()) / 1000));
  });
  const total = Math.max(1, remaining || 60);

  useEffect(() => {
    if (!roundEndsAt) return;

    const endsAt = new Date(roundEndsAt).getTime();
    const id = setInterval(() => {
      const diff = Math.max(0, Math.floor((endsAt - Date.now()) / 1000));
      setRemaining(diff);
    }, 1000);

    return () => clearInterval(id);
  }, [roundEndsAt]);

  if (remaining <= 0) return null;

  const pct = (remaining / total) * 100;

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900/80 border border-zinc-800/50 backdrop-blur-sm">
      <Clock size={14} className={remaining <= 5 ? 'text-rose-400' : remaining <= 10 ? 'text-amber-400' : 'text-zinc-500'} />
      <div className="w-20 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ease-linear ${
            remaining <= 5 ? 'bg-rose-500' : remaining <= 10 ? 'bg-amber-500' : 'bg-emerald-500'
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={`font-mono text-xs font-bold tabular-nums ${
        remaining <= 5 ? 'text-rose-400' : remaining <= 10 ? 'text-amber-400' : 'text-zinc-400'
      }`}>
        {remaining}s
      </span>
    </div>
  );
}
