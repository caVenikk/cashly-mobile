import { useEffect, type RefObject } from 'react';
import { Platform, type ScrollView } from 'react-native';

// React Native Web's RefreshControl doesn't wire up an actual pull gesture —
// the prop renders nothing meaningful. This hook attaches raw touch listeners
// to the ScrollView's underlying DOM node and fires onRefresh when the user
// pulls down past the threshold while scrolled to the top.
export function useWebPullToRefresh(
  ref: RefObject<ScrollView | null>,
  onRefresh: () => void | Promise<unknown>,
  threshold = 70,
): void {
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const scrollView = ref.current;
    if (!scrollView) return;
    const node = (scrollView as unknown as { getScrollableNode?: () => HTMLElement }).getScrollableNode?.();
    if (!node) return;

    let startY = 0;
    let pulling = false;
    let pullDistance = 0;

    const onTouchStart = (e: TouchEvent): void => {
      if (node.scrollTop <= 0 && e.touches.length === 1) {
        startY = e.touches[0].clientY;
        pulling = true;
        pullDistance = 0;
      }
    };
    const onTouchMove = (e: TouchEvent): void => {
      if (!pulling || e.touches.length !== 1) return;
      pullDistance = e.touches[0].clientY - startY;
      if (pullDistance < 0) {
        pulling = false;
        pullDistance = 0;
      }
    };
    const onTouchEnd = (): void => {
      if (pulling && pullDistance > threshold) {
        void onRefresh();
      }
      pulling = false;
      pullDistance = 0;
    };

    node.addEventListener('touchstart', onTouchStart, { passive: true });
    node.addEventListener('touchmove', onTouchMove, { passive: true });
    node.addEventListener('touchend', onTouchEnd, { passive: true });
    node.addEventListener('touchcancel', onTouchEnd, { passive: true });

    return () => {
      node.removeEventListener('touchstart', onTouchStart);
      node.removeEventListener('touchmove', onTouchMove);
      node.removeEventListener('touchend', onTouchEnd);
      node.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [ref, onRefresh, threshold]);
}
