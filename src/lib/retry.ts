import { errorMessage } from './errors';

// Retries a network operation on "Network request failed" / fetch errors.
// Supabase-level DB errors (missing column, constraint, etc.) are NOT retried
// because they're deterministic — only transient connectivity issues are.
export async function retryOnNetwork<T>(fn: () => Promise<T>, attempts = 3, baseDelayMs = 300): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
      if (!isTransientNetworkError(e)) throw e;
      if (i < attempts - 1) {
        await new Promise((r) => setTimeout(r, baseDelayMs * (i + 1)));
      }
    }
  }
  throw lastErr;
}

export function isTransientNetworkError(e: unknown): boolean {
  const msg = errorMessage(e).toLowerCase();
  return (
    msg.includes('network request failed') ||
    msg.includes('fetch failed') ||
    msg.includes('networkerror') ||
    msg.includes('timeout') ||
    msg.includes('timed out') ||
    msg.includes('connection') ||
    msg.includes('typeerror: network')
  );
}
