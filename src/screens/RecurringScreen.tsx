import React, { useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRefresh } from '@/src/hooks/useRefresh';
import { usePullToRefresh } from '@/src/hooks/usePullToRefresh';
import * as Haptics from 'expo-haptics';
import { GlassCard } from '@/src/components/glass/GlassCard';
import { CategoryBadge } from '@/src/components/glass/CategoryBadge';
import { IOSwitch } from '@/src/components/glass/IOSwitch';
import { SegmentedControl } from '@/src/components/glass/SegmentedControl';
import { Icon } from '@/src/components/Icon';
import { SwipeableRow } from '@/src/components/SwipeableRow';
import { CashlyTheme, alpha } from '@/src/lib/theme';
import { useTokens } from '@/src/lib/themeMode';
import { useLang, useT } from '@/src/i18n';
import { fmt, fmtDate, fmtDateObj, daysUntil } from '@/src/lib/format';
import { useRecurring } from '@/src/hooks/useRecurring';
import { useCategories } from '@/src/hooks/useCategories';
import { catById } from '@/src/lib/categoryHelpers';
import type { RecurringPayment } from '@/src/types/db';
import { uiStore } from '@/src/stores/ui';

type Filter = 'all' | 'active' | 'paused';

export function RecurringScreen() {
  const insets = useSafeAreaInsets();
  const { tokens, dark } = useTokens();
  const [lang] = useLang();
  const t = useT();
  const { recurring, toggle, remove, pay, refresh: refreshRec } = useRecurring();
  const { categories, refresh: refreshCat } = useCategories();
  const [filter, setFilter] = useState<Filter>('all');
  const { refreshing, onRefresh } = useRefresh([refreshRec, refreshCat]);
  const pull = usePullToRefresh(onRefresh);

  const active = recurring.filter((r) => r.is_active);
  const paused = recurring.filter((r) => !r.is_active);
  const shown = filter === 'active' ? active : filter === 'paused' ? paused : recurring;
  const monthlyTotal = active.filter((r) => r.period === 'monthly').reduce((s, r) => s + Number(r.amount), 0);
  const yearTotal = monthlyTotal * 12;

  const days = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 14 }, (_, i) => {
      const d = new Date(now);
      d.setDate(d.getDate() + i);
      const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const events = active.filter((r) => r.next_date === iso);
      return { d, events, idx: i };
    });
  }, [active]);

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        {...pull}
        contentContainerStyle={{ paddingTop: insets.top + 6, paddingBottom: 90 }}
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={dark ? '#ffffff' : '#555555'}
            colors={['#555555']}
          />
        }
      >
        <View style={{ paddingHorizontal: 20, paddingVertical: 8 }}>
          <Text style={{ fontSize: 13, color: tokens.textSecondary, fontWeight: '500' }}>
            {fmtDateObj(new Date(), 'LLLL yyyy', lang)}
          </Text>
          <View style={styles.titleRow}>
            <Text style={{ fontSize: 32, fontWeight: '800', color: tokens.text, letterSpacing: -0.8 }}>
              {t('recurringTitle')}
            </Text>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                uiStore.open('addRecurring');
              }}
              style={styles.addBtn}
            >
              <Icon name="plus" color="#fff" size={22} />
            </Pressable>
          </View>
        </View>

        <GlassCard strong style={{ marginHorizontal: 16 }}>
          <View style={{ padding: 20 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
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
                  {t('monthlyTotal')}
                </Text>
                <Text
                  style={{ fontSize: 28, fontWeight: '800', color: tokens.text, letterSpacing: -0.8, marginTop: 2 }}
                >
                  {fmt(monthlyTotal, lang)}
                </Text>
                <Text style={{ fontSize: 12, color: tokens.textSecondary, marginTop: 2 }}>
                  ≈ {fmt(yearTotal, lang)} / {t('yearTotal')}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 6 }}>
                <Chip
                  text={`${active.length} ${t('active').toLowerCase()}`}
                  bg={alpha(CashlyTheme.accent.income, 0.18)}
                  color={CashlyTheme.accent.income}
                />
                {paused.length > 0 ? (
                  <Chip
                    text={`${paused.length} ${t('paused').toLowerCase()}`}
                    bg={dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}
                    color={tokens.textSecondary}
                  />
                ) : null}
              </View>
            </View>

            <View style={{ marginTop: 18 }}>
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: '600',
                  color: tokens.textTertiary,
                  letterSpacing: 0.4,
                  textTransform: 'uppercase',
                  marginBottom: 10,
                }}
              >
                {t('next14')}
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  {days.map(({ d, events, idx }) => {
                    const isToday = idx === 0;
                    return (
                      <View key={idx} style={{ width: 42, alignItems: 'center', gap: 4 }}>
                        <Text style={{ fontSize: 10, color: tokens.textTertiary, fontWeight: '600' }}>
                          {fmtDateObj(d, 'EEEEEE', lang).slice(0, 2)}
                        </Text>
                        <View
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 10,
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: isToday
                              ? CashlyTheme.accent.income
                              : events.length > 0
                                ? dark
                                  ? 'rgba(255,255,255,0.1)'
                                  : 'rgba(0,0,0,0.06)'
                                : 'transparent',
                            borderWidth: events.length > 0 && !isToday ? 1.5 : 0,
                            borderColor:
                              events.length > 0 && !isToday
                                ? catById(categories, events[0].category_id).color
                                : 'transparent',
                          }}
                        >
                          <Text style={{ fontSize: 14, fontWeight: '600', color: isToday ? '#fff' : tokens.text }}>
                            {d.getDate()}
                          </Text>
                        </View>
                        <View style={{ height: 4, flexDirection: 'row', gap: 2 }}>
                          {events.slice(0, 3).map((e, i) => (
                            <View
                              key={i}
                              style={{
                                width: 4,
                                height: 4,
                                borderRadius: 2,
                                backgroundColor: catById(categories, e.category_id).color,
                              }}
                            />
                          ))}
                        </View>
                      </View>
                    );
                  })}
                </View>
              </ScrollView>
            </View>
          </View>
        </GlassCard>

        <View style={{ marginHorizontal: 16, marginTop: 18, marginBottom: 10 }}>
          <SegmentedControl<Filter>
            options={[
              { id: 'all', label: t('all') },
              { id: 'active', label: t('allActive') },
              { id: 'paused', label: t('paused_plural') },
            ]}
            active={filter}
            onChange={setFilter}
          />
        </View>

        <View style={{ marginHorizontal: 16 }}>
          {shown.length === 0 ? (
            <GlassCard radius={22}>
              <View style={{ padding: 28, alignItems: 'center' }}>
                <Text style={{ fontSize: 13, color: tokens.textSecondary }}>{t('emptyRecurring')}</Text>
              </View>
            </GlassCard>
          ) : (
            <GlassCard radius={22}>
              {shown.map((r, i) => (
                <RecurringRow
                  key={r.id}
                  item={r}
                  isLast={i === shown.length - 1}
                  onToggle={() => toggle(r.id, !r.is_active)}
                  onDelete={() => remove(r.id)}
                  onPay={() => pay(r)}
                  categoryColor={catById(categories, r.category_id).color}
                  categoryIcon={catById(categories, r.category_id).icon}
                />
              ))}
            </GlassCard>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function Chip({ text, bg, color }: { text: string; bg: string; color: string }) {
  return (
    <View style={{ paddingVertical: 4, paddingHorizontal: 10, borderRadius: 12, backgroundColor: bg }}>
      <Text style={{ fontSize: 12, fontWeight: '600', color }}>{text}</Text>
    </View>
  );
}

function RecurringRow({
  item,
  isLast,
  onToggle,
  onDelete,
  onPay,
  categoryColor,
  categoryIcon,
}: {
  item: RecurringPayment;
  isLast: boolean;
  onToggle: () => void;
  onDelete: () => void;
  onPay: () => void;
  categoryColor: string;
  categoryIcon: string;
}) {
  const { tokens, dark } = useTokens();
  const [lang] = useLang();
  const t = useT();
  const days = daysUntil(item.next_date);
  const due = days <= 0;

  const actions = (
    <View
      style={{
        width: 62,
        height: '80%',
        borderRadius: 14,
        backgroundColor: CashlyTheme.accent.expense,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Pressable
        onPress={() => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          onDelete();
        }}
        style={{ alignItems: 'center' }}
      >
        <Icon name="trash" color="#fff" size={18} />
        <Text style={{ color: '#fff', fontSize: 11, fontWeight: '600', marginTop: 2 }}>{t('delete')}</Text>
      </Pressable>
    </View>
  );

  const daysLabel = days === 0 ? t('today') : days < 0 ? t('planOverdue') : `${days} ${t('dayShort')}.`;

  return (
    <SwipeableRow rightActions={actions} revealWidth={76}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          paddingHorizontal: 16,
          paddingVertical: 12,
          backgroundColor: item.is_active
            ? dark
              ? 'rgba(28,28,34,0.92)'
              : 'rgba(255,255,255,0.95)'
            : dark
              ? 'rgba(24,24,28,0.95)'
              : 'rgba(245,245,248,0.98)',
          opacity: item.is_active ? 1 : 0.6,
          borderBottomWidth: isLast ? 0 : StyleSheet.hairlineWidth,
          borderBottomColor: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
        }}
      >
        <CategoryBadge color={categoryColor} size={40} radius={13}>
          <Text style={{ fontSize: 20 }}>{categoryIcon}</Text>
        </CategoryBadge>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text numberOfLines={1} style={{ fontSize: 15, fontWeight: '600', color: tokens.text, letterSpacing: -0.2 }}>
            {item.name}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
            <Icon name="calendar" color={tokens.textSecondary} size={10} />
            <Text numberOfLines={1} style={{ fontSize: 11, color: tokens.textSecondary }}>
              {fmtDate(item.next_date, 'd MMM', lang)} ·{' '}
              <Text
                style={{
                  color: due ? CashlyTheme.accent.expense : tokens.textSecondary,
                  fontWeight: due ? '600' : '400',
                }}
              >
                {daysLabel}
              </Text>
            </Text>
          </View>
        </View>
        <View style={{ alignItems: 'flex-end', gap: 4 }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: tokens.text, letterSpacing: -0.3 }}>
            {fmt(Number(item.amount), lang)}
          </Text>
          {item.is_active ? (
            <Pressable
              onPress={() => {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                onPay();
              }}
              hitSlop={4}
              style={{
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 10,
                backgroundColor: due ? CashlyTheme.accent.income : dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
              }}
            >
              <Text style={{ fontSize: 11, fontWeight: '700', color: due ? '#fff' : tokens.text }}>
                {t('markPaid')}
              </Text>
            </Pressable>
          ) : null}
        </View>
        <View style={{ marginLeft: 4 }}>
          <IOSwitch on={item.is_active} onChange={onToggle} />
        </View>
      </View>
    </SwipeableRow>
  );
}

const styles = StyleSheet.create({
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: CashlyTheme.accent.income,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: CashlyTheme.accent.income,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
  },
});
