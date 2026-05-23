const lastActionTimes = new Map<string, number>();

export const throttleSocket = (key: string, limitMs: number = 200): boolean => {
  const now = Date.now();
  const last = lastActionTimes.get(key) || 0;
  if (now - last < limitMs) {
    return false; // Throttled
  }
  lastActionTimes.set(key, now);
  return true;
};

// Cleanup memory leak over time
setInterval(() => {
  const now = Date.now();
  for (const [key, time] of lastActionTimes.entries()) {
    if (now - time > 10000) {
      lastActionTimes.delete(key);
    }
  }
}, 30000);
