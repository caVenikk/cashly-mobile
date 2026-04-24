import React, { useEffect, useState } from 'react';
import { Alert, Keyboard, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import * as Haptics from 'expo-haptics';
import { SheetShell } from './SheetShell';
import { GlassCard } from '@/src/components/glass/GlassCard';
import { Icon, type IconName } from '@/src/components/Icon';
import { CategoryIcon } from '@/src/components/CategoryIcon';
import { CashlyTheme } from '@/src/lib/theme';
import { useTokens } from '@/src/lib/themeMode';
import { useT } from '@/src/i18n';
import { useSheet, useEditCategoryId } from '@/src/stores/ui';
import { showSnackbar } from '@/src/stores/snackbar';
import { errorMessage } from '@/src/lib/errors';
import { useCategories } from '@/src/hooks/useCategories';

const EMOJIS = [
  '☕',
  '🍔',
  '🍕',
  '🍺',
  '🍷',
  '🍣',
  '🚗',
  '🚕',
  '✈️',
  '🚊',
  '⛽',
  '🚲',
  '🏠',
  '💡',
  '🔌',
  '📶',
  '🔧',
  '🧹',
  '🎬',
  '🎮',
  '🎵',
  '📖',
  '🎨',
  '🎸',
  '💊',
  '💪',
  '🏋️',
  '🧘',
  '🏥',
  '💉',
  '🛍️',
  '👕',
  '👟',
  '💍',
  '🎁',
  '👗',
  '📱',
  '💻',
  '🖥️',
  '🎧',
  '📷',
  '⌚',
  '💼',
  '📚',
  '🎓',
  '🐶',
  '🐱',
  '🌱',
  '💰',
  '💳',
  '📦',
  '📝',
  '🔔',
  '⭐',
];

const SVG_ICONS: IconName[] = [
  'coffee',
  'cart',
  'car',
  'bag',
  'film',
  'house',
  'heart',
  'plane',
  'gift',
  'cards',
  'briefcase',
  'wifi',
  'music',
  'cloud',
  'play',
  'bell',
  'bolt',
];

const COLORS = [
  '#FF9F43',
  '#5AC8FA',
  '#AF82FF',
  '#FF7AA2',
  '#4FD1C5',
  '#FF6B6B',
  '#FFD160',
  '#63E6E2',
  '#F687B3',
  '#34C759',
  '#B0B0B0',
];

export function EditCategorySheet() {
  const { open, setOpen } = useSheet('editCategory');
  const editId = useEditCategoryId();
  const { tokens, dark } = useTokens();
  const t = useT();
  const { categories, update, remove } = useCategories();
  const cat = categories.find((c) => c.id === editId);

  const [name, setName] = useState('');
  const [icon, setIcon] = useState<string>(EMOJIS[0]);
  const [customIcon, setCustomIcon] = useState('');
  const [color, setColor] = useState(COLORS[0]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !cat) return;
    setName(cat.name);
    setIcon(cat.icon);
    setCustomIcon('');
    setColor(cat.color);
  }, [open, cat]);

  if (!cat) return null;

  const effectiveIcon = customIcon.trim() ? customIcon.trim() : icon;
  const canSave = !saving && name.trim().length > 0 && effectiveIcon.length > 0;

  const onSave = async () => {
    if (!canSave) return;
    Keyboard.dismiss();
    setSaving(true);
    try {
      await update(cat.id, { name: name.trim(), icon: effectiveIcon, color });
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
    Alert.alert(cat.name, 'Удалить категорию? Нельзя если есть траты.', [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('delete'),
        style: 'destructive',
        onPress: async () => {
          try {
            await remove(cat.id);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            showSnackbar(t('snackDeleted'));
            setOpen(false);
          } catch (e) {
            const msg = errorMessage(e) === 'CATEGORY_IN_USE' ? t('deleteCategoryBlocked') : errorMessage(e);
            showSnackbar(msg, 'error');
          }
        },
      },
    ]);
  };

  return (
    <SheetShell open={open} onClose={() => setOpen(false)} snapPoints={['90%']}>
      <View style={styles.header}>
        <Pressable onPress={() => setOpen(false)} hitSlop={8}>
          <Text style={{ fontSize: 15, fontWeight: '500', color: tokens.textSecondary }}>{t('cancel')}</Text>
        </Pressable>
        <Text style={{ fontSize: 17, fontWeight: '700', color: tokens.text }}>{cat.name}</Text>
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
        contentContainerStyle={{ padding: 16, paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        <View style={{ alignItems: 'center', paddingVertical: 14 }}>
          <View
            style={{
              width: 76,
              height: 76,
              borderRadius: 22,
              backgroundColor: color,
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: color,
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.4,
              shadowRadius: 16,
            }}
          >
            <CategoryIcon icon={effectiveIcon} size={38} />
          </View>
          <Text style={{ marginTop: 10, fontSize: 15, fontWeight: '700', color: tokens.text }}>
            {name.trim() || cat.name}
          </Text>
        </View>

        <GlassCard radius={18}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 14,
              paddingVertical: 12,
              gap: 10,
              borderBottomWidth: StyleSheet.hairlineWidth,
              borderBottomColor: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
            }}
          >
            <Text style={{ fontSize: 13, fontWeight: '500', color: tokens.textSecondary, width: 100 }}>
              {t('createCategoryName')}
            </Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder={cat.name}
              placeholderTextColor={tokens.textTertiary}
              returnKeyType="done"
              onSubmitEditing={Keyboard.dismiss}
              style={{ flex: 1, fontSize: 15, color: tokens.text, padding: 0 }}
            />
          </View>
          <View
            style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, gap: 10 }}
          >
            <Text style={{ fontSize: 13, fontWeight: '500', color: tokens.textSecondary, width: 100 }}>
              Свой символ
            </Text>
            <TextInput
              value={customIcon}
              onChangeText={setCustomIcon}
              placeholder="Эмодзи"
              placeholderTextColor={tokens.textTertiary}
              returnKeyType="done"
              onSubmitEditing={Keyboard.dismiss}
              maxLength={4}
              style={{ flex: 1, fontSize: 18, color: tokens.text, padding: 0 }}
            />
          </View>
        </GlassCard>

        <Text style={styles.sectionLabel}>{t('createCategoryIcon')}</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {EMOJIS.map((e) => {
            const on = !customIcon && icon === e;
            return (
              <Pressable
                key={e}
                onPress={() => {
                  Haptics.selectionAsync();
                  setCustomIcon('');
                  setIcon(e);
                }}
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: 14,
                  backgroundColor: on ? color : dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ fontSize: 22 }}>{e}</Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.sectionLabel}>SVG иконки</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {SVG_ICONS.map((n) => {
            const key = `svg:${n}`;
            const on = !customIcon && icon === key;
            return (
              <Pressable
                key={key}
                onPress={() => {
                  Haptics.selectionAsync();
                  setCustomIcon('');
                  setIcon(key);
                }}
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: 14,
                  backgroundColor: on ? color : dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon name={n} color={on ? '#fff' : tokens.text} size={22} />
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.sectionLabel}>{t('createCategoryColor')}</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {COLORS.map((c) => (
            <Pressable
              key={c}
              onPress={() => {
                Haptics.selectionAsync();
                setColor(c);
              }}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: c,
                borderWidth: color === c ? 3 : 0,
                borderColor: '#fff',
              }}
            />
          ))}
        </View>

        <Pressable
          onPress={onDelete}
          style={{
            marginTop: 20,
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
      </BottomSheetScrollView>
    </SheetShell>
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
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(235,235,245,0.6)',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginTop: 20,
    marginBottom: 10,
    paddingHorizontal: 4,
  },
});
