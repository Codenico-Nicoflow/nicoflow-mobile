import type { ITask } from '@nicoflow/shared/types';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { CalendarTaskAgendaCard } from './CalendarTaskAgendaCard';

jest.mock('./CalendarDurationEditor', () => ({ CalendarDurationEditor: () => null }));
jest.mock('./CalendarScheduleEditor', () => ({
  CalendarScheduleEditor: ({ mode = 'schedule' }: { mode?: 'schedule' | 'date' }) => {
    const React = jest.requireActual<typeof import('react')>('react');
    const Native = jest.requireActual<typeof import('react-native')>('react-native');
    return React.createElement(Native.Text, null, mode === 'date' ? 'DATE_EDITOR' : 'SCHEDULE_EDITOR');
  },
}));

const task = {
  id: 'task-1',
  title: 'Review plan',
  scheduledFor: '2026-09-23',
  scheduledTime: '09:30',
  estimatedMinutes: 45,
} as ITask;

describe('CalendarTaskAgendaCard', () => {
  it('opens the date-only editor without exposing time or duration controls', async () => {
    await render(
      <CalendarTaskAgendaCard task={task} pending={false} onSaveSchedule={jest.fn()} onSaveDuration={jest.fn()} />
    );
    await fireEvent.press(screen.getByTestId('calendar-agenda-move-task-1'));
    expect(screen.getByText('DATE_EDITOR')).toBeTruthy();
  });

  it('opens the full schedule editor from the accessible edit control', async () => {
    await render(
      <CalendarTaskAgendaCard task={task} pending={false} onSaveSchedule={jest.fn()} onSaveDuration={jest.fn()} />
    );
    await fireEvent.press(screen.getByLabelText('Edit schedule for Review plan'));
    expect(screen.getByText('SCHEDULE_EDITOR')).toBeTruthy();
  });
});
