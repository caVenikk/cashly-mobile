import { createIncome, deleteIncome, listIncomes, toggleIncome, type IncomeInput } from '@/src/services/incomes';
import type { Income } from '@/src/types/db';
import { createEntityStore, useEntity } from '@/src/lib/entityStore';

const store = createEntityStore<Income[]>(listIncomes, []);

export function useIncomes() {
  const { data, loading, error } = useEntity(store);

  const refresh = () => store.fetch(true);
  const create = async (input: IncomeInput) => {
    await createIncome(input);
    await store.fetch(true);
  };
  const toggle = async (id: string, active: boolean) => {
    await toggleIncome(id, active);
    await store.fetch(true);
  };
  const remove = async (id: string) => {
    await deleteIncome(id);
    await store.fetch(true);
  };

  return { incomes: data, loading, error, refresh, create, toggle, remove };
}
