export const MAX_FAILED_ATTEMPTS = 5;
export const MAX_FAILED_PER_IP = 30;
export const WINDOW_MINUTES = 15;

const WINDOW_MS = WINDOW_MINUTES * 60 * 1000;

export type LockState =
  { locked: false } | { locked: true; retryAfterSeconds: number };

export function evaluateLock(
  failedAt: Date[],
  now: Date,
  max: number = MAX_FAILED_ATTEMPTS,
): LockState {
  const windowStart = now.getTime() - WINDOW_MS;
  const recent = failedAt
    .map((d) => d.getTime())
    .filter((t) => t > windowStart && t <= now.getTime())
    .sort((a, b) => a - b);

  if (recent.length < max) return { locked: false };

  const unlockAt = recent[recent.length - max] + WINDOW_MS;
  return {
    locked: true,
    retryAfterSeconds: Math.max(
      1,
      Math.ceil((unlockAt - now.getTime()) / 1000),
    ),
  };
}
