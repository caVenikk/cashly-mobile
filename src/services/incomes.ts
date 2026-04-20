import { supabase } from '@/src/lib/supabase';
import { retryOnNetwork } from '@/src/lib/retry';
import type { Income, IncomeKind } from '@/src/types/db';

export type IncomeInput = {
  name: string;
  amount: number;
  kind: IncomeKind;
  next_date: string;
};

export async function listIncomes(): Promise<Income[]> {
  return retryOnNetwork(async () => {
    const { data, error } = await supabase
      .from('incomes')
      .select('*')
      .order('kind', { ascending: true })
      .order('next_date', { ascending: true });
    if (error) throw error;
    return data ?? [];
  });
}

export async function createIncome(input: IncomeInput): Promise<Income> {
  return retryOnNetwork(async () => {
    const { data, error } = await supabase
      .from('incomes')
      .insert({ ...input, is_active: true })
      .select('*')
      .single();
    if (error) throw error;
    return data;
  });
}

export async function toggleIncome(id: string, active: boolean): Promise<void> {
  return retryOnNetwork(async () => {
    const { error } = await supabase.from('incomes').update({ is_active: active }).eq('id', id);
    if (error) throw error;
  });
}

export async function deleteIncome(id: string): Promise<void> {
  return retryOnNetwork(async () => {
    const { error } = await supabase.from('incomes').delete().eq('id', id);
    if (error) throw error;
  });
}
