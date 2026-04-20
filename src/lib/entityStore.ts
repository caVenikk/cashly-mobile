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

export function createEntityStore<T>(loader: () => Promise<T>, initial: T): EntityStore<T> {
  let state: EntityState<T> = { data: initial, loading: false, error: null, loaded: false };
  const listeners = new Set<Listener>();
  let inflight: Promise<void> | null = null;

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
      if (!force && state.loaded && !state.error) return;
      if (inflight) return inflight;
      inflight = (async () => {
        state = { ...state, loading: true, error: null };
        notify();
        try {
          const data = await loader();
          state = { data, loading: false, error: null, loaded: true };
        } catch (e) {
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
      notify();
    },
  };

  return store;
}

export function useEntity<T>(store: EntityStore<T>): EntityState<T> {
  const snap = useSyncExternalStore(store.subscribe, store.get, store.get);
  useEffect(() => {
    // Trigger initial fetch once per component mount — the store dedupes.
    store.fetch();
  }, [store]);
  return snap;
}
