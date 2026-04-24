import React, { useEffect, useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { DatePicker, type DatePickerHandle } from '@/src/components/DatePicker';
import { DateOverlay } from '@/src/components/DateOverlay';
import * as Haptics from 'expo-haptics';
import { SheetShell } from './SheetShell';
import { GlassCard } from '@/src/components/glass/GlassCard';
import { CashlyTheme } from '@/src/lib/theme';
import { useTokens } from '@/src/lib/themeMode';
import { useLang, useT } from '@/src/i18n';
import { useSheet, useEditEnvelopeId } from '@/src/stores/ui';
import { fmtDate } from '@/src/lib/format';
import { errorMessage } from '@/src/lib/errors';
import { useEnvelopes } from '@/src/hooks/useEnvelopes';
import type { BillCadence } from '@/src/types/db';

const EMOJIS = ['💳', '🛟', '📄', '💡', '🏦', '🎉', '💻', '🗾', '🏠', '🎧', '🎁', '✈️', '🚗', '❤️', '⭐', '💎'];
const COLORS = [
  '#5AC8FA',
  '#4FD1C5',
  '#FF9F43',
  '#FFD160',
  '#AF82FF',
  '#FF7AA2',
  '#34C759',
  '#FF6B6B',
  '#63E6E2',
  '#F687B3',
];
const CADENCES: BillCadence[] = ['month', 'quarter', 'year'];

export function EditEnvelopeSheet() {
  const { open, setOpen } = useSheet('editEnvelope');
  const editId = useEditEnvelopeId();
  const { tokens, dark } = useTokens();
  const [lang] = useLang();
  const t = useT();
  const { envelopes, update, remove } = useEnvelopes();

  const env = envelopes.find((e) => e.id === editId);

  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState(EMOJIS[0]);
  const [color, setColor] = useState(COLORS[0]);
  const [balance, setBalance] = useState('');
  const [target, setTarget] = useState('');
  const [limit, setLimit] = useState('');
  const [allocated, setAllocated] = useState('');
  const [cadence, setCadence] = useState<BillCadence>('month');
  const [deadline, setDeadline] = useState<string>('');
  const dateRef = useRef<DatePickerHandle>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !env) return;
    setName(env.name);
    setEmoji(env.emoji);
    setColor(env.color);
    setBalance(String(env.balance));
    setTarget(env.target != null ? String(env.target) : '');
    setLimit(env.monthly_limit != null ? String(env.monthly_limit) : '');
    setAllocated(env.allocated != null ? String(env.allocated) : '');
    setCadence(env.cadence ?? 'month');
    setDeadline(env.deadline ?? '');
    dateRef.current?.close();
  }, [open, env]);

  if (!env) return null;

  const isMain = env.kind === 'main';
  const canSave = !saving && name.trim().length > 0;

  const onSave = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      await update(env.id, {
        name: name.trim(),
        emoji,
        color,
        balance: parseFloat(balance || '0'),
        target: env.kind === 'goal' ? (target ? parseFloat(target) : null) : null,
        monthly_limit: env.kind === 'limit' ? (limit ? parseFloat(limit) : null) : null,
        allocated: env.kind === 'bill' ? (allocated ? parseFloat(allocated) : null) : null,
        cadence: env.kind === 'bill' ? cadence : null,
        deadline: env.kind === 'goal' ? deadline || null : null,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setOpen(false);
    } catch (e) {
      Alert.alert('Ошибка', errorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const onDelete = () => {
    if (isMain) return;
    Alert.alert(
      env.name,
      lang === 'ru' ? 'Удалить конверт? Транзакции сохранятся.' : 'Delete envelope? Transactions stay.',
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await remove(env.id);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              setOpen(false);
            } catch (e) {
              Alert.alert('Ошибка', errorMessage(e));
            }
          },
        },
      ],
    );
  };

  return (
    <SheetShell open={open} onClose={() => setOpen(false)} snapPoints={['88%']}>
      <View style={styles.header}>
        <Pressable onPress={() => setOpen(false)} hitSlop={8}>
          <Text style={{ fontSize: 15, fontWeight: '500', color: tokens.textSecondary }}>{t('cancel')}</Text>
        </Pressable>
        <Text style={{ fontSize: 17, fontWeight: '700', color: tokens.text }}>{t('envelopeEdit')}</Text>
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
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        <GlassCard radius={18}>
          <Row label={t('envNewName')} first>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholderTextColor={tokens.textTertiary}
              style={{ flex: 1, fontSize: 15, color: tokens.text, padding: 0 }}
            />
          </Row>
          <Row label={t('newBalance')}>
            <TextInput
              value={balance}
              onChangeText={setBalance}
              keyboardType="numbers-and-punctuation"
              placeholder="0"
              placeholderTextColor={tokens.textTertiary}
              style={{ flex: 1, fontSize: 15, color: tokens.text, padding: 0 }}
            />
          </Row>

          {!isMain ? (
            <Row label={t('envNewEmoji')}>
              <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', flex: 1 }}>
                {EMOJIS.map((e) => {
                  const on = emoji === e;
                  return (
                    <Pressable
                      key={e}
                      onPress={() => setEmoji(e)}
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 10,
                        backgroundColor: on ? color : dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Text style={{ fontSize: 16 }}>{e}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </Row>
          ) : null}

          {!isMain ? (
            <Row label={t('envNewColor')}>
              <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', flex: 1 }}>
                {COLORS.map((c) => (
                  <Pressable
                    key={c}
                    onPress={() => setColor(c)}
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 12,
                      backgroundColor: c,
                      borderWidth: color === c ? 2 : 0,
                      borderColor: '#fff',
                    }}
                  />
                ))}
              </View>
            </Row>
          ) : null}

          {env.kind === 'goal' ? (
            <>
              <Row label={t('envNewTarget')}>
                <TextInput
                  value={target}
                  onChangeText={setTarget}
                  keyboardType="decimal-pad"
                  placeholderTextColor={tokens.textTertiary}
                  style={{ flex: 1, fontSize: 15, color: tokens.text, padding: 0 }}
                />
              </Row>
              <Pressable onPress={() => dateRef.current?.open()}>
                <Row label={t('envNewDeadline')} last={isMain}>
                  <Text style={{ fontSize: 15, fontWeight: '600', color: tokens.text }}>
                    {deadline ? fmtDate(deadline, 'd MMMM yyyy', lang) : '—'}
                  </Text>
                </Row>
                <DateOverlay value={deadline || new Date().toISOString().slice(0, 10)} onChange={setDeadline} />
              </Pressable>
            </>
          ) : null}

          {env.kind === 'limit' ? (
            <Row label={t('envNewLimit')} last>
              <TextInput
                value={limit}
                onChangeText={setLimit}
                keyboardType="decimal-pad"
                placeholderTextColor={tokens.textTertiary}
                style={{ flex: 1, fontSize: 15, color: tokens.text, padding: 0 }}
              />
            </Row>
          ) : null}

          {env.kind === 'bill' ? (
            <>
              <Row label={t('envNewAllocated')}>
                <TextInput
                  value={allocated}
                  onChangeText={setAllocated}
                  keyboardType="decimal-pad"
                  placeholderTextColor={tokens.textTertiary}
                  style={{ flex: 1, fontSize: 15, color: tokens.text, padding: 0 }}
                />
              </Row>
              <Row label={t('envNewCadence')} last>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  {CADENCES.map((c) => {
                    const on = cadence === c;
                    return (
                      <Pressable
                        key={c}
                        onPress={() => setCadence(c)}
                        style={{
                          paddingVertical: 5,
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
                          {t(`cadence_${c}` as 'cadence_month' | 'cadence_quarter' | 'cadence_year')}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </Row>
            </>
          ) : null}
        </GlassCard>

        {!isMain ? (
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
        ) : null}

        {env.kind === 'goal' ? (
          <DatePicker ref={dateRef} value={deadline || new Date().toISOString().slice(0, 10)} onChange={setDeadline} />
        ) : null}
      </BottomSheetScrollView>
    </SheetShell>
  );
}

function Row({
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
