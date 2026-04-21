import React from 'react';
import { View, Text } from 'react-native';
import { useTokens, themeStore, useThemeMode } from '@/src/lib/themeMode';
import { Icon } from '@/src/components/Icon';
import { GlassIconBtn } from '@/src/components/glass/GlassIconBtn';
import { useLang, langStore } from '@/src/i18n';
import { fmtDateObj } from '@/src/lib/format';

export function HomeHeader() {
  const { tokens } = useTokens();
  const [lang] = useLang();
  const [mode] = useThemeMode();

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
      <Text
        style={{
          flex: 1,
          fontSize: 26,
          fontWeight: '800',
          color: tokens.text,
          letterSpacing: -0.6,
        }}
      >
        {fmtDateObj(new Date(), 'EEEE, d MMMM', lang)}
      </Text>
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
