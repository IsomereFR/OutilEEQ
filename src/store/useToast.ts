// Notifications éphémères (toast).
import { create } from 'zustand';

interface ToastState {
  msg: string | null;
  show(msg: string): void;
  hide(): void;
}

let timer: ReturnType<typeof setTimeout> | null = null;

export const useToast = create<ToastState>((set) => ({
  msg: null,
  show: (msg) => {
    set({ msg });
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => set({ msg: null }), 1900);
  },
  hide: () => set({ msg: null }),
}));
