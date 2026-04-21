import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, View, Text, StyleSheet, type LayoutChangeEvent } from 'react-native';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedReaction,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { CashlyTheme, alpha } from '@/src/lib/theme';
import { useTokens } from '@/src/lib/themeMode';
import { Icon, type IconName } from './Icon';
import { FAB } from './FAB';
import { uiStore } from '@/src/stores/ui';
import { useT } from '@/src/i18n';

const ICON_FOR: Record<string, IconName> = {
  index: 'home',
  recurring: 'repeat',
  plans: 'calendar',
  envelopes: 'target',
  categories: 'grid',
};

const LABEL_KEY_FOR: Record<string, 'home' | 'recurring' | 'plans' | 'envelopes' | 'categories'> = {
  index: 'home',
  recurring: 'recurring',
  plans: 'plans',
  envelopes: 'envelopes',
  categories: 'categories',
};

const PAD_H = 4;
const FAB_SIZE = 54;
const PILL_HEIGHT = 60;
const SPRING_DAMPING = 22;
const SPRING_STIFFNESS = 260;
const SPRING_MASS = 0.6;

export function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const { dark, tokens } = useTokens();
  const t = useT();
  // On web the CSS variable `--cashly-sab` (declared in +html.tsx) carries
  // env(safe-area-inset-bottom), so the position reacts to the iOS home
  // indicator through pure CSS — no listeners, no runtime measurement. On
  // native we use the provider value.
  const insets = useSafeAreaInsets();
  const bottomStyle =
    Platform.OS === 'web'
      ? { bottom: 'calc(var(--cashly-sab, 0px) + 8px)' as unknown as number }
      : { bottom: Math.max(8, insets.bottom) };
  const textOff = dark ? 'rgba(235,235,245,0.5)' : 'rgba(60,60,67,0.55)';
  const accent = CashlyTheme.accent.income;

  const [pillWidth, setPillWidth] = useState(0);
  const tabCount = state.routes.length;
  const tabWidth = pillWidth > 0 ? (pillWidth - PAD_H * 2) / tabCount : 0;

  const lensX = useSharedValue(0);
  const pressed = useSharedValue(0);
  const dragging = useSharedValue(0);
  const lastIndex = useRef(state.index);

  const onSelectByIndex = useCallback(
    (idx: number) => {
      const route = state.routes[idx];
      if (!route) return;
      if (lastIndex.current === idx) return;
      lastIndex.current = idx;
      Haptics.selectionAsync();
      const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
      if (!event.defaultPrevented) {
        navigation.navigate(route.name);
      }
    },
    [navigation, state.routes],
  );

  useEffect(() => {
    if (tabWidth === 0) return;
    lastIndex.current = state.index;
    const target = PAD_H + state.index * tabWidth + tabWidth / 2;
    if (lensX.value === 0) lensX.value = target;
    else if (!dragging.value) {
      lensX.value = withSpring(target, {
        damping: SPRING_DAMPING,
        stiffness: SPRING_STIFFNESS,
        mass: SPRING_MASS,
      });
    }
  }, [state.index, tabWidth, lensX, dragging]);

  const hoveredIndex = useDerivedValue(() => {
    if (tabWidth === 0) return 0;
    const idx = Math.floor((lensX.value - PAD_H) / tabWidth);
    return Math.max(0, Math.min(tabCount - 1, idx));
  }, [tabWidth, tabCount]);

  useAnimatedReaction(
    () => (dragging.value ? hoveredIndex.value : -1),
    (idx, prev) => {
      if (idx < 0 || idx === prev || idx == null) return;
      runOnJS(onSelectByIndex)(idx);
    },
    [onSelectByIndex],
  );

  // Plain tap: springs lens to tapped tab's center and navigates.
  const tap = Gesture.Tap()
    .maxDuration(500)
    .onEnd((e, success) => {
      'worklet';
      if (!success) return;
      const w = tabWidth;
      if (w === 0) return;
      const rawIdx = Math.floor((e.x - PAD_H) / w);
      const idx = rawIdx < 0 ? 0 : rawIdx > tabCount - 1 ? tabCount - 1 : rawIdx;
      const target = PAD_H + idx * w + w / 2;
      lensX.value = withSpring(target, {
        damping: SPRING_DAMPING,
        stiffness: SPRING_STIFFNESS,
        mass: SPRING_MASS,
      });
      runOnJS(onSelectByIndex)(idx);
    });

  // Drag: lens follows finger, navigates as finger crosses tab boundaries.
  const pan = Gesture.Pan()
    .minDistance(8)
    .onBegin(() => {
      'worklet';
      pressed.value = withTiming(1, { duration: 140 });
    })
    .onStart(() => {
      'worklet';
      dragging.value = 1;
    })
    .onChange((e) => {
      'worklet';
      const w = tabWidth;
      if (w === 0) return;
      const minX = PAD_H + w / 2;
      const maxX = PAD_H + (tabCount - 1) * w + w / 2;
      const x = e.x < minX ? minX : e.x > maxX ? maxX : e.x;
      lensX.value = x;
    })
    .onFinalize((e, success) => {
      'worklet';
      pressed.value = withTiming(0, { duration: 220 });
      if (!success || !dragging.value) {
        dragging.value = 0;
        return;
      }
      dragging.value = 0;
      const w = tabWidth;
      if (w === 0) return;
      const rawIdx = Math.floor((e.x - PAD_H) / w);
      const idx = rawIdx < 0 ? 0 : rawIdx > tabCount - 1 ? tabCount - 1 : rawIdx;
      const target = PAD_H + idx * w + w / 2;
      lensX.value = withSpring(target, {
        damping: SPRING_DAMPING,
        stiffness: SPRING_STIFFNESS,
        mass: SPRING_MASS,
      });
      runOnJS(onSelectByIndex)(idx);
    });

  const gesture = Gesture.Simultaneous(tap, pan);

  const lensStyle = useAnimatedStyle(() => {
    const w = tabWidth;
    if (w === 0) return { opacity: 0 };
    const lensW = Math.max(42, w);
    return {
      left: lensX.value - lensW / 2,
      width: lensW,
      transform: [{ scale: 1 + pressed.value * 0.08 }],
      opacity: 0.1 + pressed.value * 0.15,
    };
  }, [tabWidth]);

  const onPillLayout = (e: LayoutChangeEvent) => {
    setPillWidth(e.nativeEvent.layout.width);
  };

  return (
    <View style={[styles.wrap, bottomStyle]} pointerEvents="box-none">
      <View
        style={[
          styles.pill,
          { backgroundColor: tokens.tabBg, borderColor: dark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.06)' },
        ]}
        onLayout={onPillLayout}
      >
        <BlurView
          intensity={dark ? 60 : 80}
          tint={dark ? 'dark' : 'light'}
          style={[StyleSheet.absoluteFill, { borderRadius: 999 }]}
        />

        {pillWidth > 0 ? (
          <Animated.View
            style={[styles.lens, { backgroundColor: alpha(CashlyTheme.accent.income, 1) }, lensStyle]}
            pointerEvents="none"
          />
        ) : null}

        <GestureDetector gesture={gesture}>
          <View style={styles.row}>
            {state.routes.map((route, index) => {
              const isFocused = state.index === index;
              const iconName = ICON_FOR[route.name] ?? 'grid';
              const labelKey = LABEL_KEY_FOR[route.name] ?? 'home';
              return (
                <View key={route.key} style={styles.tabItem} pointerEvents="none">
                  <View style={styles.iconHolder}>
                    <Icon name={iconName} color={isFocused ? accent : textOff} size={22} />
                  </View>
                  <Text
                    style={{
                      fontSize: 8,
                      fontWeight: '600',
                      color: isFocused ? accent : textOff,
                      marginTop: 2,
                      textAlign: 'center',
                      alignSelf: 'stretch',
                    }}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                    allowFontScaling={false}
                  >
                    {t(labelKey)}
                  </Text>
                </View>
              );
            })}
          </View>
        </GestureDetector>
      </View>
      <View style={{ marginLeft: 8 }} pointerEvents="auto">
        <FAB onPress={() => uiStore.open('addExpense')} size={FAB_SIZE} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  pill: {
    flex: 1,
    height: PILL_HEIGHT,
    borderRadius: 999,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.25,
    shadowRadius: 32,
  },
  lens: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(52,199,89,0.2)',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: PAD_H,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 0,
    minWidth: 0,
  },
  iconHolder: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
