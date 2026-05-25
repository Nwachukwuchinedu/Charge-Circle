'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useToastStore, type Toast, type ToastVariant } from '../../stores/toast.store';

const variantConfig: Record<ToastVariant, { bg: string; border: string; text: string; Icon: React.ElementType }> = {
  success: {
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    text: 'text-emerald-400',
    Icon: CheckCircle,
  },
  error: {
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/30',
    text: 'text-rose-400',
    Icon: XCircle,
  },
  warning: {
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    text: 'text-amber-400',
    Icon: AlertTriangle,
  },
  info: {
    bg: 'bg-indigo-500/10',
    border: 'border-indigo-500/30',
    text: 'text-indigo-400',
    Icon: Info,
  },
};

function ToastItem({ toast }: { toast: Toast }) {
  const removeToast = useToastStore((s) => s.removeToast);
  const { bg, border, text, Icon } = variantConfig[toast.variant];

  useEffect(() => {
    const timer = setTimeout(() => removeToast(toast.id), toast.duration);
    return () => clearTimeout(timer);
  }, [toast.duration, toast.id, removeToast]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 80, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 80, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
      onClick={() => removeToast(toast.id)}
      role="alert"
      aria-live="polite"
      className={`flex items-start gap-2.5 px-4 py-3 rounded-xl border ${bg} ${border} backdrop-blur-md cursor-pointer select-none w-80 shadow-xl shadow-black/20`}
    >
      <Icon size={16} className={`${text} mt-0.5 shrink-0`} />
      <p className={`flex-1 text-xs font-medium leading-relaxed ${text}`}>
        {toast.message}
      </p>
      <button
        onClick={(e) => { e.stopPropagation(); removeToast(toast.id); }}
        className={`p-0.5 rounded ${text} hover:opacity-70 transition-opacity shrink-0`}
        aria-label="Dismiss notification"
      >
        <X size={14} />
      </button>
    </motion.div>
  );
}

export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto">
            <ToastItem toast={t} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}

function trigger(message: string, duration?: number): string;
function trigger(message: string, variant?: ToastVariant, duration?: number): string;
function trigger(message: string, variantOrDuration?: ToastVariant | number, duration?: number): string {
  if (typeof variantOrDuration === 'number') {
    return useToastStore.getState().addToast(message, 'info', variantOrDuration);
  }
  return useToastStore.getState().addToast(message, variantOrDuration ?? 'info', duration);
}

trigger.success = (message: string, duration?: number) =>
  useToastStore.getState().addToast(message, 'success', duration);
trigger.error = (message: string, duration?: number) =>
  useToastStore.getState().addToast(message, 'error', duration);
trigger.warning = (message: string, duration?: number) =>
  useToastStore.getState().addToast(message, 'warning', duration);

export const toast = trigger as typeof trigger & {
  success: (message: string, duration?: number) => string;
  error: (message: string, duration?: number) => string;
  warning: (message: string, duration?: number) => string;
};
