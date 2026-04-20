import { supabase } from '@/src/lib/supabase';
import { retryOnNetwork } from '@/src/lib/retry';
import type { RecurringPayment, RecurringPeriod } from '@/src/types/db';
import { todayIso } from '@/src/lib/format';
import { createExpense } from './expenses';

export type RecurringInput = {
  name: string;
  amount: number;
  period: RecurringPeriod;
  next_date: string;
  category_id: string | null;
};

export async function listRecurring(): Promise<RecurringPayment[]> {
  return retryOnNetwork(async () => {
    const { data, error } = await supabase
      .from('recurring_payments')
      .select('*')
      .order('is_active', { ascending: false })
      .order('next_date', { ascending: true });
    if (error) throw error;
    return data ?? [];
  });
}

export async function createRecurring(input: RecurringInput): Promise<RecurringPayment> {
  return retryOnNetwork(async () => {
    const { data, error } = await supabase
      .from('recurring_payments')
      .insert({ ...input, is_active: true })
      .select('*')
      .single();
    if (error) throw error;
    return data;
  });
}

export async function toggleRecurring(id: string, active: boolean): Promise<void> {
  return retryOnNetwork(async () => {
    const { error } = await supabase.from('recurring_payments').update({ is_active: active }).eq('id', id);
    if (error) throw error;
  });
}

export async function deleteRecurring(id: string): Promise<void> {
  return retryOnNetwork(async () => {
    const { error } = await supabase.from('recurring_payments').delete().eq('id', id);
    if (error) throw error;
  });
}

export async function payRecurring(r: RecurringPayment, envelopeId?: string | null): Promise<void> {
  await createExpense({
    amount: Number(r.amount),
    category_id: r.category_id,
    envelope_id: envelopeId ?? null,
    note: r.name,
    date: todayIso(),
  });

  const nextDate = advanceDate(r.next_date, r.period);
  await retryOnNetwork(async () => {
    const { error } = await supabase.from('recurring_payments').update({ next_date: nextDate }).eq('id', r.id);
    if (error) throw error;
  });
}

export function advanceDate(iso: string, period: RecurringPeriod): string {
  const d = new Date(iso);
  if (period === 'weekly') d.setDate(d.getDate() + 7);
  else if (period === 'monthly') d.setMonth(d.getMonth() + 1);
  else d.setFullYear(d.getFullYear() + 1);
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}
