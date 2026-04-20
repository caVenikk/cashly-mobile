import React, { useEffect, type ReactNode } from 'react';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import type { StyleProp, ViewStyle } from 'react-native';

type Props = {
  active: boolean;
  children: ReactNode;
  /** Used to seed the phase so sibling cards don't all wobble in sync. */
  index?: number;
  style?: StyleProp<ViewStyle>;
};

// iOS-style home screen jiggle: small rotation back-and-forth plus tiny translation.
export function Jiggle({ active, children, index = 0, style }: Props) {
  const rotation = useSharedValue(0);
  const tx = useSharedValue(0);

  useEffect(() => {
    if (active) {
      const phaseDelay = (index % 5) * 40; // 0..160ms so cards don't jiggle in sync
      const dur = 120;
      const amp = 1.2 + (index % 3) * 0.15; // slight amp variation

      rotation.value = withDelay(
        phaseDelay,
        withRepeat(
          withSequence(
            withTiming(-amp, { duration: dur, easing: Easing.inOut(Easing.quad) }),
            withTiming(amp, { duration: dur, easing: Easing.inOut(Easing.quad) }),
          ),
          -1,
          true,
        ),
      );
      tx.value = withDelay(
        phaseDelay,
        withRepeat(
          withSequence(
            withTiming(-0.6, { duration: dur, easing: Easing.inOut(Easing.quad) }),
            withTiming(0.6, { duration: dur, easing: Easing.inOut(Easing.quad) }),
          ),
          -1,
          true,
        ),
      );
    } else {
      cancelAnimation(rotation);
      cancelAnimation(tx);
      rotation.value = withTiming(0, { duration: 120 });
      tx.value = withTiming(0, { duration: 120 });
    }
    return () => {
      cancelAnimation(rotation);
      cancelAnimation(tx);
    };
  }, [active, index, rotation, tx]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }, { translateY: tx.value }],
  }));

  return <Animated.View style={[style, animStyle]}>{children}</Animated.View>;
}
