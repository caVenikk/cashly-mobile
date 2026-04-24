import { supabase } from '@/src/lib/supabase';
import type { PlannedExpense } from '@/src/types/db';
import { todayIso } from '@/src/lib/format';
import { createExpense } from './expenses';

export type PlannedInput = {
  name: string;
  amount: number;
  target_date: string | null;
  category_id: string | null;
};

export async function listPlanned(): Promise<PlannedExpense[]> {
  const { data, error } = await supabase
    .from('planned_expenses')
    .select('*')
    .order('is_done', { ascending: true })
    .order('target_date', { ascending: true, nullsFirst: false });
  if (error) throw error;
  return data ?? [];
}

export async function createPlanned(input: PlannedInput): Promise<PlannedExpense> {
  const { data, error } = await supabase
    .from('planned_expenses')
    .insert({ ...input, is_done: false })
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function updatePlanned(id: string, patch: Partial<PlannedInput>): Promise<PlannedExpense> {
  const { data, error } = await supabase.from('planned_expenses').update(patch).eq('id', id).select('*').single();
  if (error) throw error;
  return data;
}

export async function togglePlanned(id: string, done: boolean): Promise<void> {
  const { error } = await supabase.from('planned_expenses').update({ is_done: done }).eq('id', id);
  if (error) throw error;
}

export async function deletePlanned(id: string): Promise<void> {
  const { error } = await supabase.from('planned_expenses').delete().eq('id', id);
  if (error) throw error;
}

export async function payPlanned(p: PlannedExpense): Promise<void> {
  await createExpense({
    amount: Number(p.amount),
    category_id: p.category_id,
    envelope_id: null,
    note: p.name,
    date: todayIso(),
  });
  const { error } = await supabase.from('planned_expenses').update({ is_done: true }).eq('id', p.id);
  if (error) throw error;
}
