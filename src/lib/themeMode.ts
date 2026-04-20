import { useSyncExternalStore } from 'react';
import type { ThemeMode, ThemeTokens } from './theme';
import { getTokens } from './theme';

type Listener = () => void;

let mode: ThemeMode = 'dark';
const listeners = new Set<Listener>();

export const themeStore = {
  get: (): ThemeMode => mode,
  set: (next: ThemeMode): void => {
    if (next === mode) return;
    mode = next;
    listeners.forEach((l) => l());
  },
  toggle: (): void => themeStore.set(mode === 'dark' ? 'light' : 'dark'),
  subscribe: (l: Listener): (() => void) => {
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  },
};

export function useThemeMode(): [ThemeMode, (next: ThemeMode) => void] {
  const m = useSyncExternalStore(themeStore.subscribe, themeStore.get, themeStore.get);
  return [m, themeStore.set];
}

export function useTokens(): { mode: ThemeMode; tokens: ThemeTokens; dark: boolean } {
  const [m] = useThemeMode();
  return { mode: m, tokens: getTokens(m), dark: m === 'dark' };
}
