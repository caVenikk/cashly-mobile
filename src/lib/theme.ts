export type ThemeMode = 'dark' | 'light';

export const CashlyTheme = {
  dark: {
    bg: '#0a0a0f',
    surface: 'rgba(28, 28, 34, 0.55)',
    surfaceSolid: '#17171C',
    elevated: 'rgba(44, 44, 52, 0.72)',
    hairline: 'rgba(255,255,255,0.08)',
    text: '#FFFFFF',
    textSecondary: 'rgba(235,235,245,0.65)',
    textTertiary: 'rgba(235,235,245,0.38)',
    tabBg: 'rgba(22, 22, 28, 0.72)',
  },
  light: {
    bg: '#F2F2F7',
    surface: 'rgba(255,255,255,0.7)',
    surfaceSolid: '#FFFFFF',
    elevated: 'rgba(255,255,255,0.88)',
    hairline: 'rgba(0,0,0,0.06)',
    text: '#000000',
    textSecondary: 'rgba(60,60,67,0.72)',
    textTertiary: 'rgba(60,60,67,0.42)',
    tabBg: 'rgba(255,255,255,0.72)',
  },
  accent: {
    income: '#34C759',
    incomeDeep: '#1FA047',
    expense: '#FF6B6B',
    expenseDeep: '#E0484D',
    blue: '#5AC8FA',
    purple: '#AF82FF',
    yellow: '#FFD160',
    orange: '#FF9F43',
    pink: '#FF7AA2',
    teal: '#4FD1C5',
  },
} as const;

export type ThemeTokens = {
  bg: string;
  surface: string;
  surfaceSolid: string;
  elevated: string;
  hairline: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  tabBg: string;
};

export function getTokens(mode: ThemeMode): ThemeTokens {
  return CashlyTheme[mode];
}

export function shade(hex: string, pct: number): string {
  const h = hex.replace('#', '');
  const n = parseInt(h, 16);
  let r = (n >> 16) & 0xff;
  let g = (n >> 8) & 0xff;
  let b = n & 0xff;
  const add = Math.round((255 * pct) / 100);
  r = Math.max(0, Math.min(255, r + add));
  g = Math.max(0, Math.min(255, g + add));
  b = Math.max(0, Math.min(255, b + add));
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

export function alpha(hex: string, a: number): string {
  const h = hex.replace('#', '');
  const n = parseInt(h, 16);
  const r = (n >> 16) & 0xff;
  const g = (n >> 8) & 0xff;
  const b = n & 0xff;
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}
