import { create } from 'zustand';

interface UIState {
  chatOpen: boolean;
  toggleChat: () => void;
  closeAll: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  chatOpen: false,
  toggleChat: () => set((state) => ({ chatOpen: !state.chatOpen })),
  closeAll: () => set({ chatOpen: false }),
}));
