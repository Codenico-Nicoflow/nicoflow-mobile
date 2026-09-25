import type { ITask } from '@nicoflow/shared/types';
import { act, fireEvent, render, screen } from '@testing-library/react-native';

import { CalendarScheduleEditor } from './CalendarScheduleEditor';

const task: ITask = {
  id: 'task-1',
  title: 'Review plan',
  scheduledFor: '2026-09-23',
  scheduledTime: '09:30',
  estimatedMinutes: 45,
} as ITask;

describe('CalendarScheduleEditor', () => {
  it('saves date, time and duration as a single schedule change', async () => {
    const onSave = jest.fn(() => Promise.resolve());
    await render(<CalendarScheduleEditor task={task} pending={false} onSave={onSave} onCancel={jest.fn()} />);

    await fireEvent.changeText(screen.getByTestId('calendar-schedule-date-input'), '2026-09-25');
    await fireEvent.changeText(screen.getByTestId('calendar-schedule-time-input'), '10:15');
    await fireEvent.changeText(screen.getByTestId('calendar-schedule-duration-input'), '60');
    await fireEvent.press(screen.getByTestId('calendar-schedule-save'));

    expect(onSave).toHaveBeenCalledWith(task, '2026-09-25', '10:15', 60);
  });

  it('does not save invalid dates, times, or duration values', async () => {
    const onSave = jest.fn(() => Promise.resolve());
    await render(<CalendarScheduleEditor task={task} pending={false} onSave={onSave} onCancel={jest.fn()} />);
    await fireEvent.changeText(screen.getByTestId('calendar-schedule-date-input'), '2026-02-31');
    await fireEvent.changeText(screen.getByTestId('calendar-schedule-time-input'), '25:00');
    await fireEvent.changeText(screen.getByTestId('calendar-schedule-duration-input'), '0');
    await act(async () => fireEvent.press(screen.getByTestId('calendar-schedule-save')));

    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByTestId('calendar-schedule-error')).toBeTruthy();
  });

  it('lets the date-only action change only the scheduled date', async () => {
    const onSave = jest.fn(() => Promise.resolve());
    await render(
      <CalendarScheduleEditor task={task} pending={false} mode="date" onSave={onSave} onCancel={jest.fn()} />
    );

    await fireEvent.changeText(screen.getByTestId('calendar-schedule-date-input'), '2026-09-25');
    expect(screen.queryByTestId('calendar-schedule-time-input')).toBeNull();
    expect(screen.queryByTestId('calendar-schedule-duration-input')).toBeNull();
    await fireEvent.press(screen.getByTestId('calendar-schedule-save'));
    expect(onSave).toHaveBeenCalledWith(task, '2026-09-25', '09:30', 45);
  });
});
