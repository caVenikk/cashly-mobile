import { createCategory, deleteCategory, listCategories, updateCategory } from '@/src/services/categories';
import type { Category } from '@/src/types/db';
import { createEntityStore, useEntity } from '@/src/lib/entityStore';

const store = createEntityStore<Category[]>(listCategories, []);

export function useCategories() {
  const { data, loading, error } = useEntity(store);

  const refresh = () => store.fetch(true);
  const create = async (input: { name: string; icon: string; color: string }) => {
    await createCategory(input);
    await store.fetch(true);
  };
  const update = async (id: string, patch: Partial<Pick<Category, 'name' | 'icon' | 'color'>>) => {
    await updateCategory(id, patch);
    await store.fetch(true);
  };
  const remove = async (id: string) => {
    await deleteCategory(id);
    await store.fetch(true);
  };

  return { categories: data, loading, error, refresh, create, update, remove };
}
