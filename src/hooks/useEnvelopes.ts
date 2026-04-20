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

export function useEnvelopes() {
  const { data, loading, error } = useEntity(store);

  useEffect(() => {
    if (!loading && data.length === 0 && !error) {
      seedMainIfMissing()
        .then(() => store.fetch(true))
        .catch(() => undefined);
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
