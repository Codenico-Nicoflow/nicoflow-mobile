import type { ITask } from '@nicoflow/shared/types';
import { act, fireEvent, render, screen } from '@testing-library/react-native';

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

  it('supports screen-reader increment and decrement actions in 15-minute steps', async () => {
    const onSave = jest.fn(() => Promise.resolve());
    await render(
      <CalendarDurationEditor
        task={makeTask({ scheduledTime: '10:00', estimatedMinutes: 60 })}
        pending={false}
        onSave={onSave}
        onCancel={jest.fn()}
      />
    );

    const handle = screen.getByTestId('calendar-duration-handle');
    const onAccessibilityAction = handle.props.onAccessibilityAction as (event: {
      nativeEvent: { actionName: 'increment' | 'decrement' };
    }) => void;
    await act(async () => onAccessibilityAction({ nativeEvent: { actionName: 'increment' } }));
    expect(screen.getByTestId('calendar-duration-input')).toHaveProp('value', '75');

    const onUpdatedAccessibilityAction = screen.getByTestId('calendar-duration-handle').props
      .onAccessibilityAction as typeof onAccessibilityAction;
    await act(async () => onUpdatedAccessibilityAction({ nativeEvent: { actionName: 'decrement' } }));
    expect(screen.getByTestId('calendar-duration-input')).toHaveProp('value', '60');
    expect(onSave).not.toHaveBeenCalled();
  });
});
