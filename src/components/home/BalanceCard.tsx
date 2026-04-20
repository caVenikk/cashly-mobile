import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Defs, Line, LinearGradient as SvgLinearGradient, Path, Stop } from 'react-native-svg';
import { GlassCard } from '@/src/components/glass/GlassCard';
import { CashlyTheme } from '@/src/lib/theme';
import { useTokens } from '@/src/lib/themeMode';
import { useLang, useT } from '@/src/i18n';
import { fmt, fmtDateObj } from '@/src/lib/format';
import type { Expense, Income } from '@/src/types/db';

type Props = {
  monthExpenses: Expense[];
  incomes: Income[];
};

const WIDTH = 340;
const HEIGHT = 90;

export function BalanceCard({ monthExpenses, incomes }: Props) {
  const { tokens, dark } = useTokens();
  const [lang] = useLang();
  const t = useT();

  const spent = useMemo(() => monthExpenses.reduce((s, e) => s + Number(e.amount), 0), [monthExpenses]);
  const expectedIncome = useMemo(
    () => incomes.filter((i) => i.is_active).reduce((s, i) => s + Number(i.amount), 0),
    [incomes],
  );
  const balance = expectedIncome - spent;

  const chart = useMemo(() => buildBalancePath(monthExpenses, expectedIncome), [monthExpenses, expectedIncome]);

  const positive = balance >= 0;
  const accent = positive ? CashlyTheme.accent.income : CashlyTheme.accent.expense;

  return (
    <GlassCard strong style={{ marginHorizontal: 16, marginTop: 20 }}>
      <View style={{ padding: 22, paddingBottom: 14 }}>
        <View style={styles.headerRow}>
          <Text
            style={{
              fontSize: 13,
              color: tokens.textSecondary,
              fontWeight: '500',
              letterSpacing: 0.6,
              textTransform: 'uppercase',
            }}
          >
            {fmtDateObj(new Date(), 'LLLL yyyy', lang)}
          </Text>
        </View>

        <Text
          style={{ fontSize: 44, fontWeight: '800', color: accent, letterSpacing: -1.5, marginTop: 2, lineHeight: 46 }}
        >
          {fmt(balance, lang, true)}
        </Text>
        <Text style={{ fontSize: 12, color: tokens.textTertiary, marginTop: 2 }}>
          {t('income')} − {t('spent')} = {t('balanceLabel').toLowerCase()}
        </Text>

        <View style={{ marginTop: 16, marginBottom: 4 }}>
          <Svg width="100%" height={HEIGHT} viewBox={`0 0 ${WIDTH} ${HEIGHT}`} preserveAspectRatio="none">
            <Defs>
              <SvgLinearGradient id="balFillPos" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0%" stopColor={CashlyTheme.accent.income} stopOpacity={0.35} />
                <Stop offset="100%" stopColor={CashlyTheme.accent.income} stopOpacity={0} />
              </SvgLinearGradient>
              <SvgLinearGradient id="balFillNeg" x1="0" y1="1" x2="0" y2="0">
                <Stop offset="0%" stopColor={CashlyTheme.accent.expense} stopOpacity={0.35} />
                <Stop offset="100%" stopColor={CashlyTheme.accent.expense} stopOpacity={0} />
              </SvgLinearGradient>
            </Defs>

            {/* Zero baseline */}
            {chart.showZeroLine ? (
              <Line
                x1={0}
                x2={WIDTH}
                y1={chart.zeroY}
                y2={chart.zeroY}
                stroke={tokens.textTertiary}
                strokeWidth={0.8}
                strokeDasharray="3 4"
                opacity={0.6}
              />
            ) : null}

            {/* Positive fill */}
            {chart.posFill ? <Path d={chart.posFill} fill="url(#balFillPos)" /> : null}
            {/* Negative fill */}
            {chart.negFill ? <Path d={chart.negFill} fill="url(#balFillNeg)" /> : null}

            {/* Positive line segments */}
            {chart.posLines.map((d, i) => (
              <Path
                key={`p${i}`}
                d={d}
                fill="none"
                stroke={CashlyTheme.accent.income}
                strokeWidth={2.2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ))}
            {/* Negative line segments */}
            {chart.negLines.map((d, i) => (
              <Path
                key={`n${i}`}
                d={d}
                fill="none"
                stroke={CashlyTheme.accent.expense}
                strokeWidth={2.2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ))}
          </Svg>
        </View>

        <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
          <MiniStat
            label={t('income')}
            amount={expectedIncome}
            color={CashlyTheme.accent.income}
            dark={dark}
            tokens={tokens}
          />
          <MiniStat label={t('spent')} amount={spent} color={CashlyTheme.accent.expense} dark={dark} tokens={tokens} />
        </View>
      </View>
    </GlassCard>
  );
}

function MiniStat({
  label,
  amount,
  color,
  dark,
  tokens,
}: {
  label: string;
  amount: number;
  color: string;
  dark: boolean;
  tokens: ReturnType<typeof useTokens>['tokens'];
}) {
  const [lang] = useLang();
  return (
    <View
      style={{
        flex: 1,
        borderRadius: 18,
        padding: 14,
        paddingVertical: 12,
        backgroundColor: dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)',
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
        <Text style={{ fontSize: 12, color: tokens.textSecondary, fontWeight: '500' }}>{label}</Text>
      </View>
      <Text style={{ fontSize: 17, fontWeight: '700', color: tokens.text, marginTop: 4, letterSpacing: -0.4 }}>
        {fmt(amount, lang)}
      </Text>
    </View>
  );
}

// Build a running-balance chart across the current month.
// Point for each day of the month so far: runningBalance = expectedIncome - cumulativeSpent.
// Splits into positive (green) and negative (coral) segments at the zero crossing.
function buildBalancePath(
  expenses: Expense[],
  expectedIncome: number,
): {
  zeroY: number;
  showZeroLine: boolean;
  posLines: string[];
  negLines: string[];
  posFill: string | null;
  negFill: string | null;
} {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const today = now.getDate();
  const days = Math.max(today, 1);

  const spendByDay = new Array<number>(daysInMonth).fill(0);
  for (const e of expenses) {
    const d = new Date(e.date);
    if (d.getFullYear() !== y || d.getMonth() !== m) continue;
    const idx = d.getDate() - 1;
    if (idx >= 0 && idx < daysInMonth) spendByDay[idx] += Number(e.amount);
  }

  const points: number[] = [];
  let cum = 0;
  for (let i = 0; i < days; i++) {
    cum += spendByDay[i];
    points.push(expectedIncome - cum);
  }

  if (points.length === 1) {
    // Ensure at least 2 points for drawing a line.
    points.push(points[0]);
  }

  const minY = Math.min(0, ...points);
  const maxY = Math.max(0, ...points);
  const range = Math.max(maxY - minY, 1);
  const stepX = WIDTH / (points.length - 1);

  const mapY = (v: number) => HEIGHT - ((v - minY) / range) * HEIGHT;
  const zeroY = mapY(0);
  const showZeroLine = minY < 0 && maxY > 0;

  // Build segments split by zero-axis crossings.
  type Segment = { sign: 'pos' | 'neg' | 'zero'; pts: [number, number][] };
  const segments: Segment[] = [];
  let current: Segment | null = null;

  const coords: [number, number][] = points.map((p, i) => [i * stepX, mapY(p)]);

  for (let i = 0; i < coords.length; i++) {
    const [x, yCoord] = coords[i];
    const v = points[i];
    const sign: Segment['sign'] = v > 0 ? 'pos' : v < 0 ? 'neg' : 'zero';

    if (!current || current.sign !== sign) {
      // If transitioning, insert the zero-crossing point for smooth visual continuity.
      if (current && current.pts.length > 0 && i > 0) {
        const prevV = points[i - 1];
        if ((prevV > 0 && v < 0) || (prevV < 0 && v > 0)) {
          const [px] = coords[i - 1];
          const t = Math.abs(prevV) / (Math.abs(prevV) + Math.abs(v));
          const crossX = px + (x - px) * t;
          current.pts.push([crossX, zeroY]);
          current = { sign, pts: [[crossX, zeroY]] };
          segments.push(current);
        } else {
          current = { sign, pts: [] };
          segments.push(current);
        }
      } else {
        current = { sign, pts: [] };
        segments.push(current);
      }
    }
    current.pts.push([x, yCoord]);
  }

  const posLines: string[] = [];
  const negLines: string[] = [];
  let posFill = '';
  let negFill = '';

  for (const seg of segments) {
    if (seg.pts.length < 2) continue;
    const line = seg.pts.map(([x, yc], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${yc.toFixed(1)}`).join(' ');
    if (seg.sign === 'pos') {
      posLines.push(line);
      const [sx] = seg.pts[0];
      const [ex] = seg.pts[seg.pts.length - 1];
      posFill += `${line} L${ex.toFixed(1)},${zeroY.toFixed(1)} L${sx.toFixed(1)},${zeroY.toFixed(1)} Z `;
    } else if (seg.sign === 'neg') {
      negLines.push(line);
      const [sx] = seg.pts[0];
      const [ex] = seg.pts[seg.pts.length - 1];
      negFill += `${line} L${ex.toFixed(1)},${zeroY.toFixed(1)} L${sx.toFixed(1)},${zeroY.toFixed(1)} Z `;
    }
  }

  return {
    zeroY,
    showZeroLine,
    posLines,
    negLines,
    posFill: posFill.trim() || null,
    negFill: negFill.trim() || null,
  };
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
