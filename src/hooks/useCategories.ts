import { createCategory, deleteCategory, listCategories, updateCategory } from '@/src/services/categories';
import type { Category } from '@/src/types/db';
import { createEntityStore, useEntity } from '@/src/lib/entityStore';

const store = createEntityStore<Category[]>(listCategories, []);

// Fire a background refresh, swallowing errors. Supabase insert/update/delete
// already returns the authoritative row, so a refetch is just a consistency
// nicety — a flaky follow-up GET (e.g. "TypeError: Load failed" under iOS
// Safari / VPN) must not surface as if the save itself failed.
function refreshInBackground() {
  store.fetch(true).catch(() => undefined);
}

export function useCategories() {
  const { data, loading, error } = useEntity(store);

  const refresh = () => store.fetch(true);
  const create = async (input: { name: string; icon: string; color: string }) => {
    const created = await createCategory(input);
    store.mutate((list) => (list.some((c) => c.id === created.id) ? list : [...list, created]));
    refreshInBackground();
  };
  const update = async (id: string, patch: Partial<Pick<Category, 'name' | 'icon' | 'color'>>) => {
    const updated = await updateCategory(id, patch);
    store.mutate((list) => list.map((c) => (c.id === updated.id ? updated : c)));
    refreshInBackground();
  };
  const remove = async (id: string) => {
    await deleteCategory(id);
    store.mutate((list) => list.filter((c) => c.id !== id));
    refreshInBackground();
  };

  return { categories: data, loading, error, refresh, create, update, remove };
}
