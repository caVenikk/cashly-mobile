import {
  createRecurring,
  deleteRecurring,
  listRecurring,
  payRecurring,
  toggleRecurring,
  type RecurringInput,
} from '@/src/services/recurring';
import type { RecurringPayment } from '@/src/types/db';
import { createEntityStore, useEntity } from '@/src/lib/entityStore';
import { expensesStore } from './useExpenses';
import { envelopesStore } from './useEnvelopes';

const store = createEntityStore<RecurringPayment[]>(listRecurring, []);

export function useRecurring() {
  const { data, loading, error } = useEntity(store);

  const refresh = () => store.fetch(true);
  const create = async (input: RecurringInput) => {
    await createRecurring(input);
    await store.fetch(true);
  };
  const toggle = async (id: string, active: boolean) => {
    await toggleRecurring(id, active);
    await store.fetch(true);
  };
  const remove = async (id: string) => {
    await deleteRecurring(id);
    await store.fetch(true);
  };
  const pay = async (r: RecurringPayment, envelopeId?: string | null) => {
    await payRecurring(r, envelopeId);
    await Promise.all([store.fetch(true), expensesStore.fetch(true), envelopesStore.fetch(true)]);
  };

  return { recurring: data, loading, error, refresh, create, toggle, remove, pay };
}
