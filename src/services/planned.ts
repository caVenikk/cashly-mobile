import { supabase } from '@/src/lib/supabase';
import type { PlannedExpense } from '@/src/types/db';

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

export async function togglePlanned(id: string, done: boolean): Promise<void> {
  const { error } = await supabase.from('planned_expenses').update({ is_done: done }).eq('id', id);
  if (error) throw error;
}

export async function deletePlanned(id: string): Promise<void> {
  const { error } = await supabase.from('planned_expenses').delete().eq('id', id);
  if (error) throw error;
}
