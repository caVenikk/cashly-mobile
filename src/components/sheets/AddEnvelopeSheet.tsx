import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, ScrollView } from 'react-native';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { DatePicker, type DatePickerHandle } from '@/src/components/DatePicker';
import { DateOverlay } from '@/src/components/DateOverlay';
import * as Haptics from 'expo-haptics';
import { SheetShell } from './SheetShell';
import { GlassCard } from '@/src/components/glass/GlassCard';
import { CashlyTheme } from '@/src/lib/theme';
import { useTokens } from '@/src/lib/themeMode';
import { useLang, useT } from '@/src/i18n';
import { useSheet } from '@/src/stores/ui';
import { showSnackbar } from '@/src/stores/snackbar';
import { fmtDate, todayIso } from '@/src/lib/format';
import { errorMessage } from '@/src/lib/errors';
import { useEnvelopes } from '@/src/hooks/useEnvelopes';
import type { BillCadence, EnvelopeKind } from '@/src/types/db';

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
const KINDS: EnvelopeKind[] = ['safety', 'bill', 'limit', 'goal'];
const CADENCES: BillCadence[] = ['month', 'quarter', 'year'];

export function AddEnvelopeSheet() {
  const { open, setOpen } = useSheet('addEnvelope');
  const { tokens, dark } = useTokens();
  const [lang] = useLang();
  const t = useT();
  const { create } = useEnvelopes();

  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState(EMOJIS[0]);
  const [color, setColor] = useState(COLORS[0]);
  const [kind, setKind] = useState<EnvelopeKind>('goal');
  const [target, setTarget] = useState('');
  const [limit, setLimit] = useState('');
  const [allocated, setAllocated] = useState('');
  const [cadence, setCadence] = useState<BillCadence>('month');
  const [deadline, setDeadline] = useState<string>(todayIso());
  const dateRef = useRef<DatePickerHandle>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setName('');
      setEmoji(EMOJIS[0]);
      setColor(COLORS[0]);
      setKind('goal');
      setTarget('');
      setLimit('');
      setAllocated('');
      setCadence('month');
      setDeadline(todayIso());
      dateRef.current?.close();
    }
  }, [open]);

  const canSave = useMemo(() => {
    if (saving) return false;
    if (!name.trim()) return false;
    if (kind === 'goal' && !(parseFloat(target) > 0)) return false;
    if (kind === 'limit' && !(parseFloat(limit) > 0)) return false;
    if (kind === 'bill' && !(parseFloat(allocated) > 0)) return false;
    return true;
  }, [saving, name, kind, target, limit, allocated]);

  const onSave = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      await create({
        name: name.trim(),
        emoji,
        color,
        kind,
        balance: 0,
        target: kind === 'goal' ? parseFloat(target) : null,
        monthly_limit: kind === 'limit' ? parseFloat(limit) : null,
        allocated: kind === 'bill' ? parseFloat(allocated) : null,
        cadence: kind === 'bill' ? cadence : null,
        deadline: kind === 'goal' ? deadline : null,
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

  return (
    <SheetShell open={open} onClose={() => setOpen(false)} snapPoints={['88%']}>
      <View style={styles.header}>
        <Pressable onPress={() => setOpen(false)} hitSlop={8}>
          <Text style={{ fontSize: 15, fontWeight: '500', color: tokens.textSecondary }}>{t('cancel')}</Text>
        </Pressable>
        <Text style={{ fontSize: 17, fontWeight: '700', color: tokens.text }}>{t('envNewTitle')}</Text>
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
          <Row label={t('envNewName')} first>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder={lang === 'ru' ? 'Путешествие в Японию' : 'Trip to Japan'}
              placeholderTextColor={tokens.textTertiary}
              style={{ flex: 1, fontSize: 15, color: tokens.text, padding: 0 }}
            />
          </Row>

          <Row label={t('envNewKind')}>
            <View style={{ flexDirection: 'row', gap: 6, flex: 1, flexWrap: 'wrap' }}>
              {KINDS.map((k) => {
                const on = kind === k;
                return (
                  <Pressable
                    key={k}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setKind(k);
                    }}
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
                      {t(`envKind_${k}` as 'envKind_safety' | 'envKind_bill' | 'envKind_limit' | 'envKind_goal')}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </Row>

          <Row label={t('envNewEmoji')}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                {EMOJIS.map((e) => {
                  const on = emoji === e;
                  return (
                    <Pressable
                      key={e}
                      onPress={() => setEmoji(e)}
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        backgroundColor: on ? color : dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Text style={{ fontSize: 18 }}>{e}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>
          </Row>

          <Row label={t('envNewColor')}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                {COLORS.map((c) => (
                  <Pressable
                    key={c}
                    onPress={() => setColor(c)}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 14,
                      backgroundColor: c,
                      borderWidth: color === c ? 2 : 0,
                      borderColor: '#fff',
                    }}
                  />
                ))}
              </View>
            </ScrollView>
          </Row>

          {kind === 'goal' ? (
            <>
              <Row label={t('envNewTarget')}>
                <TextInput
                  value={target}
                  onChangeText={setTarget}
                  keyboardType="decimal-pad"
                  placeholder="0"
                  placeholderTextColor={tokens.textTertiary}
                  style={{ flex: 1, fontSize: 15, color: tokens.text, padding: 0 }}
                />
              </Row>
              <Pressable onPress={() => dateRef.current?.open()}>
                <Row label={t('envNewDeadline')} last>
                  <Text style={{ fontSize: 15, fontWeight: '600', color: tokens.text }}>
                    {fmtDate(deadline, 'd MMMM yyyy', lang)}
                  </Text>
                </Row>
                <DateOverlay value={deadline} onChange={setDeadline} />
              </Pressable>
            </>
          ) : null}

          {kind === 'limit' ? (
            <Row label={t('envNewLimit')} last>
              <TextInput
                value={limit}
                onChangeText={setLimit}
                keyboardType="decimal-pad"
                placeholder="0"
                placeholderTextColor={tokens.textTertiary}
                style={{ flex: 1, fontSize: 15, color: tokens.text, padding: 0 }}
              />
            </Row>
          ) : null}

          {kind === 'bill' ? (
            <>
              <Row label={t('envNewAllocated')}>
                <TextInput
                  value={allocated}
                  onChangeText={setAllocated}
                  keyboardType="decimal-pad"
                  placeholder="0"
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

          {kind === 'safety' ? (
            <Row label="" last>
              <Text style={{ color: tokens.textTertiary, fontSize: 12 }}>{t('envKind_safety')}</Text>
            </Row>
          ) : null}
        </GlassCard>

        {kind === 'goal' ? <DatePicker ref={dateRef} value={deadline} onChange={setDeadline} /> : null}
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
