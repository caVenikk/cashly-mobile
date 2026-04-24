import React, { useEffect, useMemo, useState } from 'react';
import { Keyboard, Pressable, StyleSheet, Text, TextInput, TouchableWithoutFeedback, View } from 'react-native';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import * as Haptics from 'expo-haptics';
import { SheetShell } from './SheetShell';
import { Icon } from '@/src/components/Icon';
import { EmojiBadge } from '@/src/components/glass/EmojiBadge';
import { CashlyTheme } from '@/src/lib/theme';
import { useTokens } from '@/src/lib/themeMode';
import { useLang, useT } from '@/src/i18n';
import { fmt } from '@/src/lib/format';
import { errorMessage } from '@/src/lib/errors';
import { useSheet, useAllocateTarget } from '@/src/stores/ui';
import { showSnackbar } from '@/src/stores/snackbar';
import { useEnvelopes } from '@/src/hooks/useEnvelopes';
import type { Envelope } from '@/src/types/db';

const QUICK = [1000, 5000, 10000, 25000];

export function AllocateSheet() {
  const { open, setOpen } = useSheet('allocate');
  const initialToId = useAllocateTarget();
  const { tokens, dark } = useTokens();
  const [lang] = useLang();
  const t = useT();
  const { envelopes, allocate } = useEnvelopes();

  const [amount, setAmount] = useState<string>('5000');
  const [toId, setToId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const main = useMemo(() => envelopes.find((e) => e.kind === 'main'), [envelopes]);
  const dests = useMemo(() => envelopes.filter((e) => e.kind !== 'main'), [envelopes]);

  // Reset state only when sheet opens (transition false → true) or when a new target is requested.
  useEffect(() => {
    if (!open) return;
    setAmount('5000');
    setToId(initialToId ?? null);
  }, [open, initialToId]);

  const to = envelopes.find((e) => e.id === toId) || dests[0];
  const amt = parseFloat(amount || '0');
  const canSave = !saving && amt > 0 && main && to && amt <= Number(main.balance);

  const onSave = async () => {
    if (!canSave || !main || !to) return;
    Keyboard.dismiss();
    setSaving(true);
    try {
      await allocate(main.id, to.id, amt);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showSnackbar(t('snackAllocated'));
      setOpen(false);
    } catch (e) {
      showSnackbar(errorMessage(e), 'error');
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
        <Text style={{ fontSize: 17, fontWeight: '700', color: tokens.text }}>{t('envMoveTo')}</Text>
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
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <View>
            {/* Flow visual */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                padding: 14,
                borderRadius: 20,
                backgroundColor: dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                borderWidth: StyleSheet.hairlineWidth,
                borderColor: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                marginBottom: 16,
              }}
            >
              <EnvChip env={main} label={t('envFrom')} />
              <View
                style={{ flex: 1, height: 2, backgroundColor: to?.color ?? CashlyTheme.accent.purple, opacity: 0.5 }}
              />
              <Icon name="chevRight" color={to?.color ?? CashlyTheme.accent.purple} size={16} />
              <EnvChip env={to} label={t('envTo')} />
            </View>

            {/* Amount input */}
            <View style={{ alignItems: 'center', paddingVertical: 6 }}>
              <Text
                style={{
                  fontSize: 11,
                  color: tokens.textTertiary,
                  fontWeight: '600',
                  letterSpacing: 0.5,
                  textTransform: 'uppercase',
                }}
              >
                {t('amount')}
              </Text>
              <TextInput
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
                returnKeyType="done"
                onSubmitEditing={Keyboard.dismiss}
                style={{
                  fontSize: 48,
                  fontWeight: '800',
                  color: tokens.text,
                  letterSpacing: -1.5,
                  marginTop: 2,
                  padding: 0,
                  textAlign: 'center',
                  minWidth: 120,
                }}
                placeholder="0"
                placeholderTextColor={tokens.textTertiary}
              />
              <Text style={{ fontSize: 12, color: tokens.textSecondary, marginTop: 2 }}>
                / {main ? fmt(Number(main.balance), lang) : '—'}
              </Text>
            </View>

            <View style={{ flexDirection: 'row', gap: 6, marginTop: 16, marginBottom: 16 }}>
              {QUICK.map((q) => {
                const on = amt === q;
                return (
                  <Pressable
                    key={q}
                    onPress={() => {
                      Keyboard.dismiss();
                      Haptics.selectionAsync();
                      setAmount(String(q));
                    }}
                    style={{
                      flex: 1,
                      paddingVertical: 9,
                      borderRadius: 12,
                      backgroundColor: on
                        ? (to?.color ?? CashlyTheme.accent.purple)
                        : dark
                          ? 'rgba(255,255,255,0.06)'
                          : 'rgba(0,0,0,0.04)',
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ fontSize: 13, fontWeight: '700', color: on ? '#fff' : tokens.text }}>
                      {fmt(q, lang)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text
              style={{
                fontSize: 11,
                fontWeight: '600',
                color: tokens.textTertiary,
                letterSpacing: 0.4,
                textTransform: 'uppercase',
                paddingHorizontal: 4,
                paddingBottom: 8,
              }}
            >
              {t('envTo')}
            </Text>
            {dests.length === 0 ? (
              <Text style={{ fontSize: 13, color: tokens.textSecondary, paddingHorizontal: 4 }}>
                {t('emptyEnvelopes')}
              </Text>
            ) : (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {dests.map((e) => {
                  const on = (to?.id ?? null) === e.id;
                  return (
                    <Pressable
                      key={e.id}
                      onPress={() => {
                        Keyboard.dismiss();
                        Haptics.selectionAsync();
                        setToId(e.id);
                      }}
                      style={{
                        width: '23%',
                        padding: 10,
                        borderRadius: 14,
                        backgroundColor: on ? `${e.color}22` : dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                        borderWidth: 1,
                        borderColor: on ? e.color : dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <Text style={{ fontSize: 20 }}>{e.emoji}</Text>
                      <Text
                        numberOfLines={2}
                        style={{ fontSize: 10, fontWeight: '600', color: tokens.textSecondary, textAlign: 'center' }}
                      >
                        {e.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </View>
        </TouchableWithoutFeedback>
      </BottomSheetScrollView>
    </SheetShell>
  );
}

function EnvChip({ env, label }: { env: Envelope | undefined; label: string }) {
  const { tokens } = useTokens();
  if (!env) return <View style={{ flex: 0 }} />;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <EmojiBadge emoji={env.emoji} color={env.color} size={34} radius={11} />
      <View>
        <Text
          style={{
            fontSize: 9,
            fontWeight: '700',
            color: tokens.textTertiary,
            letterSpacing: 0.4,
            textTransform: 'uppercase',
          }}
        >
          {label}
        </Text>
        <Text numberOfLines={1} style={{ fontSize: 12, fontWeight: '700', color: tokens.text, maxWidth: 90 }}>
          {env.name}
        </Text>
      </View>
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
