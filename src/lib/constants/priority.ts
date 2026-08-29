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

// Matches web's formatTaskPriority chip spec: colored border + light
// background fill + colored text, not just an outline. bg-*/10 approximates
// web's bg-green-50/bg-yellow-50/bg-red-50 light tint using this app's
// existing success/warning/destructive tokens rather than new raw hex.
export const PRIORITY_CHIP_CLASS: Record<TaskPriority, string> = {
  [TaskPriority.LOW]: 'border-success dark:border-success-dark bg-success/10 dark:bg-success-dark/10',
  [TaskPriority.MEDIUM]: 'border-warning dark:border-warning-dark bg-warning/10 dark:bg-warning-dark/10',
  [TaskPriority.HIGH]: 'border-destructive dark:border-destructive-dark bg-destructive/10 dark:bg-destructive-dark/10',
};

export const PRIORITY_TEXT_CLASS: Record<TaskPriority, string> = {
  [TaskPriority.LOW]: 'text-success dark:text-success-dark',
  [TaskPriority.MEDIUM]: 'text-warning dark:text-warning-dark',
  [TaskPriority.HIGH]: 'text-destructive dark:text-destructive-dark',
};

const LABEL_BY_KIND: Record<string, string> = { low: 'Low', medium: 'Medium', high: 'High', unknown: 'Medium' };

export const priorityLabel = (priority: TaskPriority): string => LABEL_BY_KIND[priorityKind(priority)] ?? 'Medium';
