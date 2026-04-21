import React, { useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GestureDetector } from 'react-native-gesture-handler';
import { useRefresh } from '@/src/hooks/useRefresh';
import { usePullToRefresh } from '@/src/hooks/usePullToRefresh';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { GlassCard } from '@/src/components/glass/GlassCard';
import { SegmentedControl } from '@/src/components/glass/SegmentedControl';
import { EnvelopeCard } from '@/src/components/EnvelopeCard';
import { Icon } from '@/src/components/Icon';
import { CashlyTheme, shade } from '@/src/lib/theme';
import { useTokens } from '@/src/lib/themeMode';
import { useLang, useT } from '@/src/i18n';
import { fmt } from '@/src/lib/format';
import { useEnvelopes } from '@/src/hooks/useEnvelopes';
import { uiStore } from '@/src/stores/ui';

type Tab = 'all' | 'goals' | 'buckets';

export function EnvelopesScreen() {
  const insets = useSafeAreaInsets();
  const { tokens, dark } = useTokens();
  const [lang] = useLang();
  const t = useT();
  const { envelopes, refresh: refreshEnv } = useEnvelopes();
  const [tab, setTab] = useState<Tab>('all');
  const { refreshing, onRefresh } = useRefresh([refreshEnv]);
  const { gesture, onScroll } = usePullToRefresh(onRefresh);

  const main = envelopes.find((e) => e.kind === 'main');
  const others = envelopes.filter((e) => e.kind !== 'main');
  const allocated = others.reduce((s, e) => s + Number(e.balance), 0);
  const total = (main ? Number(main.balance) : 0) + allocated;

  const filtered = useMemo(() => {
    if (tab === 'goals') return others.filter((e) => e.kind === 'goal');
    if (tab === 'buckets') return others.filter((e) => e.kind !== 'goal');
    return others;
  }, [tab, others]);

  return (
    <View style={{ flex: 1, paddingTop: insets.top + 6 }}>
      <GestureDetector gesture={gesture}>
        <ScrollView
          onScroll={onScroll}
          scrollEventThrottle={16}
          contentContainerStyle={{ paddingBottom: 140 }}
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={dark ? '#ffffff' : '#555555'}
              colors={['#555555']}
            />
          }
        >
          <View style={{ paddingHorizontal: 20, paddingVertical: 8 }}>
            <Text style={{ fontSize: 13, color: tokens.textSecondary, fontWeight: '500' }}>{t('envDivide')}</Text>
            <View style={styles.titleRow}>
              <Text style={{ fontSize: 32, fontWeight: '800', color: tokens.text, letterSpacing: -0.8 }}>
                {t('envelopes')}
              </Text>
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  uiStore.open('addEnvelope');
                }}
                style={styles.addBtn}
              >
                <Icon name="plus" color="#fff" size={22} />
              </Pressable>
            </View>
          </View>

          <GlassCard strong style={{ marginHorizontal: 16, marginBottom: 18 }}>
            <View style={{ padding: 20 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: '600',
                    color: tokens.textTertiary,
                    letterSpacing: 0.4,
                    textTransform: 'uppercase',
                  }}
                >
                  {t('envAllTotal')}
                </Text>
                <Pressable onPress={() => uiStore.openAllocate(null)}>
                  <LinearGradient
                    colors={[CashlyTheme.accent.purple, shade(CashlyTheme.accent.purple, -15)]}
                    start={{ x: 0.1, y: 0 }}
                    end={{ x: 0.9, y: 1 }}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 4,
                      paddingVertical: 6,
                      paddingHorizontal: 12,
                      borderRadius: 14,
                    }}
                  >
                    <Icon name="plus" color="#fff" size={13} />
                    <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>{t('envMove')}</Text>
                  </LinearGradient>
                </Pressable>
              </View>
              <Text style={{ fontSize: 34, fontWeight: '800', color: tokens.text, letterSpacing: -1, marginTop: 2 }}>
                {fmt(total, lang)}
              </Text>

              <View
                style={{
                  height: 10,
                  borderRadius: 5,
                  overflow: 'hidden',
                  marginTop: 14,
                  flexDirection: 'row',
                  backgroundColor: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
                }}
              >
                {main ? (
                  <View
                    style={{
                      width: `${total > 0 ? Math.round((Number(main.balance) / total) * 100) : 0}%`,
                      backgroundColor: CashlyTheme.accent.blue,
                    }}
                  />
                ) : null}
                {others.map((e) => (
                  <View
                    key={e.id}
                    style={{
                      width: `${total > 0 ? (Number(e.balance) / total) * 100 : 0}%`,
                      backgroundColor: e.color,
                    }}
                  />
                ))}
              </View>

              <View style={{ flexDirection: 'row', gap: 16, marginTop: 12 }}>
                <SumStat
                  color={CashlyTheme.accent.blue}
                  label={t('envAvailable')}
                  value={fmt(main ? Number(main.balance) : 0, lang)}
                  small={t('envMain')}
                />
                <SumStat
                  color={CashlyTheme.accent.purple}
                  label={t('envAllocated')}
                  value={fmt(allocated, lang)}
                  small={`${others.length} ${t('envCount')}`}
                />
              </View>
            </View>
          </GlassCard>

          <View style={{ marginHorizontal: 16, marginBottom: 14 }}>
            <SegmentedControl<Tab>
              options={[
                { id: 'all', label: t('envAll') },
                { id: 'goals', label: t('envGoals') },
                { id: 'buckets', label: t('envBuckets') },
              ]}
              active={tab}
              onChange={setTab}
            />
          </View>

          {tab === 'all' && main ? (
            <View style={{ paddingHorizontal: 16 }}>
              <View
                style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 6, paddingBottom: 8 }}
              >
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: CashlyTheme.accent.blue }} />
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: '700',
                    color: CashlyTheme.accent.blue,
                    letterSpacing: 0.6,
                    textTransform: 'uppercase',
                  }}
                >
                  {t('envMain')}
                </Text>
              </View>
              <EnvelopeCard env={main} onPress={() => uiStore.openEditEnvelope(main.id)} />
            </View>
          ) : null}

          <View style={{ paddingHorizontal: 16 }}>
            {tab === 'all' ? (
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: '700',
                  color: tokens.textTertiary,
                  letterSpacing: 0.6,
                  textTransform: 'uppercase',
                  paddingHorizontal: 6,
                  paddingVertical: 10,
                }}
              >
                {t('envYours')}
              </Text>
            ) : null}
            {filtered.map((e) => (
              <EnvelopeCard
                key={e.id}
                env={e}
                onPress={() => uiStore.openEditEnvelope(e.id)}
                onLongPress={() => uiStore.openAllocate(e.id)}
              />
            ))}
            {filtered.length === 0 ? (
              <GlassCard radius={22}>
                <View style={{ padding: 28, alignItems: 'center' }}>
                  <Text style={{ fontSize: 13, color: tokens.textSecondary }}>{t('emptyEnvelopes')}</Text>
                </View>
              </GlassCard>
            ) : null}
          </View>
        </ScrollView>
      </GestureDetector>
    </View>
  );
}

function SumStat({ color, label, value, small }: { color: string; label: string; value: string; small: string }) {
  const { tokens } = useTokens();
  return (
    <View style={{ flex: 1, minWidth: 0 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
        <Text
          style={{
            fontSize: 11,
            fontWeight: '600',
            color: tokens.textSecondary,
            letterSpacing: 0.2,
            textTransform: 'uppercase',
          }}
        >
          {label}
        </Text>
      </View>
      <Text style={{ fontSize: 18, fontWeight: '700', color: tokens.text, letterSpacing: -0.4, marginTop: 3 }}>
        {value}
      </Text>
      <Text style={{ fontSize: 11, color: tokens.textTertiary }}>{small}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: CashlyTheme.accent.income,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: CashlyTheme.accent.income,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
  },
});
