import { supabase } from '@/src/lib/supabase';
import type { BillCadence, Envelope, EnvelopeKind } from '@/src/types/db';

export type EnvelopeInput = {
  name: string;
  emoji: string;
  color: string;
  kind: EnvelopeKind;
  balance?: number;
  allocated?: number | null;
  monthly_limit?: number | null;
  target?: number | null;
  deadline?: string | null;
  cadence?: BillCadence | null;
  sort_order?: number;
};

export async function listEnvelopes(): Promise<Envelope[]> {
  const { data, error } = await supabase
    .from('envelopes')
    .select('*')
    .order('kind', { ascending: true })
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function createEnvelope(input: EnvelopeInput): Promise<Envelope> {
  if (input.kind === 'main') {
    // Only one main envelope — reject creation, UI should never allow this.
    throw new Error('MAIN_EXISTS');
  }
  const { data, error } = await supabase
    .from('envelopes')
    .insert({
      name: input.name,
      emoji: input.emoji,
      color: input.color,
      kind: input.kind,
      balance: input.balance ?? 0,
      allocated: input.allocated ?? null,
      monthly_limit: input.monthly_limit ?? null,
      target: input.target ?? null,
      deadline: input.deadline ?? null,
      cadence: input.cadence ?? null,
      sort_order: input.sort_order ?? 100,
    })
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function updateEnvelope(id: string, patch: Partial<EnvelopeInput>): Promise<Envelope> {
  const { data, error } = await supabase.from('envelopes').update(patch).eq('id', id).select('*').single();
  if (error) throw error;
  return data;
}

export async function deleteEnvelope(id: string): Promise<void> {
  const { error } = await supabase.from('envelopes').delete().eq('id', id);
  if (error) throw error;
}

export async function allocateEnvelope(fromId: string, toId: string, amount: number): Promise<void> {
  if (amount <= 0) throw new Error('AMOUNT_INVALID');
  const { error } = await supabase.rpc('allocate_envelope', { from_id: fromId, to_id: toId, amount });
  if (error) throw error;
}

export async function seedMainIfMissing(): Promise<void> {
  const { data, error } = await supabase.from('envelopes').select('id').eq('kind', 'main').limit(1);
  if (error) throw error;
  if ((data ?? []).length === 0) {
    await supabase.from('envelopes').insert({
      name: 'Основной счёт',
      emoji: '💳',
      color: '#5AC8FA',
      kind: 'main',
      balance: 0,
      sort_order: 0,
    });
  }
}
