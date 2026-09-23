import type { ITask } from '@nicoflow/shared/types';

export const MONTH_GRID_DAYS = 42;
export const MAX_VISIBLE_CHIPS = 3;

export interface CalendarDay {
  key: string;
  dayOfMonth: number;
  isCurrentMonth: boolean;
}

export interface CalendarRange {
  scheduledFrom: string;
  scheduledTo: string;
}

const pad = (value: number): string => String(value).padStart(2, '0');

export const toDayKey = (date: Date): string =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

export const fromDayKey = (key: string): Date => {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year ?? 0, (month ?? 1) - 1, day ?? 1, 12);
};

export const todayKeyIn = (timezone: string | undefined, now = new Date()): string => {
  if (!timezone) return toDayKey(now);
  try {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(now);
    const value = (type: Intl.DateTimeFormatPartTypes): string => parts.find(part => part.type === type)?.value ?? '';
    const key = `${value('year')}-${value('month')}-${value('day')}`;
    return /^\d{4}-\d{2}-\d{2}$/.test(key) ? key : toDayKey(now);
  } catch {
    return toDayKey(now);
  }
};

export const normalizeWeekStart = (value: number | undefined): number =>
  Number.isInteger(value) && value !== undefined && value >= 0 && value <= 6 ? value : 0;

export const buildMonthDays = (anchor: Date, weekStart = 0): CalendarDay[] => {
  const monthStart = new Date(anchor.getFullYear(), anchor.getMonth(), 1, 12);
  const leadingDays = (monthStart.getDay() - normalizeWeekStart(weekStart) + 7) % 7;
  const gridStart = new Date(anchor.getFullYear(), anchor.getMonth(), 1 - leadingDays, 12);

  return Array.from({ length: MONTH_GRID_DAYS }, (_, offset) => {
    const date = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + offset, 12);
    return {
      key: toDayKey(date),
      dayOfMonth: date.getDate(),
      isCurrentMonth: date.getMonth() === anchor.getMonth() && date.getFullYear() === anchor.getFullYear(),
    };
  });
};

export const rangeForMonth = (days: readonly CalendarDay[]): CalendarRange => ({
  scheduledFrom: days[0]?.key ?? '',
  scheduledTo: days[days.length - 1]?.key ?? '',
});

export const shiftMonth = (anchor: Date, amount: -1 | 1): Date =>
  new Date(anchor.getFullYear(), anchor.getMonth() + amount, 1, 12);

export const groupTasksByDay = (tasks: readonly ITask[]): ReadonlyMap<string, readonly ITask[]> => {
  const grouped = new Map<string, ITask[]>();
  tasks.forEach(task => {
    if (!task.scheduledFor) return;
    const existing = grouped.get(task.scheduledFor);
    if (existing) existing.push(task);
    else grouped.set(task.scheduledFor, [task]);
  });
  return grouped;
};
