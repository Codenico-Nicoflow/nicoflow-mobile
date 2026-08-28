import { type ProjectStatus } from '@/components/fields/ProjectStatusField';

// Mirrors web's getProjectStatusColor (nicoflow-frontend/src/lib/utils/utils/helpers.ts):
// shared by the Areas board row, ProjectRow, and the project detail header —
// keep this the single source those three pull from on mobile too, same as
// web funnels all three through one function.
export const PROJECT_STATUS_BADGE_COLOR: Record<
  ProjectStatus,
  { light: string; dark: string; text: string; textDark: string }
> = {
  active: { light: '#dcfce7', dark: '#14532d', text: '#166534', textDark: '#86efac' },
  completed: { light: '#dbeafe', dark: '#1e3a8a', text: '#1e40af', textDark: '#93c5fd' },
  archived: { light: '#f3f4f6', dark: '#111827', text: '#1f2937', textDark: '#d1d5db' },
};

export function projectStatusBadgeStyle(status: ProjectStatus, isDark: boolean) {
  const tone = PROJECT_STATUS_BADGE_COLOR[status] ?? PROJECT_STATUS_BADGE_COLOR.archived;
  return {
    backgroundColor: isDark ? tone.dark : tone.light,
    color: isDark ? tone.textDark : tone.text,
  };
}
