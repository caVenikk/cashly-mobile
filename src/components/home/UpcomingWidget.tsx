import React, { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { GlassCard } from '@/src/components/glass/GlassCard';
import { CategoryBadge } from '@/src/components/glass/CategoryBadge';
import { CategoryIcon } from '@/src/components/CategoryIcon';
import { Icon } from '@/src/components/Icon';
import { CashlyTheme } from '@/src/lib/theme';
import { useTokens } from '@/src/lib/themeMode';
import { useLang, useT } from '@/src/i18n';
import { fmt, daysUntil } from '@/src/lib/format';
import type { Category, RecurringPayment } from '@/src/types/db';
import { catById } from '@/src/lib/categoryHelpers';

type Props = {
  recurring: RecurringPayment[];
  categories: Category[];
  onSeeAll: () => void;
};

export function UpcomingWidget({ recurring, categories, onSeeAll }: Props) {
  const { tokens, dark } = useTokens();
  const [lang] = useLang();
  const t = useT();

  const active = useMemo(() => recurring.filter((r) => r.is_active), [recurring]);
  const monthlyTotal = active.filter((r) => r.period === 'monthly').reduce((s, r) => s + Number(r.amount), 0);
  const upcoming = [...active].sort((a, b) => daysUntil(a.next_date) - daysUntil(b.next_date)).slice(0, 3);

  if (active.length === 0) return null;

  return (
    <GlassCard style={{ marginHorizontal: 16, marginTop: 18 }}>
      <View style={{ padding: 18 }}>
        <View style={styles.headerRow}>
          <View>
            <Text
              style={{
                fontSize: 11,
                color: tokens.textTertiary,
                fontWeight: '600',
                letterSpacing: 0.4,
                textTransform: 'uppercase',
              }}
            >
              {t('upcoming')}
            </Text>
            <Text style={{ fontSize: 17, fontWeight: '700', color: tokens.text, letterSpacing: -0.3 }}>
              {fmt(monthlyTotal, lang)}{' '}
              <Text style={{ fontSize: 13, fontWeight: '500', color: tokens.textSecondary }}>· {t('thisMonth')}</Text>
            </Text>
          </View>
          <Pressable
            onPress={onSeeAll}
            style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', opacity: pressed ? 0.6 : 1 })}
          >
            <Text style={{ fontSize: 13, fontWeight: '600', color: CashlyTheme.accent.income, marginRight: 2 }}>
              {t('seeAll')}
            </Text>
            <Icon name="chevRight" color={CashlyTheme.accent.income} size={12} />
          </Pressable>
        </View>

        <View style={{ flexDirection: 'row', gap: 8, marginTop: 14 }}>
          {upcoming.map((r) => {
            const c = catById(categories, r.category_id);
            return (
              <View
                key={r.id}
                style={{
                  flex: 1,
                  borderRadius: 16,
                  padding: 10,
                  backgroundColor: dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                  borderWidth: StyleSheet.hairlineWidth,
                  borderColor: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                  gap: 8,
                }}
              >
                <CategoryBadge color={c.color} size={30}>
                  <CategoryIcon icon={c.icon} size={14} />
                </CategoryBadge>
                <Text style={{ fontSize: 11, color: tokens.textSecondary, fontWeight: '500' }}>
                  {daysUntil(r.next_date) === 0 ? t('today') : `${daysUntil(r.next_date)} ${t('dayShort')}.`}
                </Text>
                <Text style={{ fontSize: 13, fontWeight: '700', color: tokens.text }}>
                  {fmt(Number(r.amount), lang)}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
