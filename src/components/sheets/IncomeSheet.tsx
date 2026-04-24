import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import * as Haptics from 'expo-haptics';
import { SheetShell } from './SheetShell';
import { GlassCard } from '@/src/components/glass/GlassCard';
import { CategoryBadge } from '@/src/components/glass/CategoryBadge';
import { IOSwitch } from '@/src/components/glass/IOSwitch';
import { Icon } from '@/src/components/Icon';
import { CashlyTheme, alpha } from '@/src/lib/theme';
import { useTokens } from '@/src/lib/themeMode';
import { fmt, fmtDate } from '@/src/lib/format';
import { useLang, useT } from '@/src/i18n';
import { useSheet, uiStore } from '@/src/stores/ui';
import { showSnackbar } from '@/src/stores/snackbar';
import { errorMessage } from '@/src/lib/errors';
import { useIncomes } from '@/src/hooks/useIncomes';
import type { Income } from '@/src/types/db';

export function IncomeSheet() {
  const { open, setOpen } = useSheet('income');
  const { tokens } = useTokens();
  const [lang] = useLang();
  const t = useT();
  const { incomes, toggle, remove, receive } = useIncomes();

  const regular = useMemo(() => incomes.filter((i) => i.kind === 'recurring'), [incomes]);
  const oneoff = useMemo(() => incomes.filter((i) => i.kind === 'oneoff'), [incomes]);

  // Recurring: pause (is_active=false) removes from the month total.
  // Oneoff: every row counts — "received" is ledger status, not a pause.
  const totalRegular = regular.filter((i) => i.is_active).reduce((s, i) => s + Number(i.amount), 0);
  const totalOneoff = oneoff.reduce((s, i) => s + Number(i.amount), 0);
  const total = totalRegular + totalOneoff;

  const onReceive = async (inc: Income) => {
    try {
      await receive(inc);
      showSnackbar(t('snackReceived'));
    } catch (e) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showSnackbar(errorMessage(e), 'error');
    }
  };

  return (
    <SheetShell open={open} onClose={() => setOpen(false)} snapPoints={['90%']}>
      <View style={styles.header}>
        <Pressable onPress={() => setOpen(false)} hitSlop={8}>
          <Text style={{ fontSize: 15, fontWeight: '500', color: tokens.textSecondary }}>{t('cancel')}</Text>
        </Pressable>
        <Text style={{ fontSize: 17, fontWeight: '700', color: tokens.text, letterSpacing: -0.3 }}>
          {t('incomeTitle')}
        </Text>
        <Pressable
          onPress={() => {
            Haptics.selectionAsync();
            uiStore.open('addIncome');
          }}
          hitSlop={8}
          style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: CashlyTheme.accent.income,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name="plus" color="#fff" size={18} />
        </Pressable>
      </View>

      <BottomSheetScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        <GlassCard strong style={{ marginBottom: 18 }}>
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
              {t('monthIncome')}
            </Text>
            <Text
              style={{
                fontSize: 36,
                fontWeight: '800',
                color: CashlyTheme.accent.income,
                letterSpacing: -1,
                marginTop: 2,
              }}
            >
              + {fmt(total, lang)}
            </Text>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 14 }}>
              <SummaryChip
                label={t('incomeRegular')}
                value={fmt(totalRegular, lang)}
                color={CashlyTheme.accent.income}
              />
              <SummaryChip label={t('incomeOneoff')} value={fmt(totalOneoff, lang)} color={CashlyTheme.accent.purple} />
            </View>
          </View>
        </GlassCard>

        <SectionLabel icon="repeat" label={t('incomeRegular')} color={CashlyTheme.accent.income} />
        <GlassCard radius={22}>
          {regular.length === 0 ? (
            <View style={{ padding: 18, alignItems: 'center' }}>
              <Text style={{ fontSize: 13, color: tokens.textSecondary }}>{t('emptyIncomes')}</Text>
            </View>
          ) : (
            regular.map((inc, i) => (
              <IncomeRow
                key={inc.id}
                inc={inc}
                isLast={i === regular.length - 1}
                onToggle={() => toggle(inc.id, inc.is_active === false ? true : false)}
                onDelete={() => remove(inc.id)}
                onReceive={() => onReceive(inc)}
              />
            ))
          )}
        </GlassCard>

        <View style={{ height: 16 }} />
        <SectionLabel icon="flash" label={t('incomeOneoff')} color={CashlyTheme.accent.purple} />
        <GlassCard radius={22}>
          {oneoff.length === 0 ? (
            <View style={{ padding: 18, alignItems: 'center' }}>
              <Text style={{ fontSize: 13, color: tokens.textSecondary }}>—</Text>
            </View>
          ) : (
            oneoff.map((inc, i) => (
              <IncomeRow
                key={inc.id}
                inc={inc}
                isLast={i === oneoff.length - 1}
                onDelete={() => remove(inc.id)}
                onReceive={() => onReceive(inc)}
              />
            ))
          )}
        </GlassCard>
      </BottomSheetScrollView>
    </SheetShell>
  );
}

function SectionLabel({ icon, label, color }: { icon: 'repeat' | 'flash'; label: string; color: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 6, paddingBottom: 10 }}>
      <Icon name={icon} color={color} size={11} />
      <Text style={{ fontSize: 11, fontWeight: '700', color, letterSpacing: 0.6, textTransform: 'uppercase' }}>
        {label}
      </Text>
    </View>
  );
}

function SummaryChip({ label, value, color }: { label: string; value: string; color: string }) {
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
      <Text style={{ fontSize: 10, fontWeight: '700', color, letterSpacing: 0.3, textTransform: 'uppercase' }}>
        {label}
      </Text>
      <Text style={{ fontSize: 17, fontWeight: '700', color: tokens.text, marginTop: 3 }}>{value}</Text>
    </View>
  );
}

function IncomeRow({
  inc,
  isLast,
  onToggle,
  onDelete,
  onReceive,
}: {
  inc: Income;
  isLast: boolean;
  onToggle?: () => void;
  onDelete: () => void;
  onReceive?: () => void;
}) {
  const { tokens, dark } = useTokens();
  const [lang] = useLang();
  const t = useT();
  const paused = inc.is_active === false;
  const iconName = inc.kind === 'recurring' ? 'briefcase' : 'cards';
  const color = inc.kind === 'recurring' ? CashlyTheme.accent.income : CashlyTheme.accent.purple;
  const days = Math.round((new Date(inc.next_date).getTime() - Date.now()) / 86400000);
  const due = inc.is_active && days <= 0;
  // For oneoff rows, is_active=false means the income was already received;
  // for recurring it means paused. Layout reacts to both.
  const received = inc.kind === 'oneoff' && paused;
  const canReceive = !!onReceive && inc.is_active;

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: isLast ? 0 : StyleSheet.hairlineWidth,
        borderBottomColor: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
        opacity: paused ? 0.55 : 1,
      }}
    >
      <CategoryBadge color={color} size={40} radius={12}>
        <Icon name={iconName} color="#fff" size={18} />
      </CategoryBadge>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text numberOfLines={1} style={{ fontSize: 15, fontWeight: '600', color: tokens.text, letterSpacing: -0.2 }}>
          {inc.name}
        </Text>
        <Text style={{ fontSize: 12, color: tokens.textSecondary, marginTop: 2 }}>
          {received ? t('incomeReceived') : `${fmtDate(inc.next_date, 'd MMM', lang)} · ${days} ${t('dayShort')}.`}
        </Text>
      </View>
      <View style={{ alignItems: 'flex-end', gap: 4 }}>
        <Text style={{ fontSize: 14, fontWeight: '700', color: CashlyTheme.accent.income, letterSpacing: -0.3 }}>
          + {fmt(Number(inc.amount), lang)}
        </Text>
        {canReceive ? (
          <Pressable
            onPress={() => {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              onReceive?.();
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
              {t('incomeReceive')}
            </Text>
          </Pressable>
        ) : null}
      </View>
      {onToggle ? (
        <IOSwitch on={!paused} onChange={onToggle} />
      ) : (
        <Pressable onPress={onDelete} hitSlop={6}>
          <Icon name="trash" color={tokens.textTertiary} size={18} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 6,
    paddingBottom: 10,
  },
});
