import { RecurrenceFreq } from '@nicoflow/shared/types';

import { defaultRecurrence, todayISO } from './recurrence';

describe('todayISO', () => {
  it('formats a given date as YYYY-MM-DD in local time', () => {
    expect(todayISO(new Date(2026, 7, 19))).toBe('2026-08-19');
  });

  it('pads single-digit months and days', () => {
    expect(todayISO(new Date(2026, 0, 5))).toBe('2026-01-05');
  });
});

describe('defaultRecurrence', () => {
  it('defaults to weekly, repeating on today, starting today, never ending', () => {
    const rule = defaultRecurrence();
    expect(rule.freq).toBe(RecurrenceFreq.WEEKLY);
    expect(rule.interval).toBe(1);
    expect(rule.byWeekday).toEqual([new Date().getDay()]);
    expect(rule.endDate).toBeNull();
    expect(rule.startDate).toBe(todayISO());
  });
});
