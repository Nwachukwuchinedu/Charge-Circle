/**
 * Per-key action timestamps for client-side rate limiting.
 * Entries older than 10s are evicted every 30s to prevent unbounded growth.
 */
const lastActionTimes = new Map<string, number>();

const CLEANUP_INTERVAL = 30_000;
const STALE_THRESHOLD = 10_000;

/**
 * Checks whether a socket action identified by `key` should be allowed.
 *
 * Actions are throttled when they occur more frequently than once per `limitMs`.
 * This prevents clients from spamming moves, chat messages, or room events
 * without blocking legitimate traffic.
 *
 * @param key - Unique action identifier (e.g. `move_user_abc`, `chat_user_abc`)
 * @param limitMs - Minimum interval in milliseconds between allowed actions
 * @returns `true` if the action is allowed, `false` if it should be discarded
 *
 * @example
 * if (!throttleSocket(`move_${userId}`, 200)) return; // max 5 moves/sec
 */
export const throttleSocket = (key: string, limitMs: number = 200): boolean => {
  const now = Date.now();
  const last = lastActionTimes.get(key) || 0;

  if (now - last < limitMs) {
    return false;
  }

  lastActionTimes.set(key, now);
  return true;
};

// Periodic cleanup to prevent memory leaks under 10K+ concurrent users
setInterval(() => {
  const now = Date.now();
  for (const [key, time] of lastActionTimes.entries()) {
    if (now - time > STALE_THRESHOLD) {
      lastActionTimes.delete(key);
    }
  }
}, CLEANUP_INTERVAL);
