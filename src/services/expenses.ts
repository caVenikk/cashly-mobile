import { supabase } from '@/src/lib/supabase';
import { retryOnNetwork } from '@/src/lib/retry';
import type { Expense } from '@/src/types/db';
import { endOfMonthIso, startOfMonthIso } from '@/src/lib/format';

export type ExpenseInput = {
  amount: number;
  category_id: string | null;
  envelope_id?: string | null;
  note?: string | null;
  date: string;
};

export async function listExpenses(limit = 500): Promise<Expense[]> {
  return retryOnNetwork(async () => {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data ?? [];
  });
}

export async function listExpensesForMonth(ref: Date = new Date()): Promise<Expense[]> {
  return retryOnNetwork(async () => {
    const start = startOfMonthIso(ref);
    const end = endOfMonthIso(ref);
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .gte('date', start)
      .lte('date', end)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data ?? [];
  });
}

export async function createExpense(input: ExpenseInput): Promise<Expense> {
  const data = await retryOnNetwork(async () => {
    const { data, error } = await supabase
      .from('expenses')
      .insert({
        amount: input.amount,
        category_id: input.category_id,
        envelope_id: input.envelope_id ?? null,
        note: input.note ?? null,
        date: input.date,
      })
      .select('*')
      .single();
    if (error) throw error;
    return data as Expense;
  });

  // Best-effort envelope adjustment.
  if (input.envelope_id && input.amount > 0) {
    try {
      await retryOnNetwork(async () => {
        const { error } = await supabase.rpc('adjust_envelope', {
          env_id: input.envelope_id,
          delta: -input.amount,
        });
        if (error) throw error;
      });
    } catch (e) {
      console.warn('[Cashly] adjust_envelope failed:', e);
    }
  }

  return data;
}

export async function updateExpense(id: string, patch: Partial<ExpenseInput>): Promise<Expense> {
  return retryOnNetwork(async () => {
    const { data, error } = await supabase.from('expenses').update(patch).eq('id', id).select('*').single();
    if (error) throw error;
    return data;
  });
}

export async function deleteExpense(id: string): Promise<void> {
  const prev = await retryOnNetwork(async () => {
    const { data, error } = await supabase.from('expenses').select('*').eq('id', id).single();
    if (error) throw error;
    return data as Expense;
  });

  await retryOnNetwork(async () => {
    const { error } = await supabase.from('expenses').delete().eq('id', id);
    if (error) throw error;
  });

  if (prev?.envelope_id && Number(prev.amount) > 0) {
    try {
      await retryOnNetwork(async () => {
        const { error } = await supabase.rpc('adjust_envelope', {
          env_id: prev.envelope_id,
          delta: Number(prev.amount),
        });
        if (error) throw error;
      });
    } catch (e) {
      console.warn('[Cashly] adjust_envelope (reverse) failed:', e);
    }
  }
}
