import { create } from 'zustand';

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  message: string;
  variant: ToastVariant;
  duration: number;
}

interface ToastState {
  toasts: Toast[];
  addToast: (message: string, variant: ToastVariant, duration?: number) => string;
  removeToast: (id: string) => void;
}

let counter = 0;

function nextId(): string {
  counter += 1;
  return `toast-${counter}-${Date.now()}`;
}

const MAX_VISIBLE = 5;

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  addToast: (message, variant, duration = 4000) => {
    const id = nextId();
    set((state) => ({
      toasts: [...state.toasts.slice(-(MAX_VISIBLE - 1)), { id, message, variant, duration }],
    }));
    return id;
  },
  removeToast: (id) => {
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
  },
}));
