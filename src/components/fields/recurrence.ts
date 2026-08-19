import { RecurrenceFreq } from '@nicoflow/shared/types';

// Same shape as web's RecurrenceField/types.ts RecurrenceValue — not exported
// from @nicoflow/shared, so duplicated here.
export interface RecurrenceValue {
  freq: RecurrenceFreq;
  interval: number;
  byWeekday: number[];
  byMonthday?: number | null;
  startDate: string; // ISO "YYYY-MM-DD"
  endDate?: string | null; // null = runs forever
}

// Today in the user's local timezone as YYYY-MM-DD — deliberately not
// toISOString(), which converts to UTC and can land on the wrong day.
export const todayISO = (date: Date = new Date()): string => {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

// Weekly-on-today is the least surprising default: turning "Repeats" on
// without touching anything else produces a rule that fires again next week.
export const defaultRecurrence = (): RecurrenceValue => ({
  freq: RecurrenceFreq.WEEKLY,
  interval: 1,
  byWeekday: [new Date().getDay()],
  byMonthday: null,
  startDate: todayISO(),
  endDate: null,
});
