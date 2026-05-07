import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  body?: string;
  durationMs: number;
}

interface ToastState {
  queue: Toast[];
  push: (toast: Omit<Toast, 'id'>) => void;
  dismiss: (id: string) => void;
}

let nextId = 0;

const DEFAULT_DURATIONS: Record<ToastType, number> = {
  success: 4000,
  info: 4000,
  error: 5000,
};

export const useToastStore = create<ToastState>((set) => ({
  queue: [],

  push: (toast) => {
    const id = `toast-${++nextId}`;
    const durationMs = toast.durationMs || DEFAULT_DURATIONS[toast.type];
    set((state) => ({
      queue: [...state.queue, { ...toast, id, durationMs }],
    }));
  },

  dismiss: (id) => {
    set((state) => ({
      queue: state.queue.filter((t) => t.id !== id),
    }));
  },
}));
