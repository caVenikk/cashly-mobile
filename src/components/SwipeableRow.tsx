import React, { type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, runOnJS } from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

type Props = {
  children: ReactNode;
  rightActions: ReactNode;
  revealWidth?: number;
  onSwipeOpen?: () => void;
  onSwipeClose?: () => void;
};

export function SwipeableRow({ children, rightActions, revealWidth = 140, onSwipeOpen, onSwipeClose }: Props) {
  const tx = useSharedValue(0);
  const startTx = useSharedValue(0);

  const pan = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .failOffsetY([-8, 8])
    .onStart(() => {
      startTx.value = tx.value;
    })
    .onUpdate((e) => {
      const next = startTx.value + e.translationX;
      tx.value = Math.max(-revealWidth - 20, Math.min(0, next));
    })
    .onEnd((e) => {
      const shouldOpen = tx.value < -revealWidth / 2 || e.velocityX < -500;
      tx.value = withSpring(shouldOpen ? -revealWidth : 0, { damping: 22, stiffness: 240 });
      if (shouldOpen && onSwipeOpen) runOnJS(onSwipeOpen)();
      if (!shouldOpen && onSwipeClose) runOnJS(onSwipeClose)();
    });

  const animStyle = useAnimatedStyle(() => ({ transform: [{ translateX: tx.value }] }));

  // Fade the right-action layer based on how far the row is swiped. At rest (tx=0)
  // opacity is 0 so no bleed-through; starts showing as soon as the user begins to swipe.
  const actionsStyle = useAnimatedStyle(() => ({
    opacity: Math.min(1, Math.abs(tx.value) / 24),
  }));

  return (
    <View style={styles.wrap}>
      <Animated.View style={[styles.actions, { width: revealWidth }, actionsStyle]} pointerEvents="box-none">
        {rightActions}
      </Animated.View>
      <GestureDetector gesture={pan}>
        <Animated.View style={animStyle}>{children}</Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'relative',
    overflow: 'hidden',
  },
  actions: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingRight: 6,
    gap: 6,
  },
});
