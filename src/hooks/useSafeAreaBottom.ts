import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// On web, react-native-safe-area-context reports {bottom: 0} — it doesn't
// read env(safe-area-inset-bottom) from CSS. So we measure it ourselves with
// a hidden probe element. On native we use the real insets from the provider.
export function useSafeAreaBottom(): number {
  const insets = useSafeAreaInsets();
  const [webInset, setWebInset] = useState(0);

  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const measure = (): void => {
      const probe = document.createElement('div');
      probe.style.cssText =
        'position:fixed;top:-9999px;left:0;width:0;height:0;visibility:hidden;padding-bottom:env(safe-area-inset-bottom,0px);';
      document.body.appendChild(probe);
      const value = parseFloat(window.getComputedStyle(probe).paddingBottom) || 0;
      document.body.removeChild(probe);
      setWebInset(value);
    };

    measure();
    window.addEventListener('resize', measure);
    window.addEventListener('orientationchange', measure);
    return () => {
      window.removeEventListener('resize', measure);
      window.removeEventListener('orientationchange', measure);
    };
  }, []);

  return Platform.OS === 'web' ? webInset : insets.bottom;
}
