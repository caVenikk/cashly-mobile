import React, { useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { GlassCard } from '@/src/components/glass/GlassCard';
import { CategoryBadge } from '@/src/components/glass/CategoryBadge';
import { CategoryIcon } from '@/src/components/CategoryIcon';
import { SegmentedControl } from '@/src/components/glass/SegmentedControl';
import { MonthCalendar, type CalendarEvent } from '@/src/components/MonthCalendar';
import { SwipeableRow } from '@/src/components/SwipeableRow';
import { Icon } from '@/src/components/Icon';
import { CashlyTheme, alpha } from '@/src/lib/theme';
import { useTokens } from '@/src/lib/themeMode';
import { useLang, useT } from '@/src/i18n';
import { fmt, fmtDate, daysUntil, todayIso } from '@/src/lib/format';
import { useRecurring } from '@/src/hooks/useRecurring';
import { usePlanned } from '@/src/hooks/usePlanned';
import { useCategories } from '@/src/hooks/useCategories';
import { useIncomes } from '@/src/hooks/useIncomes';
import { useRefresh } from '@/src/hooks/useRefresh';
import { catById } from '@/src/lib/categoryHelpers';
import { uiStore } from '@/src/stores/ui';
import { showSnackbar } from '@/src/stores/snackbar';
import { errorMessage } from '@/src/lib/errors';
import type { RecurringPeriod } from '@/src/types/db';

type Filter = 'all' | 'recurring' | 'oneoff';
type ViewMode = 'list' | 'calendar';

type Entry = {
  id: string;
  kind: 'recurring' | 'oneoff';
  direction: 'in' | 'out';
  name: string;
  amount: number;
  date: string;
  inDays: number;
  categoryId: string | null;
  plannedId?: string;
  isDone?: boolean;
};

export function PlansScreen() {
  const insets = useSafeAreaInsets();
  const { tokens, dark } = useTokens();
  const [lang] = useLang();
  const t = useT();
  const { recurring, refresh: refreshRec } = useRecurring();
  const { planned, refresh: refreshPl, pay: payPlan, remove: removePlan } = usePlanned();
  const { categories, refresh: refreshCat } = useCategories();
  const { incomes, refresh: refreshInc } = useIncomes();
  const [filter, setFilter] = useState<Filter>('all');
  const [view, setView] = useState<ViewMode>('list');
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const { refreshing, onRefresh } = useRefresh([refreshRec, refreshPl, refreshCat, refreshInc]);

  const horizonEnd = useMemo(() => {
    const d = new Date(calendarMonth);
    d.setMonth(d.getMonth() + 1, 0);
    d.setHours(23, 59, 59, 999);
    return d;
  }, [calendarMonth]);

  const horizonStart = useMemo(() => {
    const d = new Date(calendarMonth);
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
  }, [calendarMonth]);

  const projectedEntries = useMemo<Entry[]>(() => {
    const out: Entry[] = [];

    for (const r of recurring) {
      if (!r.is_active) continue;
      const occurrences = projectRecurrence(r.next_date, r.period, horizonEnd);
      for (const iso of occurrences) {
        out.push({
          id: `r:${r.id}:${iso}`,
          kind: 'recurring',
          direction: 'out',
          name: r.name,
          amount: Number(r.amount),
          date: iso,
          inDays: daysUntil(iso),
          categoryId: r.category_id,
        });
      }
    }

    for (const p of planned) {
      if (!p.target_date) continue;
      out.push({
        id: `p:${p.id}`,
        kind: 'oneoff',
        direction: 'out',
        name: p.name,
        amount: Number(p.amount),
        date: p.target_date,
        inDays: daysUntil(p.target_date),
        categoryId: p.category_id,
        plannedId: p.id,
        isDone: p.is_done,
      });
    }

    // Planned incomes: active recurring (projected forward, monthly cadence)
    // plus unreceived oneoffs (is_active=true means "not yet received").
    for (const inc of incomes) {
      if (!inc.is_active) continue;
      if (inc.kind === 'recurring') {
        const occurrences = projectRecurrence(inc.next_date, 'monthly', horizonEnd);
        for (const iso of occurrences) {
          out.push({
            id: `in:${inc.id}:${iso}`,
            kind: 'recurring',
            direction: 'in',
            name: inc.name,
            amount: Number(inc.amount),
            date: iso,
            inDays: daysUntil(iso),
            categoryId: null,
          });
        }
      } else {
        out.push({
          id: `in:${inc.id}`,
          kind: 'oneoff',
          direction: 'in',
          name: inc.name,
          amount: Number(inc.amount),
          date: inc.next_date,
          inDays: daysUntil(inc.next_date),
          categoryId: null,
        });
      }
    }

    return out.sort((a, b) => a.date.localeCompare(b.date));
  }, [recurring, planned, incomes, horizonEnd]);

  const filtered = useMemo(() => {
    const f = filter === 'all' ? projectedEntries : projectedEntries.filter((e) => e.kind === filter);
    return f;
  }, [projectedEntries, filter]);

  const forList = useMemo(() => {
    if (view !== 'list')
      return filtered.filter((e) => e.date >= isoDate(horizonStart) && e.date <= isoDate(horizonEnd));
    return filtered;
  }, [filtered, view, horizonStart, horizonEnd]);

  const monthList = useMemo(() => {
    if (!selectedDay) return filtered.filter((e) => e.date >= isoDate(horizonStart) && e.date <= isoDate(horizonEnd));
    return filtered.filter((e) => e.date === selectedDay);
  }, [filtered, selectedDay, horizonStart, horizonEnd]);

  const calendarEvents = useMemo<CalendarEvent[]>(() => {
    return filtered.map((e) => ({
      id: e.id,
      date: e.date,
      color: e.direction === 'in' ? CashlyTheme.accent.income : catById(categories, e.categoryId).color,
    }));
  }, [filtered, categories]);

  const totalSpending = forList.filter((e) => e.direction === 'out').reduce((s, e) => s + e.amount, 0);
  const totalIncoming = forList.filter((e) => e.direction === 'in').reduce((s, e) => s + e.amount, 0);
  const recurCount = projectedEntries.filter((e) => e.kind === 'recurring').length;
  const oneoffCount = projectedEntries.filter((e) => e.kind === 'oneoff').length;

  const thisWeek = forList.filter((e) => e.inDays <= 7 && e.inDays >= 0);
  const later = forList.filter((e) => e.inDays > 7);

  const onPlanPay = async (plannedId: string) => {
    const p = planned.find((x) => x.id === plannedId);
    if (!p) return;
    try {
      await payPlan(p);
      showSnackbar(t('snackPaid'));
    } catch (e) {
      showSnackbar(errorMessage(e), 'error');
    }
  };

  const onPlanDelete = async (plannedId: string) => {
    try {
      await removePlan(plannedId);
      showSnackbar(t('snackDeleted'));
    } catch (e) {
      showSnackbar(errorMessage(e), 'error');
    }
  };

  return (
    <View style={{ flex: 1, paddingTop: insets.top + 6 }}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 90 }}
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
        <View
          style={{
            paddingHorizontal: 20,
            paddingVertical: 8,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <View>
            <Text style={{ fontSize: 13, color: tokens.textSecondary, fontWeight: '500' }}>
              {lang === 'ru' ? 'Календарь расходов' : 'Expense calendar'}
            </Text>
            <Text style={{ fontSize: 32, fontWeight: '800', color: tokens.text, letterSpacing: -0.8 }}>
              {t('plansTitle')}
            </Text>
          </View>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              uiStore.open('addPlanned');
            }}
            style={styles.addBtn}
          >
            <Icon name="plus" color="#fff" size={22} />
          </Pressable>
        </View>

        <View style={{ marginHorizontal: 16, marginBottom: 12 }}>
          <SegmentedControl<ViewMode>
            options={[
              { id: 'list', label: lang === 'ru' ? 'Список' : 'List' },
              { id: 'calendar', label: lang === 'ru' ? 'Календарь' : 'Calendar' },
            ]}
            active={view}
            onChange={(v) => {
              setView(v);
              if (v === 'list') setSelectedDay(null);
            }}
          />
        </View>

        {view === 'calendar' ? (
          <GlassCard strong style={{ marginHorizontal: 16, marginBottom: 16 }}>
            <View style={{ padding: 16 }}>
              <MonthCalendar
                month={calendarMonth}
                events={calendarEvents}
                onPrev={() => {
                  setCalendarMonth((m) => {
                    const d = new Date(m);
                    d.setMonth(d.getMonth() - 1, 1);
                    return d;
                  });
                  setSelectedDay(null);
                }}
                onNext={() => {
                  setCalendarMonth((m) => {
                    const d = new Date(m);
                    d.setMonth(d.getMonth() + 1, 1);
                    return d;
                  });
                  setSelectedDay(null);
                }}
                onToday={() => {
                  setCalendarMonth(new Date());
                  setSelectedDay(null);
                }}
                onSelectDay={(iso) => setSelectedDay(selectedDay === iso ? null : iso)}
                selectedDay={selectedDay}
              />
            </View>
          </GlassCard>
        ) : (
          <GlassCard strong style={{ marginHorizontal: 16, marginBottom: 16 }}>
            <View style={{ padding: 20 }}>
              <Text
                style={{
                  fontSize: 11,
                  color: tokens.textTertiary,
                  fontWeight: '600',
                  letterSpacing: 0.4,
                  textTransform: 'uppercase',
                }}
              >
                {t('plansForMonth')}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 14, marginTop: 2, flexWrap: 'wrap' }}>
                {totalIncoming > 0 ? (
                  <Text
                    style={{
                      fontSize: 26,
                      fontWeight: '800',
                      color: CashlyTheme.accent.income,
                      letterSpacing: -0.6,
                    }}
                  >
                    + {fmt(totalIncoming, lang)}
                  </Text>
                ) : null}
                {totalSpending > 0 ? (
                  <Text
                    style={{
                      fontSize: 26,
                      fontWeight: '800',
                      color: CashlyTheme.accent.expense,
                      letterSpacing: -0.6,
                    }}
                  >
                    − {fmt(totalSpending, lang)}
                  </Text>
                ) : null}
                {totalIncoming === 0 && totalSpending === 0 ? (
                  <Text style={{ fontSize: 26, fontWeight: '800', color: tokens.text, letterSpacing: -0.6 }}>
                    {fmt(0, lang)}
                  </Text>
                ) : null}
              </View>
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                <Chip color={CashlyTheme.accent.income} icon="repeat" label={t('planRecurring')} value={recurCount} />
                <Chip color={CashlyTheme.accent.purple} icon="flash" label={t('planOneOff')} value={oneoffCount} />
              </View>
            </View>
          </GlassCard>
        )}

        <View style={{ marginHorizontal: 16, marginBottom: 14 }}>
          <SegmentedControl<Filter>
            options={[
              { id: 'all', label: t('all') },
              { id: 'recurring', label: t('planRecurring') },
              { id: 'oneoff', label: t('planOneOff') },
            ]}
            active={filter}
            onChange={setFilter}
          />
        </View>

        <View style={{ paddingHorizontal: 16 }}>
          {view === 'calendar' ? (
            <View>
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: '700',
                  color: tokens.textTertiary,
                  letterSpacing: 0.6,
                  textTransform: 'uppercase',
                  paddingHorizontal: 6,
                  paddingBottom: 10,
                }}
              >
                {selectedDay
                  ? fmtDate(selectedDay, 'd MMMM yyyy', lang)
                  : lang === 'ru'
                    ? 'Все события месяца'
                    : 'All events this month'}
              </Text>
              {monthList.length === 0 ? (
                <GlassCard radius={22}>
                  <View style={{ padding: 28, alignItems: 'center' }}>
                    <Text style={{ fontSize: 13, color: tokens.textSecondary }}>{t('emptyPlanned')}</Text>
                  </View>
                </GlassCard>
              ) : (
                <GlassCard radius={22}>
                  {monthList.map((e, i) => (
                    <PlanRow
                      key={e.id}
                      e={e}
                      isLast={i === monthList.length - 1}
                      category={catById(categories, e.categoryId)}
                      onEdit={e.plannedId ? () => uiStore.openEditPlanned(e.plannedId!) : undefined}
                      onPay={e.plannedId ? () => onPlanPay(e.plannedId!) : undefined}
                      onDelete={e.plannedId ? () => onPlanDelete(e.plannedId!) : undefined}
                    />
                  ))}
                </GlassCard>
              )}
            </View>
          ) : (
            <>
              {thisWeek.length > 0 ? (
                <PlanGroup
                  title={t('planThisWeek')}
                  entries={thisWeek}
                  accent={CashlyTheme.accent.expense}
                  categories={categories}
                  onEdit={(id) => uiStore.openEditPlanned(id)}
                  onPay={onPlanPay}
                  onDelete={onPlanDelete}
                />
              ) : null}
              {later.length > 0 ? (
                <PlanGroup
                  title={t('planLater')}
                  entries={later}
                  accent={tokens.textSecondary}
                  categories={categories}
                  onEdit={(id) => uiStore.openEditPlanned(id)}
                  onPay={onPlanPay}
                  onDelete={onPlanDelete}
                />
              ) : null}
              {forList.length === 0 ? (
                <GlassCard radius={22}>
                  <View style={{ padding: 28, alignItems: 'center' }}>
                    <Text style={{ fontSize: 13, color: tokens.textSecondary }}>{t('emptyPlanned')}</Text>
                  </View>
                </GlassCard>
              ) : null}
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function PlanGroup({
  title,
  entries,
  accent,
  categories,
  onEdit,
  onPay,
  onDelete,
}: {
  title: string;
  entries: Entry[];
  accent: string;
  categories: ReturnType<typeof useCategories>['categories'];
  onEdit?: (plannedId: string) => void;
  onPay?: (plannedId: string) => void;
  onDelete?: (plannedId: string) => void;
}) {
  const { tokens, dark } = useTokens();
  return (
    <View style={{ marginBottom: 18 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 6, paddingBottom: 10 }}>
        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: accent }} />
        <Text
          style={{
            fontSize: 11,
            fontWeight: '700',
            color: tokens.textTertiary,
            letterSpacing: 0.6,
            textTransform: 'uppercase',
          }}
        >
          {title}
        </Text>
        <View
          style={{
            paddingHorizontal: 7,
            paddingVertical: 2,
            borderRadius: 8,
            backgroundColor: dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
          }}
        >
          <Text style={{ fontSize: 11, fontWeight: '600', color: tokens.textSecondary }}>{entries.length}</Text>
        </View>
      </View>
      <GlassCard radius={22}>
        {entries.map((e, i) => (
          <PlanRow
            key={e.id}
            e={e}
            isLast={i === entries.length - 1}
            category={catById(categories, e.categoryId)}
            onEdit={e.plannedId && onEdit ? () => onEdit(e.plannedId!) : undefined}
            onPay={e.plannedId && onPay ? () => onPay(e.plannedId!) : undefined}
            onDelete={e.plannedId && onDelete ? () => onDelete(e.plannedId!) : undefined}
          />
        ))}
      </GlassCard>
    </View>
  );
}

function Chip({
  color,
  icon,
  label,
  value,
}: {
  color: string;
  icon: 'repeat' | 'flash';
  label: string;
  value: number;
}) {
  const { tokens } = useTokens();
  return (
    <View
      style={{
        flex: 1,
        padding: 12,
        borderRadius: 14,
        backgroundColor: alpha(color, 0.14),
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: alpha(color, 0.3),
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
        <Icon name={icon} color={color} size={13} />
        <Text style={{ fontSize: 11, fontWeight: '600', color, letterSpacing: 0.3, textTransform: 'uppercase' }}>
          {label}
        </Text>
      </View>
      <Text style={{ fontSize: 17, fontWeight: '700', color: tokens.text, marginTop: 4 }}>{value}</Text>
    </View>
  );
}

function PlanRow({
  e,
  isLast,
  category,
  onEdit,
  onPay,
  onDelete,
}: {
  e: Entry;
  isLast: boolean;
  category: ReturnType<typeof catById>;
  onEdit?: () => void;
  onPay?: () => void;
  onDelete?: () => void;
}) {
  const { tokens, dark } = useTokens();
  const [lang] = useLang();
  const t = useT();
  const isIn = e.direction === 'in';
  const urgent = e.inDays <= 3;
  const due = isIn
    ? CashlyTheme.accent.income
    : urgent
      ? CashlyTheme.accent.expense
      : e.inDays <= 7
        ? CashlyTheme.accent.orange
        : CashlyTheme.accent.income;
  const paid = e.isDone === true;
  const isPast = e.date < todayIso();
  const canPay = !!onPay && !paid && !isPast;
  const rowBody = (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        backgroundColor: dark ? 'rgba(28,28,34,0.95)' : 'rgba(255,255,255,0.98)',
        borderBottomWidth: isLast ? 0 : StyleSheet.hairlineWidth,
        borderBottomColor: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
        opacity: paid ? 0.55 : 1,
      }}
    >
      <View
        style={{
          width: 46,
          paddingVertical: 6,
          borderRadius: 12,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: alpha(due, 0.3),
        }}
      >
        <Text style={{ fontSize: 10, fontWeight: '700', color: due, letterSpacing: 0.3, textTransform: 'uppercase' }}>
          {fmtDate(e.date, 'LLL', lang).slice(0, 3)}
        </Text>
        <Text style={{ fontSize: 20, fontWeight: '800', color: tokens.text, letterSpacing: -0.5, lineHeight: 22 }}>
          {fmtDate(e.date, 'd', lang)}
        </Text>
      </View>

      {isIn ? (
        <CategoryBadge color={CashlyTheme.accent.income} size={36} radius={11}>
          <Icon name={e.kind === 'recurring' ? 'briefcase' : 'cards'} color="#fff" size={16} />
        </CategoryBadge>
      ) : (
        <CategoryBadge color={category.color} size={36} radius={11}>
          <CategoryIcon icon={category.icon} size={16} />
        </CategoryBadge>
      )}

      <View style={{ flex: 1, minWidth: 0 }}>
        <Text
          numberOfLines={1}
          style={{
            fontSize: 15,
            fontWeight: '600',
            color: tokens.text,
            letterSpacing: -0.2,
            textDecorationLine: paid ? 'line-through' : 'none',
          }}
        >
          {e.name}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 }}>
          {paid ? (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 3,
                paddingHorizontal: 6,
                paddingVertical: 2,
                borderRadius: 6,
                backgroundColor: alpha(CashlyTheme.accent.income, 0.15),
              }}
            >
              <Icon name="check" color={CashlyTheme.accent.income} size={9} />
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: '700',
                  color: CashlyTheme.accent.income,
                  letterSpacing: 0.2,
                  textTransform: 'uppercase',
                }}
              >
                {t('paid')}
              </Text>
            </View>
          ) : (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 3,
                paddingHorizontal: 6,
                paddingVertical: 2,
                borderRadius: 6,
                backgroundColor: alpha(
                  e.kind === 'recurring' ? CashlyTheme.accent.income : CashlyTheme.accent.purple,
                  0.15,
                ),
              }}
            >
              <Icon
                name={e.kind === 'recurring' ? 'repeat' : 'flash'}
                color={e.kind === 'recurring' ? CashlyTheme.accent.income : CashlyTheme.accent.purple}
                size={9}
              />
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: '600',
                  color: e.kind === 'recurring' ? CashlyTheme.accent.income : CashlyTheme.accent.purple,
                  letterSpacing: 0.2,
                  textTransform: 'uppercase',
                }}
              >
                {e.kind === 'recurring' ? t('planRecurring') : t('planOneOff')}
              </Text>
            </View>
          )}
          <Text style={{ fontSize: 11, color: tokens.textSecondary }}>
            · {fmtDate(e.date, 'd MMM', lang)}
            {!paid ? (
              <>
                {' · '}
                <Text style={{ color: due, fontWeight: '600' }}>
                  {e.inDays} {t('dayShort')}.
                </Text>
              </>
            ) : null}
          </Text>
        </View>
      </View>
      <View style={{ alignItems: 'flex-end', gap: 4 }}>
        <Text
          style={{
            fontSize: 15,
            fontWeight: '700',
            color: isIn ? CashlyTheme.accent.income : tokens.text,
            letterSpacing: -0.3,
          }}
        >
          {isIn ? '+ ' : ''}
          {fmt(e.amount, lang)}
        </Text>
        {canPay ? (
          <Pressable
            onPress={() => {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              onPay?.();
            }}
            hitSlop={4}
            style={{
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 10,
              backgroundColor: urgent
                ? CashlyTheme.accent.income
                : dark
                  ? 'rgba(255,255,255,0.08)'
                  : 'rgba(0,0,0,0.06)',
            }}
          >
            <Text style={{ fontSize: 11, fontWeight: '700', color: urgent ? '#fff' : tokens.text }}>
              {t('planPay')}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );

  const tappable = onEdit ? (
    <Pressable
      onPress={() => {
        Haptics.selectionAsync();
        onEdit();
      }}
    >
      {rowBody}
    </Pressable>
  ) : (
    rowBody
  );

  if (!onDelete) return tappable;

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

  return (
    <SwipeableRow rightActions={actions} revealWidth={76}>
      {tappable}
    </SwipeableRow>
  );
}

// Project recurring occurrences from `fromIso` forward until `until` (inclusive).
function projectRecurrence(fromIso: string, period: RecurringPeriod, until: Date): string[] {
  const out: string[] = [];
  const start = new Date(fromIso);
  if (isNaN(start.getTime())) return out;

  const guard = 200; // safety cap
  let i = 0;
  const cur = new Date(start);
  while (cur.getTime() <= until.getTime() && i < guard) {
    out.push(isoDate(cur));
    if (period === 'weekly') cur.setDate(cur.getDate() + 7);
    else if (period === 'monthly') cur.setMonth(cur.getMonth() + 1);
    else cur.setFullYear(cur.getFullYear() + 1);
    i++;
  }
  return out;
}

function isoDate(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

const styles = StyleSheet.create({
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
