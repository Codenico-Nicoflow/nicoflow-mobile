import type { ITask } from '@nicoflow/shared/types';

import { calendarMoveRequest, calendarScheduleRequest, isLiveRecurringOccurrence } from './calendarMove';

describe('calendarMove', () => {
  it('builds a date-only update that cannot overwrite time, duration or task metadata', () => {
    const task = {
      id: 'task-string-id',
      scheduledFor: '2026-09-23',
      scheduledTime: '09:30',
      estimatedMinutes: 45,
      projectId: 'project-id',
      status: 'active',
    } as ITask;
    expect(calendarMoveRequest(task, '2026-09-25')).toEqual({ id: 'task-string-id', scheduledFor: '2026-09-25' });
  });

  it('preserves the date while updating time and duration', () => {
    expect(
      calendarScheduleRequest({ id: 'task-a', scheduledFor: '2026-09-23' } as ITask, '2026-09-23', '09:30', 45)
    ).toEqual({
      id: 'task-a',
      scheduledFor: '2026-09-23',
      scheduledTime: '09:30',
      estimatedMinutes: 45,
    });
  });

  it('locks only live recurring occurrences', () => {
    expect(isLiveRecurringOccurrence({ recurrenceRuleId: 'rule', occurrenceStatus: null } as ITask)).toBe(true);
    expect(isLiveRecurringOccurrence({ recurrenceRuleId: 'rule', occurrenceStatus: 'missed' } as ITask)).toBe(false);
    expect(isLiveRecurringOccurrence({ recurrenceRuleId: null } as ITask)).toBe(false);
  });
});
