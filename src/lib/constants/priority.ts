import { TaskPriority } from '@nicoflow/shared/types';
import { priorityKind } from '@nicoflow/shared/utils';

// Single source for the three priority levels — mirrors web's
// formatTaskPriority (nicoflow-frontend/src/features/Tasks/utils/index.tsx),
// both built on @nicoflow/shared/utils's priorityKind. Color tokens are
// per-platform (RN className vs. web Tailwind), so they stay local.
export const PRIORITY_OPTIONS = [
  { label: 'Low', value: TaskPriority.LOW },
  { label: 'Medium', value: TaskPriority.MEDIUM },
  { label: 'High', value: TaskPriority.HIGH },
];

export const PRIORITY_DOT_COLOR: Record<TaskPriority, string> = {
  [TaskPriority.LOW]: 'bg-success dark:bg-success-dark',
  [TaskPriority.MEDIUM]: 'bg-warning dark:bg-warning-dark',
  [TaskPriority.HIGH]: 'bg-destructive dark:bg-destructive-dark',
};

// Same three tones as PRIORITY_DOT_COLOR, expressed as a leading-edge border
// (RTL-aware `border-s-`) for the task row's color bar.
export const PRIORITY_BORDER_COLOR: Record<TaskPriority, string> = {
  [TaskPriority.LOW]: 'border-s-success dark:border-s-success-dark',
  [TaskPriority.MEDIUM]: 'border-s-warning dark:border-s-warning-dark',
  [TaskPriority.HIGH]: 'border-s-destructive dark:border-s-destructive-dark',
};

export const PRIORITY_CHIP_CLASS: Record<TaskPriority, string> = {
  [TaskPriority.LOW]: 'border-success dark:border-success-dark',
  [TaskPriority.MEDIUM]: 'border-warning dark:border-warning-dark',
  [TaskPriority.HIGH]: 'border-destructive dark:border-destructive-dark',
};

export const PRIORITY_TEXT_CLASS: Record<TaskPriority, string> = {
  [TaskPriority.LOW]: 'text-success dark:text-success-dark',
  [TaskPriority.MEDIUM]: 'text-warning dark:text-warning-dark',
  [TaskPriority.HIGH]: 'text-destructive dark:text-destructive-dark',
};

const LABEL_BY_KIND: Record<string, string> = { low: 'Low', medium: 'Medium', high: 'High', unknown: 'Medium' };

export const priorityLabel = (priority: TaskPriority): string => LABEL_BY_KIND[priorityKind(priority)] ?? 'Medium';
