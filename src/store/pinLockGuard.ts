/**
 * Guard for the app-foreground PIN lock.
 *
 * `AuthProvider` re-locks the PIN every time the app returns to the foreground
 * (see `src/providers/AuthProvider.tsx`). Some intentional, in-app actions open
 * a system UI that backgrounds the app — e.g. the document/photo picker
 * (`expo-document-picker`) or opening a URL in the browser (`Linking.openURL`).
 *
 * Without this guard, returning from those flows is treated as a real
 * foreground transition and the user is bounced to the PIN-verify screen,
 * losing their in-progress navigation state (e.g. an MP mid-proof-upload).
 *
 * Wrap such interactions with `runWithoutPinLock` (or use
 * `beginSystemUiInteraction`/`endSystemUiInteraction` manually). The grace
 * window after the interaction ends covers the brief delay between the system
 * UI closing and the `AppState` 'active' event firing.
 */

let activeInteractions = 0;
let graceUntil = 0;

const DEFAULT_GRACE_MS = 2000;

export function beginSystemUiInteraction(): void {
  activeInteractions += 1;
}

export function endSystemUiInteraction(graceMs: number = DEFAULT_GRACE_MS): void {
  activeInteractions = Math.max(0, activeInteractions - 1);
  graceUntil = Date.now() + graceMs;
}

/**
 * True while a system-UI interaction is in progress, or within the grace window
 * just after one ended. `AuthProvider` checks this before re-locking the PIN.
 */
export function isPinLockSuppressed(): boolean {
  return activeInteractions > 0 || Date.now() < graceUntil;
}

/**
 * Runs an async action that opens a system UI, suppressing the foreground PIN
 * lock for its duration plus a short grace window.
 */
export async function runWithoutPinLock<T>(
  action: () => Promise<T>,
  graceMs: number = DEFAULT_GRACE_MS
): Promise<T> {
  beginSystemUiInteraction();
  try {
    return await action();
  } finally {
    endSystemUiInteraction(graceMs);
  }
}
