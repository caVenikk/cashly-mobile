import React from 'react';
import { View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { CashlyTheme } from '@/src/lib/theme';
import { useTokens , themeStore, useThemeMode } from '@/src/lib/themeMode';
import { Icon } from '@/src/components/Icon';
import { GlassIconBtn } from '@/src/components/glass/GlassIconBtn';
import { useLang, langStore, useT } from '@/src/i18n';
import { fmtDateObj } from '@/src/lib/format';

export function HomeHeader() {
  const { tokens } = useTokens();
  const [lang] = useLang();
  const [mode] = useThemeMode();
  const t = useT();

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 8,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <LinearGradient
          colors={[CashlyTheme.accent.purple, CashlyTheme.accent.pink]}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={{
            width: 42,
            height: 42,
            borderRadius: 21,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: CashlyTheme.accent.purple,
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.4,
            shadowRadius: 12,
          }}
        >
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 17 }}>C</Text>
        </LinearGradient>
        <View>
          <Text style={{ fontSize: 12, color: tokens.textSecondary, fontWeight: '500' }}>
            {fmtDateObj(new Date(), 'EEEE, d MMMM', lang)}
          </Text>
          <Text style={{ fontSize: 20, fontWeight: '700', color: tokens.text, letterSpacing: -0.3 }}>
            {t('greeting')}
          </Text>
        </View>
      </View>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <GlassIconBtn label={lang === 'ru' ? 'RU' : 'EN'} onPress={() => langStore.set(lang === 'ru' ? 'en' : 'ru')} />
        <GlassIconBtn
          icon={<Icon name={mode === 'dark' ? 'sun' : 'moon'} color={tokens.text} size={18} />}
          onPress={() => themeStore.toggle()}
        />
      </View>
    </View>
  );
}
