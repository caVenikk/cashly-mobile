import React, { useCallback } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GestureDetector } from 'react-native-gesture-handler';
import { useRouter } from 'expo-router';
import { BalanceCard } from '@/src/components/home/BalanceCard';
import { HomeHeader } from '@/src/components/home/HomeHeader';
import { IncomeWidget } from '@/src/components/home/IncomeWidget';
import { QuickActions } from '@/src/components/home/QuickActions';
import { TxList } from '@/src/components/home/TxList';
import { UpcomingWidget } from '@/src/components/home/UpcomingWidget';
import { useCategories } from '@/src/hooks/useCategories';
import { useExpenses, useMonthExpenses } from '@/src/hooks/useExpenses';
import { useIncomes } from '@/src/hooks/useIncomes';
import { useRecurring } from '@/src/hooks/useRecurring';
import { useEnvelopes } from '@/src/hooks/useEnvelopes';
import { useRefresh } from '@/src/hooks/useRefresh';
import { usePullToRefresh } from '@/src/hooks/usePullToRefresh';
import { useTokens } from '@/src/lib/themeMode';
import { uiStore } from '@/src/stores/ui';

export function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { tokens, dark } = useTokens();

  const { expenses, remove: removeExpense, loading: loadingExp, refresh: refreshExp } = useExpenses();
  const { expenses: monthExpenses } = useMonthExpenses();
  const { incomes, loading: loadingInc, refresh: refreshInc } = useIncomes();
  const { recurring, refresh: refreshRec } = useRecurring();
  const { categories, refresh: refreshCat } = useCategories();
  const { refresh: refreshEnv } = useEnvelopes();

  const { refreshing, onRefresh } = useRefresh([refreshExp, refreshInc, refreshRec, refreshCat, refreshEnv]);
  const { gesture, onScroll } = usePullToRefresh(onRefresh);

  const onGoTo = useCallback(
    (name: 'plans' | 'envelopes' | 'recurring') => {
      router.push(`/(tabs)/${name}` as never);
    },
    [router],
  );

  const onDelete = useCallback(
    async (id: string) => {
      await removeExpense(id);
    },
    [removeExpense],
  );

  const initialLoading = loadingExp && loadingInc && expenses.length === 0;

  return (
    <View style={{ flex: 1, paddingTop: insets.top + 6 }}>
      <GestureDetector gesture={gesture}>
        <ScrollView
          onScroll={onScroll}
          scrollEventThrottle={16}
          contentContainerStyle={{ paddingBottom: 120 }}
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
          <HomeHeader />
          <BalanceCard monthExpenses={monthExpenses} incomes={incomes} />
          <IncomeWidget incomes={incomes} onOpenList={() => uiStore.open('income')} />
          <QuickActions onGoTo={onGoTo} />
          <UpcomingWidget recurring={recurring} categories={categories} onSeeAll={() => onGoTo('recurring')} />

          {initialLoading ? (
            <View style={{ padding: 40, alignItems: 'center' }}>
              <ActivityIndicator color={tokens.text} />
              <Text style={{ color: tokens.textSecondary, marginTop: 12, fontSize: 13 }}>Загрузка…</Text>
            </View>
          ) : (
            <TxList expenses={expenses} categories={categories} onDelete={onDelete} />
          )}
        </ScrollView>
      </GestureDetector>
    </View>
  );
}
