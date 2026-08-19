import { type ITask, TaskStatus } from '@nicoflow/shared/types';

export type Segment = 'today' | 'tomorrow' | 'week';

export const SEGMENTS: { key: Segment; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: 'tomorrow', label: 'Tomorrow' },
  { key: 'week', label: 'Next 7 Days' },
];

export const EMPTY_COPY: Record<Segment, string> = {
  today: 'Nothing scheduled for today',
  tomorrow: 'Nothing scheduled for tomorrow',
  week: 'Nothing scheduled in the next 7 days',
};

// Maps the active segment to its slice of GetTimeSpreadResponse — the same
// today/tomorrow/thisWeek buckets web's TimeSpreadView reads.
export const selectSegmentTasks = (
  segment: Segment,
  data: { today: ITask[]; tomorrow: ITask[]; thisWeek: ITask[] } | undefined
): ITask[] => {
  if (!data) return [];
  if (segment === 'today') return data.today;
  if (segment === 'tomorrow') return data.tomorrow;
  return data.thisWeek;
};

// The scheduledFor date a newly-created task should pre-fill for the active
// segment. Week has no single day, so it defaults 2 days out — inside the
// 7-day window but past "tomorrow", which already has its own segment.
export const segmentToScheduledFor = (segment: Segment, today: Date = new Date()): string => {
  const date = new Date(today);
  if (segment === 'tomorrow') date.setDate(date.getDate() + 1);
  if (segment === 'week') date.setDate(date.getDate() + 2);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

export interface DayGroup {
  /** ISO day key "yyyy-MM-dd" — stable for keys/testids. */
  key: string;
  label: string;
  tasks: ITask[];
}

const toISODate = (date: Date): string => {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

const dayLabel = (date: Date): string =>
  date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

// Mirrors web's groupByDay (nicoflow-frontend/src/features/TimeSpread/utils.ts):
// the "this week" bucket grouped by calendar day across the next 7 days,
// empty days dropped. `today` is injectable so tests aren't clock-dependent.
export const groupByDay = (tasks: ITask[], today: Date = new Date()): DayGroup[] => {
  const groups: DayGroup[] = [];
  for (let offset = 0; offset < 7; offset += 1) {
    const date = new Date(today);
    date.setDate(date.getDate() + offset);
    const key = toISODate(date);
    const dayTasks = tasks.filter(task => task.scheduledFor === key);
    if (dayTasks.length > 0) {
      groups.push({ key, label: dayLabel(date), tasks: dayTasks });
    }
  }
  return groups;
};

// The real ITask.status enum is active|done|cancelled — no in-progress state
// exists on the backend (NIC-1954's AC3 named a TODO/IN_PROGRESS/DONE cycle
// that doesn't match the actual contract; the checkbox toggles active<->done,
// same as web's TaskCompleteCheckbox).
export const nextStatus = (current: ITask['status']): ITask['status'] =>
  current === TaskStatus.DONE ? TaskStatus.ACTIVE : TaskStatus.DONE;
