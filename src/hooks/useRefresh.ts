import { useCallback, useState } from 'react';

export function useRefresh(refreshFns: (() => Promise<unknown>)[]): {
  refreshing: boolean;
  onRefresh: () => Promise<void>;
} {
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    const started = Date.now();
    try {
      await Promise.all(refreshFns.map((fn) => fn().catch(() => undefined)));
    } finally {
      // Keep the spinner visible briefly so the animation registers — short enough not to feel laggy.
      const elapsed = Date.now() - started;
      if (elapsed < 400) await new Promise((r) => setTimeout(r, 400 - elapsed));
      setRefreshing(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, refreshFns);

  return { refreshing, onRefresh };
}
