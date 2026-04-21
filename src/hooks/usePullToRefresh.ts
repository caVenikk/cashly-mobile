import { useCallback, useRef } from 'react';
import { Platform, type GestureResponderEvent, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';

// Pull-to-refresh that hooks into ScrollView via normal React event props:
// onTouchStart/Move/End plus onScroll for position tracking. No window
// listeners, no Gesture Handler — the returned object is spread onto the
// ScrollView directly.
//
// Native is left untouched because RefreshControl already works there; the
// handlers are still returned so the call site is cross-platform.
type Handlers = {
  scrollEventThrottle: number;
  onScroll: (e: NativeSyntheticEvent<NativeScrollEvent>) => void;
  onTouchStart: (e: GestureResponderEvent) => void;
  onTouchMove: (e: GestureResponderEvent) => void;
  onTouchEnd: () => void;
  onTouchCancel: () => void;
};

export function usePullToRefresh(onRefresh: () => void | Promise<unknown>, threshold = 60): Handlers {
  const startY = useRef<number | null>(null);
  const distance = useRef(0);
  const atTop = useRef(true);

  const onScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    atTop.current = e.nativeEvent.contentOffset.y <= 0;
  }, []);

  const onTouchStart = useCallback((e: GestureResponderEvent) => {
    if (Platform.OS !== 'web') return;
    if (!atTop.current) {
      startY.current = null;
      return;
    }
    startY.current = e.nativeEvent.pageY;
    distance.current = 0;
  }, []);

  const onTouchMove = useCallback((e: GestureResponderEvent) => {
    if (Platform.OS !== 'web') return;
    if (startY.current == null) return;
    distance.current = e.nativeEvent.pageY - startY.current;
  }, []);

  const onTouchEnd = useCallback(() => {
    if (Platform.OS !== 'web') return;
    if (startY.current != null && distance.current > threshold) {
      void onRefresh();
    }
    startY.current = null;
    distance.current = 0;
  }, [onRefresh, threshold]);

  return {
    scrollEventThrottle: 16,
    onScroll,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    onTouchCancel: onTouchEnd,
  };
}
