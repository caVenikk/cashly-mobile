import { useMemo } from 'react';
import { createExpense, deleteExpense, listExpenses, updateExpense, type ExpenseInput } from '@/src/services/expenses';
import type { Expense } from '@/src/types/db';
import { createEntityStore, useEntity } from '@/src/lib/entityStore';
import { envelopesStore } from './useEnvelopes';

const store = createEntityStore<Expense[]>(() => listExpenses(500), []);

// Exposed so other hooks/services can trigger a refresh after mutating expenses.
export const expensesStore = store;

export function useExpenses() {
  const { data, loading, error } = useEntity(store);

  const refresh = () => store.fetch(true);
  const create = async (input: ExpenseInput) => {
    try {
      await createExpense(input);
    } finally {
      await Promise.all([store.fetch(true), envelopesStore.fetch(true)]);
    }
  };
  const update = async (id: string, patch: Partial<ExpenseInput>) => {
    try {
      await updateExpense(id, patch);
    } finally {
      await store.fetch(true);
    }
  };
  const remove = async (id: string) => {
    try {
      await deleteExpense(id);
    } finally {
      await Promise.all([store.fetch(true), envelopesStore.fetch(true)]);
    }
  };

  return { expenses: data, loading, error, refresh, create, update, remove };
}

// Derived from the shared expenses store — reactive to any add/delete.
export function useMonthExpenses(ref?: Date) {
  const { data, loading, error } = useEntity(store);
  const refDate = ref ?? new Date();
  const y = refDate.getFullYear();
  const m = refDate.getMonth();

  const expenses = useMemo(() => {
    return data.filter((e) => {
      const d = new Date(e.date);
      return d.getFullYear() === y && d.getMonth() === m;
    });
  }, [data, y, m]);

  return { expenses, loading, error, refresh: () => store.fetch(true) };
}
