import React, { useEffect, useState } from 'react';
import { Alert, Keyboard, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import * as Haptics from 'expo-haptics';
import { SheetShell } from './SheetShell';
import { GlassCard } from '@/src/components/glass/GlassCard';
import { CashlyTheme } from '@/src/lib/theme';
import { useTokens } from '@/src/lib/themeMode';
import { useLang, useT } from '@/src/i18n';
import { useSheet } from '@/src/stores/ui';
import { fmtDate, todayIso } from '@/src/lib/format';
import { errorMessage } from '@/src/lib/errors';
import { useIncomes } from '@/src/hooks/useIncomes';
import type { IncomeKind } from '@/src/types/db';

export function AddIncomeSheet() {
  const { open, setOpen } = useSheet('addIncome');
  const { tokens, dark } = useTokens();
  const [lang] = useLang();
  const t = useT();
  const { create } = useIncomes();

  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [kind, setKind] = useState<IncomeKind>('recurring');
  const [date, setDate] = useState<string>(todayIso());
  const [showPicker, setShowPicker] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName('');
    setAmount('');
    setKind('recurring');
    setDate(todayIso());
    setShowPicker(false);
  }, [open]);

  const canSave = !saving && name.trim().length > 0 && parseFloat(amount || '0') > 0;

  const onSave = async () => {
    if (!canSave) return;
    Keyboard.dismiss();
    setSaving(true);
    try {
      await create({ name: name.trim(), amount: parseFloat(amount), kind, next_date: date });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setOpen(false);
    } catch (e) {
      Alert.alert('Ошибка', errorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const onPickDate = (event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') setShowPicker(false);
    if (event.type === 'set' && selected) {
      const m = String(selected.getMonth() + 1).padStart(2, '0');
      const d = String(selected.getDate()).padStart(2, '0');
      setDate(`${selected.getFullYear()}-${m}-${d}`);
    }
  };

  return (
    <SheetShell open={open} onClose={() => setOpen(false)} snapPoints={['82%']}>
      <View style={styles.header}>
        <Pressable onPress={() => setOpen(false)} hitSlop={8}>
          <Text style={{ fontSize: 15, fontWeight: '500', color: tokens.textSecondary }}>{t('cancel')}</Text>
        </Pressable>
        <Text style={{ fontSize: 17, fontWeight: '700', color: tokens.text, letterSpacing: -0.3 }}>
          {t('incomeAdd')}
        </Text>
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
        contentContainerStyle={{ padding: 16, paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        <GlassCard radius={18}>
          <LabelInput label={t('incomeName')} value={name} onChange={setName} placeholder={t('incomeNameHint')} first />
          <LabelInput
            label={t('amount')}
            value={amount}
            onChange={setAmount}
            keyboardType="decimal-pad"
            placeholder="0"
          />
          <View style={styles.row}>
            <Text style={[styles.rowLabel, { color: tokens.textSecondary }]}>{t('incomeKind')}</Text>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {(['recurring', 'oneoff'] as IncomeKind[]).map((k) => {
                const on = kind === k;
                return (
                  <Pressable
                    key={k}
                    onPress={() => {
                      Keyboard.dismiss();
                      Haptics.selectionAsync();
                      setKind(k);
                    }}
                    style={{
                      paddingVertical: 6,
                      paddingHorizontal: 12,
                      borderRadius: 10,
                      backgroundColor: on
                        ? CashlyTheme.accent.income
                        : dark
                          ? 'rgba(255,255,255,0.06)'
                          : 'rgba(0,0,0,0.04)',
                    }}
                  >
                    <Text style={{ fontSize: 13, fontWeight: '600', color: on ? '#fff' : tokens.textSecondary }}>
                      {k === 'recurring' ? t('incomeRegular') : t('incomeOneoff')}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
          <Pressable
            onPress={() => {
              Keyboard.dismiss();
              setShowPicker(true);
            }}
            style={[styles.row, { borderBottomWidth: 0 }]}
          >
            <Text style={[styles.rowLabel, { color: tokens.textSecondary }]}>{t('incomeNextDate')}</Text>
            <Text style={{ fontSize: 15, fontWeight: '600', color: tokens.text }}>
              {fmtDate(date, 'd MMMM yyyy', lang)}
            </Text>
          </Pressable>
        </GlassCard>

        {showPicker ? (
          <View style={{ marginTop: 16, alignItems: 'center' }}>
            <DateTimePicker
              value={new Date(date)}
              mode="date"
              display={Platform.OS === 'ios' ? 'inline' : 'default'}
              onChange={onPickDate}
              themeVariant={dark ? 'dark' : 'light'}
              accentColor={CashlyTheme.accent.income}
              locale={lang === 'ru' ? 'ru-RU' : 'en-US'}
            />
          </View>
        ) : null}
      </BottomSheetScrollView>
    </SheetShell>
  );
}

function LabelInput({
  label,
  value,
  onChange,
  placeholder,
  keyboardType,
  first,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'decimal-pad';
  first?: boolean;
}) {
  const { tokens, dark } = useTokens();
  return (
    <View
      style={[
        styles.row,
        {
          borderTopWidth: first ? 0 : StyleSheet.hairlineWidth,
          borderTopColor: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
        },
      ]}
    >
      <Text style={[styles.rowLabel, { color: tokens.textSecondary }]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={tokens.textTertiary}
        keyboardType={keyboardType ?? 'default'}
        returnKeyType="done"
        onSubmitEditing={Keyboard.dismiss}
        style={{ flex: 1, fontSize: 15, color: tokens.text, padding: 0 }}
      />
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  rowLabel: {
    fontSize: 13,
    fontWeight: '500',
    width: 110,
  },
});
