import { create } from 'zustand';

interface UIState {
  queueOpen: boolean;
  chatOpen: boolean;
  toggleQueue: () => void;
  toggleChat: () => void;
  closeAll: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  queueOpen: false,
  chatOpen: false,
  toggleQueue: () => set((s) => ({ queueOpen: !s.queueOpen, chatOpen: false })),
  toggleChat: () => set((s) => ({ chatOpen: !s.chatOpen, queueOpen: false })),
  closeAll: () => set({ queueOpen: false, chatOpen: false }),
}));
