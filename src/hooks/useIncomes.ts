import {
  createIncome,
  creditEnvelopeForIncome,
  deleteIncome,
  listIncomes,
  receiveIncome,
  toggleIncome,
  type IncomeInput,
} from '@/src/services/incomes';
import type { Income } from '@/src/types/db';
import { createEntityStore, useEntity } from '@/src/lib/entityStore';
import { envelopesStore } from './useEnvelopes';

const store = createEntityStore<Income[]>(listIncomes, []);

export type CreateIncomeInput = IncomeInput & { already_received?: boolean };

export function useIncomes() {
  const { data, loading, error } = useEntity(store);

  const refresh = () => store.fetch(true);

  const create = async (input: CreateIncomeInput) => {
    const { already_received, ...rest } = input;
    if (already_received) {
      await createIncome({ ...rest, is_active: false });
      await creditEnvelopeForIncome(rest.envelope_id ?? null, rest.amount);
      await Promise.all([store.fetch(true), envelopesStore.fetch(true)]);
    } else {
      await createIncome(rest);
      await store.fetch(true);
    }
  };

  const toggle = async (id: string, active: boolean) => {
    await toggleIncome(id, active);
    await store.fetch(true);
  };

  const remove = async (id: string) => {
    await deleteIncome(id);
    await store.fetch(true);
  };

  const receive = async (inc: Income) => {
    await receiveIncome(inc);
    await Promise.all([store.fetch(true), envelopesStore.fetch(true)]);
  };

  return { incomes: data, loading, error, refresh, create, toggle, remove, receive };
}
