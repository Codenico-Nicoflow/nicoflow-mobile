import type { ITask } from '@nicoflow/shared/types';

import { calendarMoveRequest, calendarScheduleRequest } from './calendarMove';

describe('calendar schedule requests', () => {
  it('changes the date without clearing existing time or duration', () => {
    const task = { id: 'task-1', scheduledFor: '2026-09-23', scheduledTime: '09:30', estimatedMinutes: 45 } as ITask;
    expect(calendarMoveRequest(task, '2026-09-25')).toEqual({ id: 'task-1', scheduledFor: '2026-09-25' });
  });

  it('updates date, time and duration together through the existing task mutation', () => {
    const task = { id: 'task-1', scheduledFor: '2026-09-23' } as ITask;
    expect(calendarScheduleRequest(task, '2026-09-25', '10:15', 60)).toEqual({
      id: 'task-1',
      scheduledFor: '2026-09-25',
      scheduledTime: '10:15',
      estimatedMinutes: 60,
    });
  });
});
