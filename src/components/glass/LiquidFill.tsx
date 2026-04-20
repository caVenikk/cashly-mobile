import React, { useEffect, useId } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming, Easing } from 'react-native-reanimated';
import Svg, { Defs, LinearGradient as SvgLinearGradient, Path, Stop } from 'react-native-svg';
import { shade } from '@/src/lib/theme';

type Props = {
  pct: number; // 0–100
  color: string;
  height: number;
  dark: boolean;
};

const WAVE_LEN = 180;
const WAVE_AMP = 4;

export function LiquidFill({ pct, color, height, dark }: Props) {
  const fillH = Math.max(10, (height * pct) / 100);
  const top = height - fillH;
  const tx1 = useSharedValue(0);
  const tx2 = useSharedValue(0);
  const idSafe = useId().replace(/[^a-zA-Z0-9]/g, '');
  const gradientId = `lg${idSafe}`;

  useEffect(() => {
    tx1.value = 0;
    tx2.value = -WAVE_LEN / 2;
    tx1.value = withRepeat(withTiming(-WAVE_LEN, { duration: 6000, easing: Easing.linear }), -1, false);
    tx2.value = withRepeat(withTiming(WAVE_LEN / 2, { duration: 4500, easing: Easing.linear }), -1, false);
  }, [tx1, tx2]);

  const anim1 = useAnimatedStyle(() => ({ transform: [{ translateX: tx1.value }] }));
  const anim2 = useAnimatedStyle(() => ({ transform: [{ translateX: tx2.value }] }));

  const path = `
    M 0,${top + WAVE_AMP}
    Q ${WAVE_LEN / 4},${top - WAVE_AMP} ${WAVE_LEN / 2},${top + WAVE_AMP}
    T ${WAVE_LEN},${top + WAVE_AMP}
    T ${WAVE_LEN * 1.5},${top + WAVE_AMP}
    T ${WAVE_LEN * 2},${top + WAVE_AMP}
    L ${WAVE_LEN * 2},${height}
    L 0,${height}
    Z
  `;

  const highlightPath = `
    M 0,${top + WAVE_AMP}
    Q ${WAVE_LEN / 4},${top - WAVE_AMP} ${WAVE_LEN / 2},${top + WAVE_AMP}
    T ${WAVE_LEN},${top + WAVE_AMP}
    T ${WAVE_LEN * 1.5},${top + WAVE_AMP}
    T ${WAVE_LEN * 2},${top + WAVE_AMP}
  `;

  return (
    <View style={[StyleSheet.absoluteFill, { overflow: 'hidden' }]} pointerEvents="none">
      <Animated.View style={[StyleSheet.absoluteFill, anim1]}>
        <Svg width={WAVE_LEN * 2} height={height} viewBox={`0 0 ${WAVE_LEN * 2} ${height}`} preserveAspectRatio="none">
          <Defs>
            <SvgLinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor={color} stopOpacity={dark ? 0.38 : 0.32} />
              <Stop offset="100%" stopColor={shade(color, -20)} stopOpacity={dark ? 0.55 : 0.45} />
            </SvgLinearGradient>
          </Defs>
          <Path d={path} fill={`url(#${gradientId})`} />
          {pct > 0 && pct < 100 ? (
            <Path
              d={highlightPath}
              stroke={shade(color, 30)}
              strokeOpacity={dark ? 0.55 : 0.7}
              strokeWidth={1.2}
              fill="none"
            />
          ) : null}
        </Svg>
      </Animated.View>
      <Animated.View style={[StyleSheet.absoluteFill, anim2, { opacity: dark ? 0.18 : 0.22 }]}>
        <Svg width={WAVE_LEN * 2} height={height} viewBox={`0 0 ${WAVE_LEN * 2} ${height}`} preserveAspectRatio="none">
          <Path d={path} fill={color} />
        </Svg>
      </Animated.View>
    </View>
  );
}
