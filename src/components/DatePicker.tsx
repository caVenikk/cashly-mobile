import React, { forwardRef, useImperativeHandle, useState } from 'react';
import { Platform, View } from 'react-native';
import RNDateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { CashlyTheme } from '@/src/lib/theme';
import { useLang } from '@/src/i18n';
import { useTokens } from '@/src/lib/themeMode';

type Props = {
  value: string;
  onChange: (iso: string) => void;
};

export type DatePickerHandle = {
  open: () => void;
  close: () => void;
  toggle: () => void;
};

export const DatePicker = forwardRef<DatePickerHandle, Props>(function DatePicker({ value, onChange }, ref) {
  const { dark } = useTokens();
  const [lang] = useLang();
  const [visible, setVisible] = useState(false);

  useImperativeHandle(
    ref,
    () => ({
      open: () => setVisible(true),
      close: () => setVisible(false),
      toggle: () => setVisible((v) => !v),
    }),
    [],
  );

  if (!visible) return null;
  return (
    <View style={{ alignItems: 'center' }}>
      <RNDateTimePicker
        value={new Date(value)}
        mode="date"
        display={Platform.OS === 'ios' ? 'inline' : 'default'}
        onChange={(e: DateTimePickerEvent, selected?: Date) => {
          if (Platform.OS === 'android') setVisible(false);
          if (e.type === 'set' && selected) {
            const m = String(selected.getMonth() + 1).padStart(2, '0');
            const d = String(selected.getDate()).padStart(2, '0');
            onChange(`${selected.getFullYear()}-${m}-${d}`);
          }
        }}
        themeVariant={dark ? 'dark' : 'light'}
        accentColor={CashlyTheme.accent.income}
        locale={lang === 'ru' ? 'ru-RU' : 'en-US'}
      />
    </View>
  );
});
