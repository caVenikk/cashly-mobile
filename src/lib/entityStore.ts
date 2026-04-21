import { useEffect, useSyncExternalStore } from 'react';

type Listener = () => void;

export type EntityState<T> = {
  data: T;
  loading: boolean;
  error: Error | null;
  loaded: boolean;
};

export type EntityStore<T> = {
  get: () => EntityState<T>;
  subscribe: (l: Listener) => () => void;
  fetch: (force?: boolean) => Promise<void>;
  mutate: (mutator: (current: T) => T) => void;
  reset: () => void;
};

// Session gate — auth module wires this up via setSessionGate(() => !!session).
// Default is "allow" so tests and pre-auth-init bootstrap don't block.
let isSessionActive: () => boolean = () => true;
export function setSessionGate(fn: () => boolean): void {
  isSessionActive = fn;
}

// Global registry so auth can reset everything on sign-out and refetch on sign-in
// without knowing about each hook.
const registry = new Set<EntityStore<unknown>>();
export function resetAllStores(): void {
  registry.forEach((s) => s.reset());
}
export function refetchAllStores(): void {
  registry.forEach((s) => {
    s.fetch(true).catch(() => undefined);
  });
}

// After a fetch error, block subsequent automatic fetches for this long.
// User-initiated "force" calls bypass the cooldown.
const ERROR_COOLDOWN_MS = 15_000;

export function createEntityStore<T>(loader: () => Promise<T>, initial: T): EntityStore<T> {
  let state: EntityState<T> = { data: initial, loading: false, error: null, loaded: false };
  const listeners = new Set<Listener>();
  let inflight: Promise<void> | null = null;
  let lastErrorAt = 0;

  const notify = () => {
    for (const l of listeners) l();
  };

  const store: EntityStore<T> = {
    get: () => state,
    subscribe(l) {
      listeners.add(l);
      return () => {
        listeners.delete(l);
      };
    },
    async fetch(force = false) {
      if (!isSessionActive()) return;
      if (!force && state.loaded && !state.error) return;
      if (!force && state.error && Date.now() - lastErrorAt < ERROR_COOLDOWN_MS) return;
      if (inflight) return inflight;
      inflight = (async () => {
        state = { ...state, loading: true, error: null };
        notify();
        try {
          const data = await loader();
          state = { data, loading: false, error: null, loaded: true };
        } catch (e) {
          lastErrorAt = Date.now();
          state = { ...state, loading: false, error: e instanceof Error ? e : new Error(String(e)) };
        } finally {
          notify();
          inflight = null;
        }
      })();
      return inflight;
    },
    mutate(mutator) {
      state = { ...state, data: mutator(state.data) };
      notify();
    },
    reset() {
      state = { data: initial, loading: false, error: null, loaded: false };
      lastErrorAt = 0;
      notify();
    },
  };

  registry.add(store as EntityStore<unknown>);
  return store;
}

export function useEntity<T>(store: EntityStore<T>): EntityState<T> {
  const snap = useSyncExternalStore(store.subscribe, store.get, store.get);
  useEffect(() => {
    store.fetch();
  }, [store]);
  return snap;
}
