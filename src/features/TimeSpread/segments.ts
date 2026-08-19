import type { ITask } from '@nicoflow/shared/types';

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
