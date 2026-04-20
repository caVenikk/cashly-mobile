import { useSyncExternalStore } from 'react';

type SheetKey =
  | 'addExpense'
  | 'addRecurring'
  | 'addPlanned'
  | 'addIncome'
  | 'addEnvelope'
  | 'editEnvelope'
  | 'addCategory'
  | 'editCategory'
  | 'income'
  | 'allocate';

type Listener = () => void;

class OpenStore {
  private open = false;
  private listeners = new Set<Listener>();
  getOpen = (): boolean => this.open;
  setOpen = (v: boolean): void => {
    if (v === this.open) return;
    this.open = v;
    this.listeners.forEach((l) => l());
  };
  subscribe = (l: Listener): (() => void) => {
    this.listeners.add(l);
    return () => {
      this.listeners.delete(l);
    };
  };
}

const stores: Record<SheetKey, OpenStore> = {
  addExpense: new OpenStore(),
  addRecurring: new OpenStore(),
  addPlanned: new OpenStore(),
  addIncome: new OpenStore(),
  addEnvelope: new OpenStore(),
  editEnvelope: new OpenStore(),
  addCategory: new OpenStore(),
  editCategory: new OpenStore(),
  income: new OpenStore(),
  allocate: new OpenStore(),
};

let allocateTargetId: string | null = null;
const allocateListeners = new Set<Listener>();

let editEnvelopeId: string | null = null;
const editEnvListeners = new Set<Listener>();

let editCategoryId: string | null = null;
const editCategoryListeners = new Set<Listener>();

export const uiStore = {
  open(key: SheetKey): void {
    stores[key].setOpen(true);
  },
  close(key: SheetKey): void {
    stores[key].setOpen(false);
  },
  openAllocate(targetId?: string | null): void {
    allocateTargetId = targetId ?? null;
    allocateListeners.forEach((l) => l());
    stores.allocate.setOpen(true);
  },
  openEditEnvelope(envId: string): void {
    editEnvelopeId = envId;
    editEnvListeners.forEach((l) => l());
    stores.editEnvelope.setOpen(true);
  },
  openEditCategory(catId: string): void {
    editCategoryId = catId;
    editCategoryListeners.forEach((l) => l());
    stores.editCategory.setOpen(true);
  },
};

export function useSheet(key: SheetKey): { open: boolean; setOpen: (v: boolean) => void } {
  const store = stores[key];
  const open = useSyncExternalStore(store.subscribe, store.getOpen, store.getOpen);
  return { open, setOpen: store.setOpen };
}

export function useAllocateTarget(): string | null {
  return useSyncExternalStore(
    (l) => {
      allocateListeners.add(l);
      return () => {
        allocateListeners.delete(l);
      };
    },
    () => allocateTargetId,
    () => allocateTargetId,
  );
}

export function useEditEnvelopeId(): string | null {
  return useSyncExternalStore(
    (l) => {
      editEnvListeners.add(l);
      return () => {
        editEnvListeners.delete(l);
      };
    },
    () => editEnvelopeId,
    () => editEnvelopeId,
  );
}

export function useEditCategoryId(): string | null {
  return useSyncExternalStore(
    (l) => {
      editCategoryListeners.add(l);
      return () => {
        editCategoryListeners.delete(l);
      };
    },
    () => editCategoryId,
    () => editCategoryId,
  );
}
