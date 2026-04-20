export function errorMessage(e: unknown): string {
  if (!e) return 'Unknown error';
  if (e instanceof Error) return e.message;
  if (typeof e === 'string') return e;
  if (typeof e === 'object') {
    const o = e as Record<string, unknown>;
    if (typeof o.message === 'string') return o.message as string;
    if (typeof o.error_description === 'string') return o.error_description as string;
    if (typeof o.error === 'string') return o.error as string;
    if (typeof o.details === 'string') return o.details as string;
    if (typeof o.hint === 'string') return o.hint as string;
    try {
      return JSON.stringify(e);
    } catch {
      return '[object]';
    }
  }
  return String(e);
}
