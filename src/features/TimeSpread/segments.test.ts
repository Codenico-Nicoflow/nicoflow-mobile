import type { ITask } from '@nicoflow/shared/types';

import { groupByDay, nextStatus, segmentToScheduledFor, selectSegmentTasks } from './segments';

const task = (id: string, overrides: Partial<ITask> = {}): ITask =>
  ({
    id,
    projectId: 'p1',
    title: `Task ${id}`,
    status: 'active',
    priority: 'medium',
    energy: 'medium',
    rollsOver: false,
    displayOrder: 0,
    createdAt: '',
    updatedAt: '',
    totalFocusSeconds: 0,
    subtaskCount: 0,
    openSubtaskCount: 0,
    ...overrides,
  }) as ITask;

describe('selectSegmentTasks', () => {
  const data = { today: [task('1')], tomorrow: [task('2')], thisWeek: [task('3'), task('4')] };

  it('maps today segment to the today bucket', () => {
    expect(selectSegmentTasks('today', data)).toEqual(data.today);
  });

  it('maps tomorrow segment to the tomorrow bucket', () => {
    expect(selectSegmentTasks('tomorrow', data)).toEqual(data.tomorrow);
  });

  it('maps week segment to the thisWeek bucket', () => {
    expect(selectSegmentTasks('week', data)).toEqual(data.thisWeek);
  });

  it('returns an empty array when data has not loaded yet', () => {
    expect(selectSegmentTasks('today', undefined)).toEqual([]);
  });
});

describe('segmentToScheduledFor', () => {
  const today = new Date(2026, 7, 19); // 2026-08-19, a Wednesday

  it('today segment defaults to today', () => {
    expect(segmentToScheduledFor('today', today)).toBe('2026-08-19');
  });

  it('tomorrow segment defaults to +1 day', () => {
    expect(segmentToScheduledFor('tomorrow', today)).toBe('2026-08-20');
  });

  it('week segment defaults to +2 days — inside the 7-day window, past tomorrow', () => {
    expect(segmentToScheduledFor('week', today)).toBe('2026-08-21');
  });

  it('rolls the month/year over correctly at a month boundary', () => {
    expect(segmentToScheduledFor('week', new Date(2026, 7, 30))).toBe('2026-09-01');
  });
});

describe('groupByDay', () => {
  const today = new Date(2026, 7, 19); // 2026-08-19, a Wednesday

  it('groups tasks under their scheduledFor day', () => {
    const tasks = [task('1', { scheduledFor: '2026-08-19' }), task('2', { scheduledFor: '2026-08-21' })];
    const groups = groupByDay(tasks, today);

    expect(groups).toHaveLength(2);
    expect(groups[0]).toMatchObject({ key: '2026-08-19', tasks: [tasks[0]] });
    expect(groups[1]).toMatchObject({ key: '2026-08-21', tasks: [tasks[1]] });
  });

  it('drops days with nothing scheduled', () => {
    const tasks = [task('1', { scheduledFor: '2026-08-25' })];
    const groups = groupByDay(tasks, today);

    expect(groups).toHaveLength(1);
    expect(groups[0]?.key).toBe('2026-08-25');
  });

  it('only looks at the next 7 days from today', () => {
    const tasks = [task('1', { scheduledFor: '2026-08-30' })]; // 11 days out
    expect(groupByDay(tasks, today)).toHaveLength(0);
  });

  it('keeps multiple tasks on the same day together', () => {
    const tasks = [task('1', { scheduledFor: '2026-08-20' }), task('2', { scheduledFor: '2026-08-20' })];
    const groups = groupByDay(tasks, today);

    expect(groups).toHaveLength(1);
    expect(groups[0]?.tasks).toHaveLength(2);
  });

  it('returns a real Date for the day, not a pre-formatted label', () => {
    const tasks = [task('1', { scheduledFor: '2026-08-21' })];
    const groups = groupByDay(tasks, today);
    expect(groups[0]?.date).toBeInstanceOf(Date);
    expect(groups[0]?.date.getDate()).toBe(21);
  });
});

describe('nextStatus', () => {
  it('toggles active to done', () => {
    expect(nextStatus('active')).toBe('done');
  });

  it('toggles done back to active', () => {
    expect(nextStatus('done')).toBe('active');
  });

  it('treats cancelled as not-done, toggling to done', () => {
    expect(nextStatus('cancelled')).toBe('done');
  });
});
