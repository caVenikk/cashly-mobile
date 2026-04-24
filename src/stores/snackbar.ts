import { useSyncExternalStore } from 'react';

type SnackbarState = { message: string; type: 'success' | 'error'; id: number };

let state: SnackbarState = { message: '', type: 'success', id: 0 };
const listeners = new Set<() => void>();

export function showSnackbar(message: string, type: 'success' | 'error' = 'success') {
  state = { message, type, id: state.id + 1 };
  listeners.forEach((l) => l());
}

export function useSnackbarState(): SnackbarState {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => state,
    () => state,
  );
}
