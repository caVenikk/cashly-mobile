import React, { useEffect, useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, Text, TextInput, View, ScrollView } from 'react-native';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import * as Haptics from 'expo-haptics';
import { SheetShell } from './SheetShell';
import { GlassCard } from '@/src/components/glass/GlassCard';
import { CategoryIcon } from '@/src/components/CategoryIcon';
import { CashlyTheme } from '@/src/lib/theme';
import { useTokens } from '@/src/lib/themeMode';
import { useLang, useT } from '@/src/i18n';
import { useSheet } from '@/src/stores/ui';
import { fmtDate, todayIso } from '@/src/lib/format';
import { errorMessage } from '@/src/lib/errors';
import { useRecurring } from '@/src/hooks/useRecurring';
import { useCategories } from '@/src/hooks/useCategories';
import type { RecurringPeriod } from '@/src/types/db';

export function AddRecurringSheet() {
  const { open, setOpen } = useSheet('addRecurring');
  const { tokens, dark } = useTokens();
  const [lang] = useLang();
  const t = useT();
  const { create } = useRecurring();
  const { categories } = useCategories();

  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [period, setPeriod] = useState<RecurringPeriod>('monthly');
  const [date, setDate] = useState<string>(todayIso());
  const [catId, setCatId] = useState<string | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setName('');
      setAmount('');
      setPeriod('monthly');
      setDate(todayIso());
      setCatId(categories[0]?.id ?? null);
      setShowPicker(false);
    }
  }, [open, categories]);

  const canSave = !saving && name.trim().length > 0 && parseFloat(amount || '0') > 0 && !!catId;

  const onSave = async () => {
    if (!canSave || !catId) return;
    setSaving(true);
    try {
      await create({
        name: name.trim(),
        amount: parseFloat(amount),
        period,
        next_date: date,
        category_id: catId,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setOpen(false);
    } catch (e) {
      Alert.alert('Ошибка', errorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <SheetShell open={open} onClose={() => setOpen(false)} snapPoints={['78%']}>
      <View style={styles.header}>
        <Pressable onPress={() => setOpen(false)} hitSlop={8}>
          <Text style={{ fontSize: 15, fontWeight: '500', color: tokens.textSecondary }}>{t('cancel')}</Text>
        </Pressable>
        <Text style={{ fontSize: 17, fontWeight: '700', color: tokens.text }}>{t('recurringTitle')}</Text>
        <Pressable onPress={onSave} disabled={!canSave} hitSlop={8}>
          <Text
            style={{
              fontSize: 15,
              fontWeight: '700',
              color: canSave ? CashlyTheme.accent.income : tokens.textTertiary,
              opacity: canSave ? 1 : 0.5,
            }}
          >
            {t('save')}
          </Text>
        </Pressable>
      </View>

      <BottomSheetScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        <GlassCard radius={18}>
          <FieldRow label={t('recName')} first>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Netflix"
              placeholderTextColor={tokens.textTertiary}
              style={inputStyle(tokens)}
            />
          </FieldRow>
          <FieldRow label={t('amount')}>
            <TextInput
              value={amount}
              onChangeText={setAmount}
              placeholder="0"
              keyboardType="decimal-pad"
              placeholderTextColor={tokens.textTertiary}
              style={inputStyle(tokens)}
            />
          </FieldRow>
          <FieldRow label={t('recPeriod')}>
            <View style={{ flexDirection: 'row', gap: 6, flex: 1, flexWrap: 'wrap' }}>
              {(['weekly', 'monthly', 'yearly'] as RecurringPeriod[]).map((p) => {
                const on = period === p;
                return (
                  <Pressable
                    key={p}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setPeriod(p);
                    }}
                    style={{
                      paddingVertical: 6,
                      paddingHorizontal: 10,
                      borderRadius: 10,
                      backgroundColor: on
                        ? CashlyTheme.accent.income
                        : dark
                          ? 'rgba(255,255,255,0.06)'
                          : 'rgba(0,0,0,0.04)',
                    }}
                  >
                    <Text style={{ fontSize: 12, fontWeight: '600', color: on ? '#fff' : tokens.textSecondary }}>
                      {t(`period_${p}` as 'period_weekly' | 'period_monthly' | 'period_yearly')}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </FieldRow>
          <Pressable onPress={() => setShowPicker(true)}>
            <FieldRow label={t('recNext')}>
              <Text style={{ fontSize: 15, fontWeight: '600', color: tokens.text }}>
                {fmtDate(date, 'd MMMM yyyy', lang)}
              </Text>
            </FieldRow>
          </Pressable>
          <FieldRow label={t('category')} last>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                {categories.map((c) => {
                  const on = catId === c.id;
                  return (
                    <Pressable
                      key={c.id}
                      onPress={() => setCatId(c.id)}
                      style={{
                        paddingVertical: 6,
                        paddingHorizontal: 10,
                        borderRadius: 10,
                        backgroundColor: on ? c.color : dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <CategoryIcon icon={c.icon} size={14} color="#fff" />
                      <Text style={{ fontSize: 12, fontWeight: '600', color: on ? '#fff' : tokens.textSecondary }}>
                        {c.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>
          </FieldRow>
        </GlassCard>

        {showPicker ? (
          <DateTimePicker
            value={new Date(date)}
            mode="date"
            display={Platform.OS === 'ios' ? 'inline' : 'default'}
            onChange={(event: DateTimePickerEvent, selected?: Date) => {
              if (Platform.OS === 'android') setShowPicker(false);
              if (event.type === 'set' && selected) {
                const m = String(selected.getMonth() + 1).padStart(2, '0');
                const d = String(selected.getDate()).padStart(2, '0');
                setDate(`${selected.getFullYear()}-${m}-${d}`);
              }
            }}
            locale={lang === 'ru' ? 'ru-RU' : 'en-US'}
          />
        ) : null}
      </BottomSheetScrollView>
    </SheetShell>
  );
}

function FieldRow({
  label,
  first,
  last,
  children,
}: {
  label: string;
  first?: boolean;
  last?: boolean;
  children: React.ReactNode;
}) {
  const { tokens, dark } = useTokens();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 12,
        gap: 10,
        borderTopWidth: first ? 0 : StyleSheet.hairlineWidth,
        borderTopColor: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
        borderBottomWidth: last ? 0 : StyleSheet.hairlineWidth,
        borderBottomColor: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
      }}
    >
      <Text style={{ fontSize: 13, fontWeight: '500', color: tokens.textSecondary, width: 110 }}>{label}</Text>
      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>{children}</View>
    </View>
  );
}

function inputStyle(tokens: ReturnType<typeof useTokens>['tokens']) {
  return { flex: 1, fontSize: 15, color: tokens.text, padding: 0 };
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
