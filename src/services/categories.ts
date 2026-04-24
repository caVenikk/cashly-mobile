import { supabase } from '@/src/lib/supabase';
import { retryOnNetwork } from '@/src/lib/retry';
import type { Category } from '@/src/types/db';

export async function listCategories(): Promise<Category[]> {
  return retryOnNetwork(async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: true });
    if (error) throw error;
    return data ?? [];
  });
}

export async function createCategory(input: { name: string; icon: string; color: string }): Promise<Category> {
  return retryOnNetwork(async () => {
    const { data, error } = await supabase
      .from('categories')
      .insert({ ...input, is_default: false })
      .select('*')
      .single();
    if (error) throw error;
    return data;
  });
}

export async function updateCategory(
  id: string,
  patch: Partial<Pick<Category, 'name' | 'icon' | 'color'>>,
): Promise<Category> {
  return retryOnNetwork(async () => {
    const { data, error } = await supabase.from('categories').update(patch).eq('id', id).select('*').single();
    if (error) throw error;
    return data;
  });
}

export async function deleteCategory(id: string): Promise<void> {
  // Guard: do not delete if expenses reference it.
  const { count, error: cntErr } = await retryOnNetwork(async () => {
    return supabase.from('expenses').select('id', { count: 'exact', head: true }).eq('category_id', id);
  });
  if (cntErr) throw cntErr;
  if ((count ?? 0) > 0) throw new Error('CATEGORY_IN_USE');

  await retryOnNetwork(async () => {
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) throw error;
  });
}
