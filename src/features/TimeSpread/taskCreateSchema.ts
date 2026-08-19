import { taskSchema } from '@nicoflow/shared/schemas';
import { z } from 'zod';

// Extends the shared task-create schema (title/priority/energy/etc.) with the
// two fields it deliberately doesn't own: projectId (a create-time routing
// concern, not a task field) and recurrence (a separate resource — see
// recurrence.ts). priority/energy get defaults since the sheet only exposes
// title as required (AC4); taskSchema itself requires them.
export const taskCreateSchema = taskSchema.extend({
  projectId: z.string().min(1, 'validation.projectRequired'),
  priority: taskSchema.shape.priority.default('medium'),
  energy: taskSchema.shape.energy.default('medium'),
  recurrence: z.enum(['none', 'daily', 'weekly', 'monthly']).default('none'),
});

// react-hook-form types the form by the pre-default (input) shape; zodResolver
// applies the .default()s on submit, producing the (output) shape below.
export type TaskCreateFormData = z.input<typeof taskCreateSchema>;
export type TaskCreateFormOutput = z.output<typeof taskCreateSchema>;
