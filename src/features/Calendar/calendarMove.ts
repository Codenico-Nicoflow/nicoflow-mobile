import type { UpdateTaskRequest } from '@nicoflow/shared/api';
import type { ITask } from '@nicoflow/shared/types';

export const isLiveRecurringOccurrence = (task: ITask): boolean =>
  Boolean(task.recurrenceRuleId && !task.occurrenceStatus);

export const calendarMoveRequest = (task: ITask, scheduledFor: string): UpdateTaskRequest => ({
  id: task.id,
  scheduledFor,
});
