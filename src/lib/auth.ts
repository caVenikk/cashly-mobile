import { useSyncExternalStore } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { refetchAllStores, resetAllStores, setSessionGate } from './entityStore';

type Listener = () => void;

let session: Session | null = null;
let ready = false;
const listeners = new Set<Listener>();

// Stores won't fire HTTP calls when we don't have a session — this kills the
// anon request storm that happens when many hooks mount simultaneously.
setSessionGate(() => session !== null);

function emit() {
  listeners.forEach((l) => l());
}

function applySession(next: Session | null) {
  const wasAuthed = session !== null;
  const isAuthed = next !== null;
  session = next;
  if (!ready) ready = true;
  emit();
  if (!wasAuthed && isAuthed) {
    refetchAllStores();
  } else if (wasAuthed && !isAuthed) {
    resetAllStores();
  }
}

supabase.auth.getSession().then(({ data }) => {
  applySession(data.session);
});

supabase.auth.onAuthStateChange((_event, next) => {
  applySession(next);
});

function subscribe(l: Listener): () => void {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

export function useSession(): Session | null {
  return useSyncExternalStore(
    subscribe,
    () => session,
    () => session,
  );
}

export function useAuthReady(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => ready,
    () => ready,
  );
}

export async function signIn(email: string, password: string): Promise<void> {
  const { error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });
  if (error) throw error;
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}
