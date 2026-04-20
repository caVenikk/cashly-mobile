import { createPlanned, deletePlanned, listPlanned, togglePlanned, type PlannedInput } from '@/src/services/planned';
import type { PlannedExpense } from '@/src/types/db';
import { createEntityStore, useEntity } from '@/src/lib/entityStore';

const store = createEntityStore<PlannedExpense[]>(listPlanned, []);

export function usePlanned() {
  const { data, loading, error } = useEntity(store);

  const refresh = () => store.fetch(true);
  const create = async (input: PlannedInput) => {
    await createPlanned(input);
    await store.fetch(true);
  };
  const toggle = async (id: string, done: boolean) => {
    await togglePlanned(id, done);
    await store.fetch(true);
  };
  const remove = async (id: string) => {
    await deletePlanned(id);
    await store.fetch(true);
  };

  return { planned: data, loading, error, refresh, create, toggle, remove };
}
