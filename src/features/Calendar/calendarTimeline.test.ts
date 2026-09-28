import type { ITask } from '@nicoflow/shared/types';

import { layoutTimedTasks, parseClockMinutes, resizeTaskMinutes, shiftTaskMinutes } from './calendarTimeline';

const task = (id: string, scheduledTime: string | null, estimatedMinutes: number | null): ITask =>
  ({ id, title: id, scheduledTime, estimatedMinutes }) as ITask;

describe('calendar timeline geometry', () => {
  it('positions timed tasks by their wall-clock time and uses a display-only 30 minute default', () => {
    const tasks = [task('first', '09:30', null), task('second', '11:15', 45)];

    expect(layoutTimedTasks(tasks)).toEqual([
      { task: tasks[0], startMinutes: 570, durationMinutes: 30, top: 570, height: 30, column: 0, columns: 1 },
      { task: tasks[1], startMinutes: 675, durationMinutes: 45, top: 675, height: 45, column: 0, columns: 1 },
    ]);
    expect(tasks[0]?.estimatedMinutes).toBeNull();
  });

  it('places overlapping tasks in separate columns and reuses columns after overlap ends', () => {
    const tasks = [task('first', '09:00', 60), task('second', '09:30', 60), task('third', '11:00', 30)];

    expect(layoutTimedTasks(tasks).map(item => [item.task.id, item.column, item.columns])).toEqual([
      ['first', 0, 2],
      ['second', 1, 2],
      ['third', 0, 1],
    ]);
  });

  it('rejects invalid clock values and keeps a task inside the selected wall-clock day', () => {
    expect(parseClockMinutes('24:00')).toBeNull();
    expect(parseClockMinutes('09:7')).toBeNull();
    expect(layoutTimedTasks([task('late', '23:59', 60)])[0]).toMatchObject({
      startMinutes: 1439,
      durationMinutes: 1,
      top: 1439,
      height: 1,
    });
  });

  it('snaps accessible drag and resize changes to 15 minutes and clamps the day range', () => {
    expect(shiftTaskMinutes(9 * 60 + 7, -20)).toBe(8 * 60 + 45);
    expect(shiftTaskMinutes(23 * 60 + 50, 60)).toBe(23 * 60 + 45);
    expect(resizeTaskMinutes(30, -80, 9 * 60)).toBe(15);
    expect(resizeTaskMinutes(30, 80, 23 * 60 + 30)).toBe(29);
  });
});
