import type { ITask } from '@nicoflow/shared/types';

const DAY_MINUTES = 24 * 60;
const MIN_TASK_MINUTES = 1;
const DEFAULT_DISPLAY_MINUTES = 30;
const SNAP_MINUTES = 15;

export interface TimedTaskLayout {
  task: ITask;
  startMinutes: number;
  durationMinutes: number;
  top: number;
  height: number;
  column: number;
  columns: number;
}

export const parseClockMinutes = (value: string | null | undefined): number | null => {
  if (!value || !/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) return null;
  const [hours = 0, minutes = 0] = value.split(':').map(Number);
  return hours * 60 + minutes;
};

const displayDuration = (task: ITask, startMinutes: number): number => {
  const requested = task.estimatedMinutes ?? DEFAULT_DISPLAY_MINUTES;
  const valid = Number.isFinite(requested) ? Math.max(MIN_TASK_MINUTES, requested) : DEFAULT_DISPLAY_MINUTES;
  return Math.min(Math.max(MIN_TASK_MINUTES, DAY_MINUTES - 1 - startMinutes), valid);
};

interface PositionedTask extends TimedTaskLayout {
  endMinutes: number;
}

const layoutOverlapGroup = (items: readonly PositionedTask[]): TimedTaskLayout[] => {
  const laneEnd: number[] = [];
  const assigned = items.map(item => {
    const availableColumn = laneEnd.findIndex(end => end <= item.startMinutes);
    const column = availableColumn < 0 ? laneEnd.length : availableColumn;
    laneEnd[column] = item.endMinutes;
    return { ...item, column };
  });
  const columnCount = Math.max(1, laneEnd.length);
  return assigned.map(({ endMinutes: _endMinutes, ...item }) => ({ ...item, columns: columnCount }));
};

export const layoutTimedTasks = (tasks: readonly ITask[], pixelsPerMinute = 1): TimedTaskLayout[] => {
  const positioned = tasks
    .flatMap(task => {
      const startMinutes = parseClockMinutes(task.scheduledTime);
      if (startMinutes === null) return [];
      const durationMinutes = displayDuration(task, startMinutes);
      return [
        {
          task,
          startMinutes,
          durationMinutes,
          top: startMinutes * pixelsPerMinute,
          height: durationMinutes * pixelsPerMinute,
          column: 0,
          columns: 1,
          endMinutes: startMinutes + durationMinutes,
        },
      ];
    })
    .sort((left, right) => left.startMinutes - right.startMinutes || left.task.id.localeCompare(right.task.id));

  const result: TimedTaskLayout[] = [];
  let group: PositionedTask[] = [];
  let groupEnd = -1;
  positioned.forEach(item => {
    if (group.length > 0 && item.startMinutes >= groupEnd) {
      result.push(...layoutOverlapGroup(group));
      group = [];
      groupEnd = -1;
    }
    group.push(item);
    groupEnd = Math.max(groupEnd, item.endMinutes);
  });
  if (group.length > 0) result.push(...layoutOverlapGroup(group));
  return result;
};

export const shiftTaskMinutes = (startMinutes: number, deltaMinutes: number): number => {
  const next = Math.round((startMinutes + deltaMinutes) / SNAP_MINUTES) * SNAP_MINUTES;
  return Math.max(0, Math.min(DAY_MINUTES - SNAP_MINUTES, next));
};

export const resizeTaskMinutes = (durationMinutes: number, deltaMinutes: number, startMinutes: number): number => {
  const resized = Math.round((durationMinutes + deltaMinutes) / SNAP_MINUTES) * SNAP_MINUTES;
  const maximum = Math.max(MIN_TASK_MINUTES, DAY_MINUTES - 1 - startMinutes);
  return Math.max(Math.min(SNAP_MINUTES, maximum), Math.min(maximum, resized));
};
