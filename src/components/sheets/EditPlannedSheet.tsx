import React, { useEffect, useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View, ScrollView } from 'react-native';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { DatePicker, type DatePickerHandle } from '@/src/components/DatePicker';
import { DateOverlay } from '@/src/components/DateOverlay';
import * as Haptics from 'expo-haptics';
import { SheetShell } from './SheetShell';
import { GlassCard } from '@/src/components/glass/GlassCard';
import { CategoryIcon } from '@/src/components/CategoryIcon';
import { CashlyTheme } from '@/src/lib/theme';
import { useTokens } from '@/src/lib/themeMode';
import { useLang, useT } from '@/src/i18n';
import { useSheet, useEditPlannedId } from '@/src/stores/ui';
import { showSnackbar } from '@/src/stores/snackbar';
import { fmtDate, todayIso } from '@/src/lib/format';
import { errorMessage } from '@/src/lib/errors';
import { usePlanned } from '@/src/hooks/usePlanned';
import { useCategories } from '@/src/hooks/useCategories';

export function EditPlannedSheet() {
  const { open, setOpen } = useSheet('editPlanned');
  const editId = useEditPlannedId();
  const { tokens, dark } = useTokens();
  const [lang] = useLang();
  const t = useT();
  const { planned, update, remove } = usePlanned();
  const { categories } = useCategories();

  const plan = planned.find((p) => p.id === editId);

  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState<string | null>(null);
  const [catId, setCatId] = useState<string | null>(null);
  const dateRef = useRef<DatePickerHandle>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !plan) return;
    setName(plan.name);
    setAmount(String(plan.amount));
    setDate(plan.target_date);
    setCatId(plan.category_id);
    dateRef.current?.close();
  }, [open, plan]);

  if (!plan) return null;

  const canSave = !saving && name.trim().length > 0 && parseFloat(amount || '0') > 0;

  const onSave = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      await update(plan.id, {
        name: name.trim(),
        amount: parseFloat(amount),
        target_date: date,
        category_id: catId,
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

  const onDelete = () => {
    Alert.alert(plan.name, lang === 'ru' ? 'Удалить план?' : 'Delete plan?', [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('delete'),
        style: 'destructive',
        onPress: async () => {
          try {
            await remove(plan.id);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            showSnackbar(t('snackDeleted'));
            setOpen(false);
          } catch (e) {
            showSnackbar(errorMessage(e), 'error');
          }
        },
      },
    ]);
  };

  return (
    <SheetShell open={open} onClose={() => setOpen(false)} snapPoints={['75%']}>
      <View style={styles.header}>
        <Pressable onPress={() => setOpen(false)} hitSlop={8}>
          <Text style={{ fontSize: 15, fontWeight: '500', color: tokens.textSecondary }}>{t('cancel')}</Text>
        </Pressable>
        <Text style={{ fontSize: 17, fontWeight: '700', color: tokens.text }}>{t('editPlan')}</Text>
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
            <DateOverlay value={date || todayIso()} onChange={setDate} />
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

        {plan.is_done ? (
          <View
            style={{
              marginTop: 14,
              paddingVertical: 10,
              paddingHorizontal: 14,
              borderRadius: 12,
              backgroundColor: dark ? 'rgba(52,199,89,0.12)' : 'rgba(52,199,89,0.1)',
              borderWidth: StyleSheet.hairlineWidth,
              borderColor: 'rgba(52,199,89,0.3)',
            }}
          >
            <Text style={{ fontSize: 12, fontWeight: '600', color: CashlyTheme.accent.income }}>{t('paid')}</Text>
          </View>
        ) : null}

        <Pressable
          onPress={onDelete}
          style={{
            marginTop: 18,
            paddingVertical: 13,
            borderRadius: 14,
            alignItems: 'center',
            backgroundColor: dark ? 'rgba(255,107,107,0.12)' : 'rgba(255,107,107,0.08)',
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: 'rgba(255,107,107,0.35)',
          }}
        >
          <Text style={{ fontSize: 14, fontWeight: '700', color: CashlyTheme.accent.expense }}>{t('delete')}</Text>
        </Pressable>

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
