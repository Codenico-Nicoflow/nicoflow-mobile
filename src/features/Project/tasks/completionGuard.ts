import { type ITask, TaskStatus } from '@nicoflow/shared/types';

// Mirrors web's completionGuard.ts. Only a transition INTO done is guarded —
// reopening a task, or any other status change, is always free.
export const needsCompletionConfirm = (task: Pick<ITask, 'openSubtaskCount'>, nextStatus: TaskStatus): boolean =>
  nextStatus === TaskStatus.DONE && (task.openSubtaskCount ?? 0) > 0;
