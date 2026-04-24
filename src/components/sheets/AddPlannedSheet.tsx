import React, { useEffect, useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View, ScrollView } from 'react-native';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { DatePicker, type DatePickerHandle } from '@/src/components/DatePicker';
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
import { usePlanned } from '@/src/hooks/usePlanned';
import { useCategories } from '@/src/hooks/useCategories';

export function AddPlannedSheet() {
  const { open, setOpen } = useSheet('addPlanned');
  const { tokens, dark } = useTokens();
  const [lang] = useLang();
  const t = useT();
  const { create } = usePlanned();
  const { categories } = useCategories();

  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState<string | null>(null);
  const [catId, setCatId] = useState<string | null>(null);
  const dateRef = useRef<DatePickerHandle>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setName('');
      setAmount('');
      setDate(null);
      setCatId(categories[0]?.id ?? null);
      dateRef.current?.close();
    }
  }, [open, categories]);

  const canSave = !saving && name.trim().length > 0 && parseFloat(amount || '0') > 0;

  const onSave = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      await create({ name: name.trim(), amount: parseFloat(amount), target_date: date, category_id: catId });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setOpen(false);
    } catch (e) {
      Alert.alert('Ошибка', errorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <SheetShell open={open} onClose={() => setOpen(false)} snapPoints={['70%']}>
      <View style={styles.header}>
        <Pressable onPress={() => setOpen(false)} hitSlop={8}>
          <Text style={{ fontSize: 15, fontWeight: '500', color: tokens.textSecondary }}>{t('cancel')}</Text>
        </Pressable>
        <Text style={{ fontSize: 17, fontWeight: '700', color: tokens.text }}>{t('createPlan')}</Text>
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
          <FieldRow label={t('planName')} first>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder={lang === 'ru' ? 'Зимние шины' : 'Winter tires'}
              placeholderTextColor={tokens.textTertiary}
              style={{ flex: 1, fontSize: 15, color: tokens.text, padding: 0 }}
            />
          </FieldRow>
          <FieldRow label={t('amount')}>
            <TextInput
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              placeholder="0"
              placeholderTextColor={tokens.textTertiary}
              style={{ flex: 1, fontSize: 15, color: tokens.text, padding: 0 }}
            />
          </FieldRow>
          <Pressable onPress={() => dateRef.current?.open()}>
            <FieldRow label={t('planTarget')}>
              <Text style={{ fontSize: 15, fontWeight: '600', color: date ? tokens.text : tokens.textTertiary }}>
                {date ? fmtDate(date, 'd MMMM yyyy', lang) : '—'}
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

        <DatePicker ref={dateRef} value={date || todayIso()} onChange={setDate} />
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
