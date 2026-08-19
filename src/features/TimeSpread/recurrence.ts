import { RecurrenceFreq } from '@nicoflow/shared/types';

export type RecurrenceOption = 'none' | (typeof RecurrenceFreq)['DAILY' | 'WEEKLY' | 'MONTHLY'];

export const RECURRENCE_OPTIONS: { value: RecurrenceOption; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: RecurrenceFreq.DAILY, label: 'Daily' },
  { value: RecurrenceFreq.WEEKLY, label: 'Weekly' },
  { value: RecurrenceFreq.MONTHLY, label: 'Monthly' },
];

// Today in the user's local timezone as YYYY-MM-DD — deliberately not
// toISOString(), which converts to UTC and can land on the wrong day.
// (Same helper as web's RecurrenceField/types.ts; not exported from
// @nicoflow/shared, so duplicated here rather than reaching into web's src.)
export const todayISO = (): string => {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

// Builds the schedule half of CreateRecurrenceRuleRequest for one of the three
// simple presets. Weekly repeats on today's weekday; monthly repeats on
// today's day-of-month — no custom weekday/monthday picker for v1 (per story
// scope), so the create moment itself fixes the pattern.
export const buildRecurrenceSchedule = (
  freq: (typeof RecurrenceFreq)['DAILY' | 'WEEKLY' | 'MONTHLY']
): {
  freq: (typeof RecurrenceFreq)['DAILY' | 'WEEKLY' | 'MONTHLY'];
  interval: number;
  byWeekday: number[];
  byMonthday: number | null;
  startDate: string;
  endDate: null;
} => {
  const today = new Date();
  return {
    freq,
    interval: 1,
    byWeekday: freq === RecurrenceFreq.WEEKLY ? [today.getDay()] : [],
    byMonthday: freq === RecurrenceFreq.MONTHLY ? today.getDate() : null,
    startDate: todayISO(),
    endDate: null,
  };
};
