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

// The real ITask.status enum is active|done|cancelled — no in-progress state
// exists on the backend (NIC-1954's AC3 named a TODO/IN_PROGRESS/DONE cycle
// that doesn't match the actual contract; the checkbox toggles active<->done,
// same as web's TaskCompleteCheckbox).
export const nextStatus = (current: ITask['status']): ITask['status'] =>
  current === TaskStatus.DONE ? TaskStatus.ACTIVE : TaskStatus.DONE;
