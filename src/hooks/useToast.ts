import { useCallback } from 'react';
import { useToastStore } from '../store/toastStore';

export function useToast() {
  const push = useToastStore((s) => s.push);

  const success = useCallback(
    (title: string, body?: string) => push({ type: 'success', title, body, durationMs: 4000 }),
    [push],
  );

  const error = useCallback(
    (title: string, body?: string) => push({ type: 'error', title, body, durationMs: 5000 }),
    [push],
  );

  const info = useCallback(
    (title: string, body?: string) => push({ type: 'info', title, body, durationMs: 4000 }),
    [push],
  );

  return { success, error, info };
}
