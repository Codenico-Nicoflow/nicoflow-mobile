import { calendarFailureKind, canRetryCalendarFailure, isCalendarOfflineFailure } from './calendarRecovery';

describe('calendarRecovery', () => {
  it('keeps a network failure distinct from an empty month', () => {
    const error = { status: 'FETCH_ERROR' as const, error: 'Network request failed' };

    expect(calendarFailureKind(error)).toBe('offline');
    expect(isCalendarOfflineFailure(error)).toBe(true);
    expect(canRetryCalendarFailure(error)).toBe(true);
  });

  it.each([429, 500, 503])('allows safe retry for transient status %s', status => {
    expect(canRetryCalendarFailure({ status, data: null })).toBe(true);
  });

  it.each([400, 403, 404, 409, 422])('does not retry deterministic status %s', status => {
    expect(canRetryCalendarFailure({ status, data: null })).toBe(false);
  });
});
