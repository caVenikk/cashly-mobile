import { useEffect } from 'react';
import { Platform } from 'react-native';

// Pull-to-refresh for React Native Web. RNW's RefreshControl is a no-op, and
// getScrollableNode() on a ScrollView ref doesn't reliably return the scrolling
// div. Instead we install document-level touch listeners and walk up from the
// touch target to find the nearest scrollable element (overflow:auto|scroll +
// actual overflow content). If that element is at scrollTop 0 and the user
// drags down past `threshold`, we fire onRefresh on touch end.
export function useWebPullToRefresh(onRefresh: () => void | Promise<unknown>, threshold = 70): void {
  useEffect(() => {
    if (Platform.OS !== 'web') return;

    let startY = 0;
    let pulling = false;
    let pullDistance = 0;

    const findScrollable = (el: Element | null): HTMLElement | null => {
      let current: Element | null = el;
      while (current && current instanceof HTMLElement) {
        const style = window.getComputedStyle(current);
        const overflow = style.overflowY;
        if ((overflow === 'auto' || overflow === 'scroll') && current.scrollHeight > current.clientHeight) {
          return current;
        }
        current = current.parentElement;
      }
      return null;
    };

    const onTouchStart = (e: TouchEvent): void => {
      if (e.touches.length !== 1) return;
      const scrollable = findScrollable(e.target as Element | null);
      const scrollTop = scrollable?.scrollTop ?? 0;
      if (scrollTop <= 0) {
        startY = e.touches[0].clientY;
        pulling = true;
        pullDistance = 0;
      } else {
        pulling = false;
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

    document.addEventListener('touchstart', onTouchStart, { passive: true });
    document.addEventListener('touchmove', onTouchMove, { passive: true });
    document.addEventListener('touchend', onTouchEnd, { passive: true });
    document.addEventListener('touchcancel', onTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', onTouchStart);
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('touchend', onTouchEnd);
      document.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [onRefresh, threshold]);
}
