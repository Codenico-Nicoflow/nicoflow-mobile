import type { UpdateTaskRequest } from '@nicoflow/shared/api';
import type { ITask } from '@nicoflow/shared/types';

export const isLiveRecurringOccurrence = (task: ITask): boolean =>
  Boolean(task.recurrenceRuleId && !task.occurrenceStatus);

export const calendarMoveRequest = (task: ITask, scheduledFor: string): UpdateTaskRequest => ({
  id: task.id,
  scheduledFor,
});

export const calendarScheduleRequest = (
  task: ITask,
  scheduledFor: string,
  scheduledTime: string | null,
  estimatedMinutes: number | null
): UpdateTaskRequest => ({
  id: task.id,
  scheduledFor,
  scheduledTime,
  estimatedMinutes,
});
