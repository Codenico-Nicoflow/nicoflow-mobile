import { type ITask, ScheduleFilter, TaskStatus } from '@nicoflow/shared/types';

// Mirrors web's filters.ts (nicoflow-frontend/src/features/Tasks/filters.ts) 1:1.
export const TASK_FILTER = {
  ALL: 'all',
  ACTIVE: TaskStatus.ACTIVE,
  DONE: TaskStatus.DONE,
  CANCELLED: TaskStatus.CANCELLED,
} as const;

export type TaskFilter = (typeof TASK_FILTER)[keyof typeof TASK_FILTER];

export interface TaskCounts {
  all: number;
  active: number;
  done: number;
  cancelled: number;
}

export const TASK_FILTER_ORDER: { value: TaskFilter; countKey: keyof TaskCounts }[] = [
  { value: TASK_FILTER.ALL, countKey: 'all' },
  { value: TASK_FILTER.ACTIVE, countKey: 'active' },
  { value: TASK_FILTER.DONE, countKey: 'done' },
  { value: TASK_FILTER.CANCELLED, countKey: 'cancelled' },
];

export const matchesFilter = (task: ITask, filter: TaskFilter): boolean => {
  if (filter === TASK_FILTER.ALL) return true;
  return task.status === filter;
};

export const countTasks = (tasks: ITask[]): TaskCounts => ({
  all: tasks.length,
  active: tasks.filter(task => task.status === TaskStatus.ACTIVE).length,
  done: tasks.filter(task => task.status === TaskStatus.DONE).length,
  cancelled: tasks.filter(task => task.status === TaskStatus.CANCELLED).length,
});

export const defaultTaskFilter = (): TaskFilter => TASK_FILTER.ACTIVE;

export const matchesScheduleFilter = (
  task: ITask,
  filter: (typeof ScheduleFilter)[keyof typeof ScheduleFilter]
): boolean => {
  if (filter === ScheduleFilter.ALL) return true;
  if (filter === ScheduleFilter.SCHEDULED) return !!task.scheduledFor;
  return !task.scheduledFor;
};
