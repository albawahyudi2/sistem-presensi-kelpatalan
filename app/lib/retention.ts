export const RETENTION_DAYS = 365;
export const LOGIN_ATTEMPT_RETENTION_DAYS = 30;

const DAY_MS = 24 * 60 * 60 * 1000;

export function retentionCutoff(now: Date): Date {
  return new Date(now.getTime() - RETENTION_DAYS * DAY_MS);
}

export function loginAttemptCutoff(now: Date): Date {
  return new Date(now.getTime() - LOGIN_ATTEMPT_RETENTION_DAYS * DAY_MS);
}
