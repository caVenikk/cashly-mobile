import React, { useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { uiStore } from '@/src/stores/ui';
import { showSnackbar } from '@/src/stores/snackbar';
import Svg, { Circle } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRefresh } from '@/src/hooks/useRefresh';
import * as Haptics from 'expo-haptics';
import { GlassCard } from '@/src/components/glass/GlassCard';
import { CategoryBadge } from '@/src/components/glass/CategoryBadge';
import { Icon } from '@/src/components/Icon';
import { CategoryIcon } from '@/src/components/CategoryIcon';
import { Jiggle } from '@/src/components/Jiggle';
import { CashlyTheme } from '@/src/lib/theme';
import { useTokens } from '@/src/lib/themeMode';
import { useLang, useT } from '@/src/i18n';
import { fmt } from '@/src/lib/format';
import { errorMessage } from '@/src/lib/errors';
import { useCategories } from '@/src/hooks/useCategories';
import { useExpenses } from '@/src/hooks/useExpenses';
import type { Category } from '@/src/types/db';

export function CategoriesScreen() {
  const insets = useSafeAreaInsets();
  const { tokens, dark } = useTokens();
  const [lang] = useLang();
  const t = useT();
  const { categories, remove, refresh: refreshCat } = useCategories();
  const { expenses, refresh: refreshExp } = useExpenses();
  const [editing, setEditing] = useState(false);
  const [query, setQuery] = useState('');
  const { refreshing, onRefresh } = useRefresh([refreshCat, refreshExp]);

  const thirtyDaysAgo = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  }, []);

  const spendByCat = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of expenses) {
      if (e.date < thirtyDaysAgo) continue;
      if (!e.category_id) continue;
      map.set(e.category_id, (map.get(e.category_id) ?? 0) + Number(e.amount));
    }
    return map;
  }, [expenses, thirtyDaysAgo]);

  const total = Array.from(spendByCat.values()).reduce((s, v) => s + v, 0);

  const filtered = useMemo(
    () => categories.filter((c) => c.name.toLowerCase().includes(query.trim().toLowerCase())),
    [categories, query],
  );

  const onAdd = () => {
    Haptics.selectionAsync();
    uiStore.open('addCategory');
  };

  const onDelete = async (c: Category) => {
    try {
      await remove(c.id);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showSnackbar(t('snackDeleted'));
    } catch (e) {
      const msg = errorMessage(e) === 'CATEGORY_IN_USE' ? t('deleteCategoryBlocked') : errorMessage(e);
      showSnackbar(msg, 'error');
    }
  };

  return (
    <View style={{ flex: 1, paddingTop: insets.top + 6 }}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 90 }}
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
          <Text style={{ fontSize: 13, color: tokens.textSecondary, fontWeight: '500' }}>
            {t('spent30')} · {fmt(total, lang)}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 32, fontWeight: '800', color: tokens.text, letterSpacing: -0.8 }}>
              {t('categoriesTitle')}
            </Text>
            <Pressable
              onPress={() => {
                Haptics.selectionAsync();
                setEditing((v) => !v);
              }}
              style={{
                paddingVertical: 7,
                paddingHorizontal: 14,
                borderRadius: 16,
                backgroundColor: editing
                  ? CashlyTheme.accent.income
                  : dark
                    ? 'rgba(255,255,255,0.1)'
                    : 'rgba(0,0,0,0.06)',
              }}
            >
              <Text style={{ fontSize: 13, fontWeight: '600', color: editing ? '#fff' : tokens.text }}>
                {editing ? t('save') : t('customize')}
              </Text>
            </Pressable>
          </View>
        </View>

        <GlassCard strong style={{ marginHorizontal: 16, marginBottom: 16 }}>
          <View style={{ padding: 20 }}>
            <Donut categories={categories} spendByCat={spendByCat} total={total} />
          </View>
        </GlassCard>

        <View style={{ paddingHorizontal: 16, paddingBottom: 12 }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              paddingHorizontal: 14,
              paddingVertical: 10,
              borderRadius: 16,
              backgroundColor: dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
              borderWidth: StyleSheet.hairlineWidth,
              borderColor: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
            }}
          >
            <Icon name="search" color={tokens.textSecondary} size={16} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder={t('searchCategory')}
              placeholderTextColor={tokens.textTertiary}
              style={{ flex: 1, fontSize: 15, color: tokens.text, padding: 0 }}
            />
          </View>
        </View>

        <View style={{ paddingHorizontal: 16 }}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {filtered.map((c, i) => (
              <Jiggle key={c.id} active={editing} index={i} style={{ width: '31%' }}>
                <CatCard
                  c={c}
                  spend={spendByCat.get(c.id) ?? 0}
                  editing={editing}
                  onEdit={() => uiStore.openEditCategory(c.id)}
                  onDelete={() => onDelete(c)}
                  onLongPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    setEditing(true);
                  }}
                />
              </Jiggle>
            ))}
            <Pressable onPress={onAdd} style={{ width: '31%', minHeight: 100 }}>
              <GlassCard radius={20}>
                <View style={{ padding: 14, alignItems: 'center', gap: 8, minHeight: 100, justifyContent: 'center' }}>
                  <View
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: 18,
                      borderWidth: 1.5,
                      borderStyle: 'dashed',
                      borderColor: tokens.textTertiary,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Icon name="plus" color={tokens.textSecondary} size={22} />
                  </View>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: tokens.textSecondary, textAlign: 'center' }}>
                    {t('newCategory')}
                  </Text>
                </View>
              </GlassCard>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function CatCard({
  c,
  spend,
  editing,
  onEdit,
  onDelete,
  onLongPress,
}: {
  c: Category;
  spend: number;
  editing: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onLongPress: () => void;
}) {
  const { tokens } = useTokens();
  const [lang] = useLang();
  return (
    <Pressable
      onPress={() => {
        Haptics.selectionAsync();
        if (editing) onEdit();
      }}
      onLongPress={onLongPress}
      delayLongPress={400}
    >
      <GlassCard radius={20}>
        <View style={{ padding: 14, paddingTop: 16, alignItems: 'center', gap: 8, minHeight: 100 }}>
          {editing ? (
            <Pressable
              onPress={onDelete}
              hitSlop={8}
              style={{
                position: 'absolute',
                top: 6,
                right: 6,
                width: 22,
                height: 22,
                borderRadius: 11,
                backgroundColor: CashlyTheme.accent.expense,
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10,
              }}
            >
              <Icon name="close" color="#fff" size={12} />
            </Pressable>
          ) : null}
          <CategoryBadge color={c.color} size={52} radius={18}>
            <CategoryIcon icon={c.icon} size={22} />
          </CategoryBadge>
          <Text numberOfLines={1} style={{ fontSize: 12, fontWeight: '600', color: tokens.text, textAlign: 'center' }}>
            {c.name}
          </Text>
          <Text style={{ fontSize: 11, color: tokens.textSecondary }}>{spend > 0 ? fmt(spend, lang) : '—'}</Text>
        </View>
      </GlassCard>
    </Pressable>
  );
}

function Donut({
  categories,
  spendByCat,
  total,
}: {
  categories: Category[];
  spendByCat: Map<string, number>;
  total: number;
}) {
  const { tokens, dark } = useTokens();
  const [lang] = useLang();
  const shown = categories
    .map((c) => ({ c, spent: spendByCat.get(c.id) ?? 0 }))
    .filter((x) => x.spent > 0)
    .sort((a, b) => b.spent - a.spent);

  const size = 110;
  const stroke = 12;
  const R = (size - stroke) / 2;
  const C = 2 * Math.PI * R;

  let accum = 0;

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 18 }}>
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={R}
            stroke={dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'}
            strokeWidth={stroke}
            fill="none"
          />
          {shown.map((x) => {
            const share = total > 0 ? x.spent / total : 0;
            const len = share * C;
            const el = (
              <Circle
                key={x.c.id}
                cx={size / 2}
                cy={size / 2}
                r={R}
                stroke={x.c.color}
                strokeWidth={stroke}
                fill="none"
                strokeDasharray={`${Math.max(len - 2, 0)} ${C - Math.max(len - 2, 0)}`}
                strokeDashoffset={-accum}
                transform={`rotate(-90 ${size / 2} ${size / 2})`}
              />
            );
            accum += len;
            return el;
          })}
        </Svg>
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text
            style={{
              fontSize: 11,
              color: tokens.textTertiary,
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: 0.3,
            }}
          >
            {lang === 'ru' ? 'всего' : 'total'}
          </Text>
          <Text style={{ fontSize: 14, fontWeight: '800', color: tokens.text, letterSpacing: -0.3 }}>
            {fmt(total, lang)}
          </Text>
        </View>
      </View>
      <View style={{ flex: 1, gap: 5 }}>
        {shown.slice(0, 4).map((x) => {
          const share = total > 0 ? Math.round((x.spent / total) * 100) : 0;
          return (
            <View key={x.c.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: x.c.color }} />
              <Text numberOfLines={1} style={{ flex: 1, fontSize: 12, color: tokens.text, fontWeight: '500' }}>
                {x.c.name}
              </Text>
              <Text style={{ fontSize: 11, color: tokens.textSecondary, fontWeight: '600' }}>{share}%</Text>
            </View>
          );
        })}
        {shown.length === 0 ? <Text style={{ fontSize: 12, color: tokens.textSecondary }}>—</Text> : null}
      </View>
    </View>
  );
}
