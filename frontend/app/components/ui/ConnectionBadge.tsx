export default function ConnectionBadge({ connected }: { connected: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all ${
      connected
        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
        : 'bg-rose-500/10 text-rose-400 border-rose-500/25 animate-pulse'
    }`}>
      <span className={`h-1.5 w-1.5 rounded-full ${connected ? 'bg-emerald-400' : 'bg-rose-400'}`} />
      {connected ? 'Grid Live' : 'Reconnecting...'}
    </span>
  );
}
