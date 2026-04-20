import type { Category } from '@/src/types/db';

export const FALLBACK_CATEGORY: Category = {
  id: '__none__',
  name: 'Прочее',
  icon: '📦',
  color: '#B0B0B0',
  is_default: true,
  created_at: '',
};

export function catById(categories: Category[], id: string | null | undefined): Category {
  if (!id) return FALLBACK_CATEGORY;
  return categories.find((c) => c.id === id) ?? FALLBACK_CATEGORY;
}
