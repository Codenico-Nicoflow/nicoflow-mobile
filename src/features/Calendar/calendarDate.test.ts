import type { ITask } from '@nicoflow/shared/types';

import {
  buildMonthDays,
  buildWeekDays,
  groupTasksByDay,
  rangeForDays,
  rangeForMonth,
  shiftDay,
  shiftMonth,
  todayKeyIn,
} from './calendarDate';

describe('calendarDate', () => {
  it('builds a 42-day Monday-first leap-February grid inside the API limit', () => {
    const days = buildMonthDays(new Date(2028, 1, 15, 12), 1);
    expect(days).toHaveLength(42);
    expect(rangeForMonth(days)).toEqual({ scheduledFrom: '2028-01-31', scheduledTo: '2028-03-12' });
  });

  it('resolves today in the account timezone rather than the device timezone', () => {
    const instant = new Date('2026-01-01T01:30:00.000Z');
    expect(todayKeyIn('America/Los_Angeles', instant)).toBe('2025-12-31');
    expect(todayKeyIn('Asia/Tokyo', instant)).toBe('2026-01-01');
  });

  it('moves across year boundaries', () => {
    expect(shiftMonth(new Date(2026, 11, 1, 12), 1).getFullYear()).toBe(2027);
    expect(shiftMonth(new Date(2026, 0, 1, 12), -1).getFullYear()).toBe(2025);
  });

  it('builds a seven-day agenda from the selected day and configured week start', () => {
    expect(buildWeekDays(new Date(2026, 8, 23, 12), 1).map(day => day.key)).toEqual([
      '2026-09-21',
      '2026-09-22',
      '2026-09-23',
      '2026-09-24',
      '2026-09-25',
      '2026-09-26',
      '2026-09-27',
    ]);
    expect(rangeForDays(buildWeekDays(new Date(2026, 8, 23, 12), 1))).toEqual({
      scheduledFrom: '2026-09-21',
      scheduledTo: '2026-09-27',
    });
  });

  it('shifts a selected date by calendar days across DST and year boundaries', () => {
    expect(shiftDay('2026-03-08', 1)).toBe('2026-03-09');
    expect(shiftDay('2025-12-31', 1)).toBe('2026-01-01');
  });

  it('groups exact scheduledFor strings while preserving server order', () => {
    const tasks = [
      { id: 'a', scheduledFor: '2026-03-08' },
      { id: 'b', scheduledFor: '2026-03-08' },
      { id: 'c', scheduledFor: '2026-03-09' },
    ] as ITask[];
    const grouped = groupTasksByDay(tasks);
    expect(grouped.get('2026-03-08')?.map(task => task.id)).toEqual(['a', 'b']);
    expect(grouped.get('2026-03-09')?.map(task => task.id)).toEqual(['c']);
  });
});
