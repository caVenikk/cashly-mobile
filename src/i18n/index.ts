import { useSyncExternalStore } from 'react';
import { ru, type StringKey } from './ru';
import { en } from './en';

export type Lang = 'ru' | 'en';

const STRINGS: Record<Lang, Record<StringKey, string>> = { ru, en };

type Listener = () => void;

let currentLang: Lang = 'ru';
const listeners = new Set<Listener>();

export const langStore = {
  get: (): Lang => currentLang,
  set: (next: Lang): void => {
    if (next === currentLang) return;
    currentLang = next;
    listeners.forEach((l) => l());
  },
  subscribe: (l: Listener): (() => void) => {
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  },
};

export function useLang(): [Lang, (next: Lang) => void] {
  const lang = useSyncExternalStore(langStore.subscribe, langStore.get, langStore.get);
  return [lang, langStore.set];
}

export function t(lang: Lang, key: StringKey): string {
  return STRINGS[lang]?.[key] ?? String(key);
}

export function useT(): (key: StringKey) => string {
  const [lang] = useLang();
  return (key: StringKey) => t(lang, key);
}
