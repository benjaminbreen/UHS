/*
 * Per-caller request ceiling.
 *
 * `inFlight` counters bound one instance at a time, and a serverless
 * deployment starts as many instances as it likes, each beginning at zero. On
 * its own that is not a limit at all -- it is someone else's bill. This is
 * in-memory too, so it is a speed bump per instance rather than a guarantee; a
 * shared store is the real answer if this ever needs one.
 */
const WINDOW_MS = 60_000;
const calls = new Map<string, number[]>();

export function callerOf(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

/**
 * Records this call and says whether the caller has gone past `perMinute`.
 * `bucket` keeps each endpoint's budget separate, so a talkative player does
 * not find the narrator closed to them.
 */
export function overLimit(
  request: Request,
  bucket: string,
  perMinute: number,
): boolean {
  const caller = `${bucket}:${callerOf(request)}`;
  const now = Date.now();
  const recent = (calls.get(caller) ?? []).filter((at) => now - at < WINDOW_MS);
  recent.push(now);
  calls.set(caller, recent);
  // Bounded cleanup, so a long-lived instance does not accumulate callers.
  if (calls.size > 5000)
    for (const [key, times] of calls)
      if (!times.some((at) => now - at < WINDOW_MS)) calls.delete(key);
  return recent.length > perMinute;
}
