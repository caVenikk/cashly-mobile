import { Platform } from 'react-native';
import { useSyncExternalStore } from 'react';

// Stores envelope IDs the user has *excluded* from the balance chart.
// Blacklist semantics mean a newly created envelope is included by default.
const STORAGE_KEY = 'cashly:chart-excluded';
type Listener = () => void;

let excluded: Set<string> = load();
const listeners = new Set<Listener>();

function load(): Set<string> {
  if (Platform.OS !== 'web') return new Set();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw) as unknown;
    return Array.isArray(arr) ? new Set(arr.filter((x): x is string => typeof x === 'string')) : new Set();
  } catch {
    return new Set();
  }
}

function save(s: Set<string>): void {
  if (Platform.OS !== 'web') return;
  try {
    if (s.size === 0) window.localStorage.removeItem(STORAGE_KEY);
    else window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...s]));
  } catch {}
}

function emit(): void {
  listeners.forEach((l) => l());
}

function subscribe(l: Listener): () => void {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

export const chartFilter = {
  getExcluded: (): Set<string> => excluded,
  isVisible: (envelopeId: string | null | undefined): boolean => {
    if (!envelopeId) return true;
    return !excluded.has(envelopeId);
  },
  toggle: (envelopeId: string): void => {
    const next = new Set(excluded);
    if (next.has(envelopeId)) next.delete(envelopeId);
    else next.add(envelopeId);
    excluded = next;
    save(excluded);
    emit();
  },
  setAll: (envelopeIds: string[]): void => {
    // Exclude nothing → all shown.
    excluded = new Set();
    save(excluded);
    emit();
    void envelopeIds;
  },
  setNone: (envelopeIds: string[]): void => {
    excluded = new Set(envelopeIds);
    save(excluded);
    emit();
  },
};

export function useChartExcluded(): Set<string> {
  return useSyncExternalStore(
    subscribe,
    () => excluded,
    () => excluded,
  );
}
