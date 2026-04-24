import React, { useEffect, useRef, useState } from 'react';
import { Alert, Keyboard, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import * as Haptics from 'expo-haptics';
import { DatePicker, type DatePickerHandle } from '@/src/components/DatePicker';
import { SheetShell } from './SheetShell';
import { GlassCard } from '@/src/components/glass/GlassCard';
import { CashlyTheme } from '@/src/lib/theme';
import { useTokens } from '@/src/lib/themeMode';
import { useLang, useT } from '@/src/i18n';
import { useSheet } from '@/src/stores/ui';
import { fmtDate, todayIso } from '@/src/lib/format';
import { errorMessage } from '@/src/lib/errors';
import { useIncomes } from '@/src/hooks/useIncomes';
import { useEnvelopes } from '@/src/hooks/useEnvelopes';
import type { IncomeKind } from '@/src/types/db';

export function AddIncomeSheet() {
  const { open, setOpen } = useSheet('addIncome');
  const { tokens, dark } = useTokens();
  const [lang] = useLang();
  const t = useT();
  const { create } = useIncomes();
  const { envelopes } = useEnvelopes();

  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [kind, setKind] = useState<IncomeKind>('recurring');
  const [date, setDate] = useState<string>(todayIso());
  const [envId, setEnvId] = useState<string | null>(null);
  const [alreadyReceived, setAlreadyReceived] = useState(false);
  const dateRef = useRef<DatePickerHandle>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName('');
    setAmount('');
    setKind('recurring');
    setDate(todayIso());
    dateRef.current?.close();
    setAlreadyReceived(false);
    setEnvId(envelopes.find((e) => e.kind === 'main')?.id ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // "Already received" only makes sense for one-off incomes; reset it whenever
  // the user flips back to recurring so it can't be smuggled in.
  useEffect(() => {
    if (kind === 'recurring' && alreadyReceived) setAlreadyReceived(false);
  }, [kind, alreadyReceived]);

  const canSave = !saving && name.trim().length > 0 && parseFloat(amount || '0') > 0;

  const onSave = async () => {
    if (!canSave) return;
    Keyboard.dismiss();
    setSaving(true);
    try {
      await create({
        name: name.trim(),
        amount: parseFloat(amount),
        kind,
        next_date: date,
        envelope_id: envId,
        already_received: kind === 'oneoff' && alreadyReceived,
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
              dateRef.current?.open();
            }}
            style={styles.row}
          >
            <Text style={[styles.rowLabel, { color: tokens.textSecondary }]}>
              {kind === 'oneoff' ? t('incomeDate') : t('incomeNextDate')}
            </Text>
            <Text style={{ fontSize: 15, fontWeight: '600', color: tokens.text }}>
              {fmtDate(date, 'd MMMM yyyy', lang)}
            </Text>
          </Pressable>
          {kind === 'oneoff' ? (
            <Pressable
              onPress={() => {
                Keyboard.dismiss();
                Haptics.selectionAsync();
                setAlreadyReceived((v) => !v);
              }}
              style={styles.row}
            >
              <Text style={[styles.rowLabel, { color: tokens.textSecondary }]}>{t('incomeAlreadyReceived')}</Text>
              <View style={{ flex: 1, alignItems: 'flex-end' }}>
                <View
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 7,
                    borderWidth: 2,
                    borderColor: alreadyReceived
                      ? CashlyTheme.accent.income
                      : dark
                        ? 'rgba(255,255,255,0.25)'
                        : 'rgba(0,0,0,0.2)',
                    backgroundColor: alreadyReceived ? CashlyTheme.accent.income : 'transparent',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {alreadyReceived ? (
                    <Text style={{ color: '#fff', fontSize: 14, fontWeight: '900', lineHeight: 16 }}>✓</Text>
                  ) : null}
                </View>
              </View>
            </Pressable>
          ) : null}
          <View style={[styles.row, { borderBottomWidth: 0, alignItems: 'flex-start' }]}>
            <Text style={[styles.rowLabel, { color: tokens.textSecondary, paddingTop: 4 }]}>{t('envTarget')}</Text>
            <View style={{ flexDirection: 'row', gap: 6, flex: 1, flexWrap: 'wrap' }}>
              {envelopes.map((e) => {
                const on = envId === e.id;
                return (
                  <Pressable
                    key={e.id}
                    onPress={() => {
                      Keyboard.dismiss();
                      Haptics.selectionAsync();
                      setEnvId(e.id);
                    }}
                    style={{
                      paddingVertical: 4,
                      paddingHorizontal: 8,
                      borderRadius: 10,
                      backgroundColor: on ? e.color : dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <Text style={{ fontSize: 13 }}>{e.emoji}</Text>
                    <Text style={{ fontSize: 11, fontWeight: '600', color: on ? '#fff' : tokens.textSecondary }}>
                      {e.name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </GlassCard>

        <View style={{ marginTop: 16, alignItems: 'center' }}>
          <DatePicker ref={dateRef} value={date} onChange={setDate} />
        </View>
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
