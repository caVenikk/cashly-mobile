import { format, parseISO } from 'date-fns';
import { ru, enUS } from 'date-fns/locale';

export type Lang = 'ru' | 'en';

export function fmt(amount: number, lang: Lang = 'ru', signed = false): string {
  const abs = Math.abs(amount);
  const parts = abs.toFixed(abs % 1 === 0 ? 0 : 2).split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, lang === 'ru' ? ' ' : ',');
  const out = parts.join(lang === 'ru' ? ',' : '.');
  const cur = lang === 'ru' ? '₽' : '$';
  // Always show minus for negative amounts; only show "+" when `signed` is true.
  const sign = amount < 0 ? '−' : signed && amount > 0 ? '+' : '';
  return lang === 'ru' ? `${sign}${out} ${cur}` : `${sign}${cur}${out}`;
}

export function localeOf(lang: Lang) {
  return lang === 'ru' ? ru : enUS;
}

export function fmtDate(iso: string, pattern: string, lang: Lang = 'ru'): string {
  return format(parseISO(iso), pattern, { locale: localeOf(lang) });
}

export function fmtDateObj(d: Date, pattern: string, lang: Lang = 'ru'): string {
  return format(d, pattern, { locale: localeOf(lang) });
}

export function daysBetween(from: Date, to: Date): number {
  const a = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const b = new Date(to.getFullYear(), to.getMonth(), to.getDate());
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

export function daysUntil(iso: string): number {
  return daysBetween(new Date(), parseISO(iso));
}

export function todayIso(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

export function startOfMonthIso(d: Date = new Date()): string {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${d.getFullYear()}-${m}-01`;
}

export function endOfMonthIso(d: Date = new Date()): string {
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  const m = String(end.getMonth() + 1).padStart(2, '0');
  const day = String(end.getDate()).padStart(2, '0');
  return `${end.getFullYear()}-${m}-${day}`;
}
