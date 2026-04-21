import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// On web, react-native-safe-area-context reports {bottom: 0} — it doesn't
// read env(safe-area-inset-bottom) from CSS. So we measure it ourselves with
// a hidden probe element. On native we use the real insets from the provider.
//
// iOS Safari PWA sometimes lags on the first measurement (viewport not fully
// set up on initial paint), so we re-measure after a short delay and on
// every resize/orientationchange.
export function useSafeAreaBottom(): number {
  const insets = useSafeAreaInsets();
  const [webInset, setWebInset] = useState(0);

  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const measure = (): void => {
      const probe = document.createElement('div');
      probe.style.cssText =
        'position:fixed;bottom:0;left:0;width:1px;height:1px;pointer-events:none;opacity:0;padding-bottom:env(safe-area-inset-bottom,0px);';
      document.body.appendChild(probe);
      const value = parseFloat(window.getComputedStyle(probe).paddingBottom) || 0;
      document.body.removeChild(probe);
      setWebInset((prev) => (prev === value ? prev : value));
    };

    measure();
    const timeoutA = window.setTimeout(measure, 150);
    const timeoutB = window.setTimeout(measure, 600);

    window.addEventListener('resize', measure);
    window.addEventListener('orientationchange', measure);
    return () => {
      window.clearTimeout(timeoutA);
      window.clearTimeout(timeoutB);
      window.removeEventListener('resize', measure);
      window.removeEventListener('orientationchange', measure);
    };
  }, []);

  return Platform.OS === 'web' ? webInset : insets.bottom;
}
