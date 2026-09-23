import type { ITask } from '@nicoflow/shared/types';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { CalendarDurationEditor } from './CalendarDurationEditor';

const makeTask = (overrides: Partial<ITask> = {}): ITask =>
  ({ id: 'task-1', title: 'Late task', scheduledTime: '23:30', estimatedMinutes: 15, ...overrides }) as ITask;

describe('CalendarDurationEditor', () => {
  it('clamps numeric saves to the authoritative day-end maximum', async () => {
    const onSave = jest.fn(() => Promise.resolve());
    await render(<CalendarDurationEditor task={makeTask()} pending={false} onSave={onSave} onCancel={jest.fn()} />);

    await fireEvent.changeText(screen.getByTestId('calendar-duration-input'), '60');
    await fireEvent.press(screen.getByTestId('calendar-duration-save'));
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ id: 'task-1' }), 29);
  });

  it('rejects invalid values without writing', async () => {
    const onSave = jest.fn(() => Promise.resolve());
    await render(<CalendarDurationEditor task={makeTask()} pending={false} onSave={onSave} onCancel={jest.fn()} />);
    await fireEvent.changeText(screen.getByTestId('calendar-duration-input'), '1.5');
    await fireEvent.press(screen.getByTestId('calendar-duration-save'));
    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByText('Enter a whole number from 1 to 1440.')).toBeTruthy();
  });

  it('shows a 30-minute suggestion for null without saving it', async () => {
    const onSave = jest.fn(() => Promise.resolve());
    await render(
      <CalendarDurationEditor
        task={makeTask({ scheduledTime: null, estimatedMinutes: null })}
        pending={false}
        onSave={onSave}
        onCancel={jest.fn()}
      />
    );
    expect(screen.getByText(/Suggested: 30 minutes/)).toBeTruthy();
    expect(screen.queryByTestId('calendar-duration-handle')).toBeNull();
    expect(onSave).not.toHaveBeenCalled();
  });
});
