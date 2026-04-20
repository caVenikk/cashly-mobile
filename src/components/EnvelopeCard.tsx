import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { EmojiBadge } from '@/src/components/glass/EmojiBadge';
import { GlassCard } from '@/src/components/glass/GlassCard';
import { useTokens } from '@/src/lib/themeMode';
import { useLang, useT } from '@/src/i18n';
import { fmt } from '@/src/lib/format';
import { CashlyTheme, alpha, shade } from '@/src/lib/theme';
import type { Envelope } from '@/src/types/db';

type Props = {
  env: Envelope;
  onPress?: () => void;
  onLongPress?: () => void;
};

export function EnvelopeCard({ env, onPress, onLongPress }: Props) {
  const { tokens, dark } = useTokens();
  const [lang] = useLang();
  const t = useT();

  const { pct, valueLine, subtitle, hasBar } = computeFill(env, lang, t);
  const overLimit = env.kind === 'limit' && pct >= 85;
  const fillColor = overLimit ? CashlyTheme.accent.expense : env.color;
  const kindLabel = t(
    `envKind_${env.kind}` as 'envKind_main' | 'envKind_safety' | 'envKind_bill' | 'envKind_limit' | 'envKind_goal',
  );

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={400}
      style={({ pressed }) => ({ transform: [{ scale: pressed ? 0.99 : 1 }], marginBottom: 10 })}
    >
      <GlassCard radius={22}>
        <View style={{ padding: 14 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <EmojiBadge emoji={env.emoji} color={env.color} size={44} radius={14} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text
                numberOfLines={1}
                style={{ fontSize: 15, fontWeight: '700', color: tokens.text, letterSpacing: -0.2 }}
              >
                {env.name}
              </Text>
              <Text
                numberOfLines={1}
                style={{
                  fontSize: 11,
                  color: tokens.textTertiary,
                  fontWeight: '600',
                  letterSpacing: 0.3,
                  textTransform: 'uppercase',
                  marginTop: 1,
                }}
              >
                {kindLabel}
                {env.kind === 'goal' && env.deadline ? ` · ${t('byDate')} ${env.deadline}` : ''}
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ fontSize: 17, fontWeight: '800', color: tokens.text, letterSpacing: -0.4 }}>
                {valueLine}
              </Text>
              {env.kind !== 'main' && env.kind !== 'safety' ? (
                <Text style={{ fontSize: 11, fontWeight: '700', color: fillColor }}>{pct}%</Text>
              ) : null}
            </View>
          </View>

          {hasBar ? (
            <View style={{ marginTop: 12 }}>
              <View
                style={{
                  height: 6,
                  borderRadius: 3,
                  overflow: 'hidden',
                  backgroundColor: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
                }}
              >
                <View
                  style={{
                    width: `${pct}%`,
                    height: '100%',
                    backgroundColor: fillColor,
                    borderRadius: 3,
                  }}
                />
              </View>
            </View>
          ) : null}

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
            <Text style={{ fontSize: 12, color: tokens.textSecondary }}>{subtitle}</Text>
          </View>
        </View>
      </GlassCard>
    </Pressable>
  );
}

function computeFill(
  env: Envelope,
  lang: 'ru' | 'en',
  t: (k: 'of' | 'envLimitLeft' | 'envLimitOver' | 'envTotal' | 'envKind_safety') => string,
) {
  let pct = 0;
  let valueLine = '';
  let subtitle = '';
  let hasBar = false;

  if (env.kind === 'main') {
    pct = 100;
    valueLine = fmt(Number(env.balance), lang);
    subtitle = t('envTotal');
  } else if (env.kind === 'safety') {
    valueLine = fmt(Number(env.balance), lang);
    subtitle = t('envKind_safety');
  } else if (env.kind === 'bill' && env.allocated) {
    pct = clamp(Math.round((Number(env.balance) / Number(env.allocated)) * 100));
    valueLine = fmt(Number(env.balance), lang);
    subtitle = `${t('of')} ${fmt(Number(env.allocated), lang)}`;
    hasBar = true;
  } else if (env.kind === 'limit' && env.monthly_limit) {
    pct = clamp(Math.round((Number(env.balance) / Number(env.monthly_limit)) * 100));
    const left = Number(env.monthly_limit) - Number(env.balance);
    valueLine = fmt(Number(env.balance), lang);
    subtitle = left >= 0 ? `${t('envLimitLeft')} ${fmt(left, lang)}` : `${t('envLimitOver')} ${fmt(-left, lang)}`;
    hasBar = true;
  } else if (env.kind === 'goal' && env.target) {
    pct = clamp(Math.round((Number(env.balance) / Number(env.target)) * 100));
    valueLine = fmt(Number(env.balance), lang);
    subtitle = `${t('of')} ${fmt(Number(env.target), lang)}`;
    hasBar = true;
  } else {
    valueLine = fmt(Number(env.balance), lang);
  }
  return { pct, valueLine, subtitle, hasBar };
}

function clamp(v: number): number {
  if (!Number.isFinite(v)) return 0;
  return Math.max(0, Math.min(100, v));
}

void StyleSheet;
void alpha;
void shade;
