import { supabase } from '@/src/lib/supabase';
import { retryOnNetwork } from '@/src/lib/retry';
import type { Income, IncomeKind } from '@/src/types/db';

export type IncomeInput = {
  name: string;
  amount: number;
  kind: IncomeKind;
  next_date: string;
  envelope_id?: string | null;
  is_active?: boolean;
};

export async function listIncomes(): Promise<Income[]> {
  return retryOnNetwork(async () => {
    const { data, error } = await supabase
      .from('incomes')
      .select('*')
      .order('kind', { ascending: true })
      .order('is_active', { ascending: false })
      .order('next_date', { ascending: true });
    if (error) throw error;
    return data ?? [];
  });
}

export async function createIncome(input: IncomeInput): Promise<Income> {
  return retryOnNetwork(async () => {
    const { data, error } = await supabase
      .from('incomes')
      .insert({
        name: input.name,
        amount: input.amount,
        kind: input.kind,
        next_date: input.next_date,
        envelope_id: input.envelope_id ?? null,
        is_active: input.is_active ?? true,
      })
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

// Credits the envelope with the income amount. For oneoff: marks the income
// inactive (acts as the "received" flag). For recurring: advances next_date by
// one month — we don't track a period on incomes, so monthly is assumed.
// Null envelope_id falls back to the main envelope.
export async function receiveIncome(inc: Income): Promise<void> {
  const envelopeId = await resolveEnvelopeId(inc.envelope_id);
  if (!envelopeId) throw new Error('NO_ENVELOPE');

  await retryOnNetwork(async () => {
    const { error } = await supabase.rpc('adjust_envelope', {
      env_id: envelopeId,
      delta: Number(inc.amount),
    });
    if (error) throw error;
  });

  if (inc.kind === 'oneoff') {
    await retryOnNetwork(async () => {
      const { error } = await supabase.from('incomes').update({ is_active: false }).eq('id', inc.id);
      if (error) throw error;
    });
  } else {
    const next = advanceMonth(inc.next_date);
    await retryOnNetwork(async () => {
      const { error } = await supabase.from('incomes').update({ next_date: next }).eq('id', inc.id);
      if (error) throw error;
    });
  }
}

// Like receiveIncome but for an income being created with "already received"
// checked at the same time. Saves a round trip by only calling adjust_envelope
// after the row exists with is_active: false.
export async function creditEnvelopeForIncome(envelopeIdRaw: string | null | undefined, amount: number): Promise<void> {
  const envelopeId = await resolveEnvelopeId(envelopeIdRaw ?? null);
  if (!envelopeId) throw new Error('NO_ENVELOPE');
  await retryOnNetwork(async () => {
    const { error } = await supabase.rpc('adjust_envelope', {
      env_id: envelopeId,
      delta: Number(amount),
    });
    if (error) throw error;
  });
}

async function resolveEnvelopeId(envelopeId: string | null): Promise<string | null> {
  if (envelopeId) return envelopeId;
  const { data, error } = await supabase.from('envelopes').select('id').eq('kind', 'main').limit(1).maybeSingle();
  if (error) throw error;
  return data?.id ?? null;
}

function advanceMonth(iso: string): string {
  const d = new Date(iso);
  d.setMonth(d.getMonth() + 1);
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}
