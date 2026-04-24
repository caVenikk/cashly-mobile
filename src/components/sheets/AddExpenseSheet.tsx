import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { DatePicker, type DatePickerHandle } from '@/src/components/DatePicker';
import { DateOverlay } from '@/src/components/DateOverlay';
import * as Haptics from 'expo-haptics';
import { SheetShell } from './SheetShell';
import { GlassCard } from '@/src/components/glass/GlassCard';
import { Icon } from '@/src/components/Icon';
import { CashlyTheme } from '@/src/lib/theme';
import { useTokens } from '@/src/lib/themeMode';
import { fmtDate, todayIso } from '@/src/lib/format';
import { useLang, useT } from '@/src/i18n';
import { useSheet } from '@/src/stores/ui';
import { showSnackbar } from '@/src/stores/snackbar';
import { errorMessage } from '@/src/lib/errors';
import { useCategories } from '@/src/hooks/useCategories';
import { useExpenses } from '@/src/hooks/useExpenses';
import { useEnvelopes } from '@/src/hooks/useEnvelopes';

export function AddExpenseSheet() {
  const { open, setOpen } = useSheet('addExpense');
  const { tokens, dark } = useTokens();
  const [lang] = useLang();
  const t = useT();
  const { categories } = useCategories();
  const { envelopes } = useEnvelopes();
  const { create } = useExpenses();

  const [amount, setAmount] = useState('');
  const [catId, setCatId] = useState<string | null>(null);
  const [envId, setEnvId] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [date, setDate] = useState<string>(todayIso());
  const dateRef = useRef<DatePickerHandle>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setAmount('');
    setNote('');
    setDate(todayIso());
    dateRef.current?.close();
    setCatId((prev) => prev ?? categories[0]?.id ?? null);
    setEnvId((prev) => prev ?? envelopes.find((e) => e.kind === 'main')?.id ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const canSave = !saving && parseFloat(amount || '0') > 0 && !!catId;

  const press = (k: string) => {
    Haptics.selectionAsync();
    if (k === 'back') setAmount((prev) => prev.slice(0, -1));
    else if (k === '.' || k === ',') {
      setAmount((prev) => (prev.includes('.') ? prev : (prev || '0') + '.'));
    } else {
      setAmount((prev) => {
        if (prev.length >= 9) return prev;
        if (prev === '0') return k;
        return prev + k;
      });
    }
  };

  const onSave = async () => {
    if (!canSave || !catId) return;
    setSaving(true);
    try {
      await create({
        amount: parseFloat(amount),
        category_id: catId,
        envelope_id: envId,
        note: note.trim() || null,
        date,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showSnackbar(t('snackSaved'));
      setOpen(false);
    } catch (e) {
      showSnackbar(errorMessage(e), 'error');
    } finally {
      setSaving(false);
    }
  };

  const today = todayIso();
  const yesterdayIso = (() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  })();
  const isCustomDate = date !== today && date !== yesterdayIso;

  return (
    <SheetShell open={open} onClose={() => setOpen(false)} snapPoints={['92%']}>
      <View style={styles.topRow}>
        <Pressable onPress={() => setOpen(false)} hitSlop={8}>
          <Text style={{ fontSize: 15, fontWeight: '500', color: tokens.textSecondary }}>{t('cancel')}</Text>
        </Pressable>
        <Text style={{ fontSize: 17, fontWeight: '700', color: tokens.text, letterSpacing: -0.3 }}>
          {t('newExpense')}
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
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        {/* Amount */}
        <View style={{ paddingTop: 14, paddingBottom: 4, alignItems: 'center' }}>
          <Text
            style={{
              fontSize: 11,
              fontWeight: '600',
              color: tokens.textTertiary,
              letterSpacing: 0.5,
              textTransform: 'uppercase',
            }}
          >
            {t('amount')}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 4 }}>
            {lang === 'en' ? (
              <Text style={{ fontSize: 36, fontWeight: '600', color: tokens.textSecondary }}>$</Text>
            ) : null}
            <Text
              style={{
                fontSize: 60,
                fontWeight: '800',
                letterSpacing: -2.5,
                color: amount ? tokens.text : tokens.textTertiary,
              }}
            >
              {amount || '0'}
            </Text>
            {lang === 'ru' ? (
              <Text style={{ fontSize: 28, fontWeight: '600', color: tokens.textSecondary }}>₽</Text>
            ) : null}
          </View>
        </View>

        {/* Category grid */}
        <View style={{ paddingHorizontal: 20, paddingVertical: 6 }}>
          <Text style={[styles.sectionLabel, { color: tokens.textTertiary }]}>{t('category')}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {categories.map((c) => {
              const on = catId === c.id;
              return (
                <Pressable
                  key={c.id}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setCatId(c.id);
                  }}
                  style={{ width: '18%', alignItems: 'center', gap: 4 }}
                >
                  <View
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 15,
                      backgroundColor: on ? c.color : dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                      alignItems: 'center',
                      justifyContent: 'center',
                      shadowColor: on ? c.color : 'transparent',
                      shadowOffset: { width: 0, height: 6 },
                      shadowOpacity: on ? 0.4 : 0,
                      shadowRadius: 12,
                    }}
                  >
                    <Text style={{ fontSize: 22 }}>{c.icon}</Text>
                  </View>
                  <Text
                    numberOfLines={1}
                    style={{
                      fontSize: 10,
                      color: on ? tokens.text : tokens.textSecondary,
                      fontWeight: on ? '600' : '500',
                    }}
                  >
                    {c.name.split(' ')[0]}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Note + date + envelope */}
        <View style={{ paddingHorizontal: 20, paddingVertical: 8 }}>
          <GlassCard radius={18}>
            <View
              style={[
                styles.fieldRow,
                {
                  borderBottomWidth: StyleSheet.hairlineWidth,
                  borderBottomColor: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
                },
              ]}
            >
              <Text style={[styles.fieldLabel, { color: tokens.textSecondary }]}>{t('note')}</Text>
              <TextInput
                value={note}
                onChangeText={setNote}
                placeholder={t('noteHint')}
                placeholderTextColor={tokens.textTertiary}
                style={[styles.input, { color: tokens.text }]}
              />
            </View>
            <View
              style={[
                styles.fieldRow,
                {
                  borderBottomWidth: StyleSheet.hairlineWidth,
                  borderBottomColor: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
                },
              ]}
            >
              <Text style={[styles.fieldLabel, { color: tokens.textSecondary }]}>{t('date')}</Text>
              <View style={{ flexDirection: 'row', gap: 6, flex: 1, flexWrap: 'wrap' }}>
                {[
                  { id: today, label: t('today') },
                  { id: yesterdayIso, label: t('yesterday') },
                ].map((d) => {
                  const on = date === d.id;
                  return (
                    <Pressable
                      key={d.id}
                      onPress={() => {
                        Haptics.selectionAsync();
                        dateRef.current?.close();
                        setDate(d.id);
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
                        {d.label}
                      </Text>
                    </Pressable>
                  );
                })}
                <Pressable
                  onPress={() => {
                    Haptics.selectionAsync();
                    dateRef.current?.toggle();
                  }}
                  style={{
                    paddingVertical: 6,
                    paddingHorizontal: 12,
                    borderRadius: 10,
                    backgroundColor: isCustomDate
                      ? CashlyTheme.accent.income
                      : dark
                        ? 'rgba(255,255,255,0.06)'
                        : 'rgba(0,0,0,0.04)',
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <Icon name="calendar" color={isCustomDate ? '#fff' : tokens.textSecondary} size={13} />
                  <Text
                    style={{ fontSize: 13, fontWeight: '600', color: isCustomDate ? '#fff' : tokens.textSecondary }}
                  >
                    {isCustomDate ? fmtDate(date, 'd MMM', lang) : t('pick')}
                  </Text>
                  <DateOverlay value={date} onChange={setDate} />
                </Pressable>
              </View>
            </View>
            <View style={styles.fieldRow}>
              <Text style={[styles.fieldLabel, { color: tokens.textSecondary }]}>{t('envSelect')}</Text>
              <View style={{ flexDirection: 'row', gap: 6, flex: 1, flexWrap: 'wrap' }}>
                {envelopes.map((e) => {
                  const on = envId === e.id;
                  return (
                    <Pressable
                      key={e.id}
                      onPress={() => {
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
        </View>

        <View style={{ alignItems: 'center', paddingHorizontal: 12 }}>
          <DatePicker ref={dateRef} value={date} onChange={setDate} />
        </View>

        {/* Numpad */}
        <View style={{ paddingHorizontal: 12, paddingTop: 8 }}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', lang === 'ru' ? ',' : '.', '0', 'back'].map((k) => (
              <NumKey key={k} k={k} onPress={press} />
            ))}
          </View>
        </View>
      </BottomSheetScrollView>
    </SheetShell>
  );
}

function NumKey({ k, onPress }: { k: string; onPress: (k: string) => void }) {
  const { tokens, dark } = useTokens();
  const isBack = k === 'back';
  return (
    <Pressable
      onPress={() => onPress(k)}
      style={({ pressed }) => ({
        width: '31.5%',
        height: 54,
        borderRadius: 16,
        backgroundColor: dark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.85)',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: pressed ? 0.7 : 1,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
      })}
    >
      {isBack ? (
        <Icon name="close" color={tokens.text} size={22} />
      ) : (
        <Text style={{ fontSize: 24, fontWeight: '500', color: tokens.text }}>{k}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 6,
    paddingBottom: 4,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginBottom: 8,
    paddingLeft: 4,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '500',
    width: 80,
  },
  input: {
    flex: 1,
    fontSize: 15,
    padding: 0,
  },
});
