import {
  allocateEnvelope,
  createEnvelope,
  deleteEnvelope,
  listEnvelopes,
  seedMainIfMissing,
  updateEnvelope,
  type EnvelopeInput,
} from '@/src/services/envelopes';
import type { Envelope } from '@/src/types/db';
import { useEffect } from 'react';
import { createEntityStore, useEntity } from '@/src/lib/entityStore';

const store = createEntityStore<Envelope[]>(listEnvelopes, []);

export const envelopesStore = store;

// Seed guard — 7 components call useEnvelopes(), so without dedupe each mount
// fires its own SELECT+INSERT and easily hits 10+ requests per tab load.
// Shared state at module scope means the seed happens at most once per load
// (plus one retry after cooldown if it fails).
let seedInflight: Promise<void> | null = null;
let seedDone = false;
let seedLastAttemptAt = 0;
const SEED_COOLDOWN_MS = 30_000;

async function seedOnce(): Promise<void> {
  if (seedDone) return;
  if (seedInflight) return seedInflight;
  if (seedLastAttemptAt && Date.now() - seedLastAttemptAt < SEED_COOLDOWN_MS) return;
  seedLastAttemptAt = Date.now();
  seedInflight = seedMainIfMissing()
    .then(() => {
      seedDone = true;
      return store.fetch(true);
    })
    .catch(() => undefined)
    .finally(() => {
      seedInflight = null;
    });
  return seedInflight;
}

export function useEnvelopes() {
  const { data, loading, error } = useEntity(store);

  useEffect(() => {
    if (!loading && data.length === 0 && !error) {
      seedOnce();
    }
  }, [loading, data.length, error]);

  const refresh = () => store.fetch(true);
  const create = async (input: EnvelopeInput) => {
    await createEnvelope(input);
    await store.fetch(true);
  };
  const update = async (id: string, patch: Partial<EnvelopeInput>) => {
    await updateEnvelope(id, patch);
    await store.fetch(true);
  };
  const remove = async (id: string) => {
    await deleteEnvelope(id);
    await store.fetch(true);
  };
  const allocate = async (fromId: string, toId: string, amount: number) => {
    await allocateEnvelope(fromId, toId, amount);
    await store.fetch(true);
  };

  return { envelopes: data, loading, error, refresh, create, update, remove, allocate };
}
