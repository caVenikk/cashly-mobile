import { useMemo } from 'react';
import { Platform, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { Gesture, type PanGesture } from 'react-native-gesture-handler';
import { runOnJS, useSharedValue } from 'react-native-reanimated';

type Result = {
  gesture: PanGesture;
  onScroll: (e: NativeSyntheticEvent<NativeScrollEvent>) => void;
};

// Web-only pull-to-refresh via react-native-gesture-handler.
// RNW's RefreshControl doesn't wire up a pull gesture, so we wrap the
// ScrollView in a GestureDetector with a Pan that:
//   * only becomes active on downward drags past activeOffsetY
//   * tracks scrollY via a shared value written from onScroll
//   * fires onRefresh on end if we were at the top and pulled past `threshold`
// On native the gesture is disabled — RefreshControl already works there.
export function usePullToRefresh(onRefresh: () => void | Promise<unknown>, threshold = 60): Result {
  const scrollY = useSharedValue(0);

  const gesture = useMemo(() => {
    return Gesture.Pan()
      .enabled(Platform.OS === 'web')
      .activeOffsetY([10, 9999])
      .failOffsetY(-10)
      .onEnd((e) => {
        'worklet';
        if (scrollY.value <= 0 && e.translationY > threshold) {
          runOnJS(onRefresh)();
        }
      });
  }, [onRefresh, threshold, scrollY]);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>): void => {
    scrollY.value = e.nativeEvent.contentOffset.y;
  };

  return { gesture, onScroll };
}
