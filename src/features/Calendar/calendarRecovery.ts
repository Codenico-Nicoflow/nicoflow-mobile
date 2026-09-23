import { isFetchBaseQueryError } from '@/lib/utils/apiError';

export type CalendarFailureKind = 'offline' | 'rate-limited' | 'server' | 'validation' | 'unknown';

export function calendarFailureKind(error: unknown): CalendarFailureKind {
  if (!isFetchBaseQueryError(error)) return 'unknown';
  if (error.status === 'FETCH_ERROR' || error.status === 'TIMEOUT_ERROR') return 'offline';
  if (error.status === 429) return 'rate-limited';
  if (typeof error.status === 'number' && error.status >= 500) return 'server';
  if (typeof error.status === 'number' && error.status >= 400) return 'validation';
  return 'unknown';
}

export function canRetryCalendarFailure(error: unknown): boolean {
  const kind = calendarFailureKind(error);
  return kind === 'offline' || kind === 'rate-limited' || kind === 'server' || kind === 'unknown';
}

export function isCalendarOfflineFailure(error: unknown): boolean {
  return calendarFailureKind(error) === 'offline';
}
