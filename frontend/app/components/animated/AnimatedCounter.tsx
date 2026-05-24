'use client';

import { useEffect, useState, useRef } from 'react';

interface AnimatedCounterProps {
  value: number;
  suffix?: string;
  duration?: number;
  ease?: boolean;
}

export default function AnimatedCounter({ value, suffix = '', duration = 800, ease = true }: AnimatedCounterProps) {
  const [display, setDisplay] = useState(0);
  const startRef = useRef(0);
  const rafRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const start = startRef.current;
    startRef.current = value;
    const diff = value - start;
    if (diff === 0) return;
    const startTime = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - startTime) / duration, 1);
      const eased = ease ? 1 - Math.pow(1 - p, 3) : p;
      setDisplay(Math.floor(start + diff * eased));
      if (p < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [value, duration, ease]);

  return <span className="font-mono">{display.toLocaleString()}{suffix}</span>;
}
