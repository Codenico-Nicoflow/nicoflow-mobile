import type { ITask } from '@nicoflow/shared/types';

import { EMPTY_COPY, selectSegmentTasks } from './segments';

const task = (id: string): ITask =>
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

describe('EMPTY_COPY', () => {
  it('has segment-specific copy for every segment', () => {
    expect(EMPTY_COPY.today).not.toBe(EMPTY_COPY.tomorrow);
    expect(EMPTY_COPY.tomorrow).not.toBe(EMPTY_COPY.week);
  });
});
