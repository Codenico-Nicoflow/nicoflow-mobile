import { router } from 'expo-router';

import type { ITask } from '@nicoflow/shared/types';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { CalendarDayTimeline } from './CalendarDayTimeline';

jest.mock('@/components/ui/sheet', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  const Native = jest.requireActual<typeof import('react-native')>('react-native');
  return {
    Sheet: React.forwardRef(({ children }: { children: React.ReactNode }, ref) => {
      React.useImperativeHandle(ref, () => ({ present: jest.fn(), dismiss: jest.fn() }));
      return React.createElement(Native.View, null, children);
    }),
    SheetHeader: ({ children }: { children: React.ReactNode }) => React.createElement(Native.View, null, children),
    SheetTitle: ({ children }: { children: React.ReactNode }) => React.createElement(Native.Text, null, children),
  };
});

jest.mock('react-native-gesture-handler', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  const Native = jest.requireActual<typeof import('react-native')>('react-native');
  const gesture = {
    activeOffsetY: () => gesture,
    failOffsetX: () => gesture,
    requireExternalGestureToFail: () => gesture,
    runOnJS: () => gesture,
    onEnd: () => gesture,
  };
  return {
    Gesture: { Pan: () => gesture },
    GestureDetector: ({ children }: { children: React.ReactNode }) => React.createElement(Native.View, null, children),
  };
});

const task = (id: string, title: string, scheduledTime: string | null, estimatedMinutes: number | null): ITask =>
  ({ id, title, scheduledFor: '2026-09-23', scheduledTime, estimatedMinutes }) as ITask;

describe('CalendarDayTimeline', () => {
  it('separates all-day tasks from timed blocks and opens the existing task editor', async () => {
    await render(
      <CalendarDayTimeline
        dayKey="2026-09-23"
        locale="en"
        tasks={[task('timed', 'Timed task', '09:30', 45), task('all-day', 'All-day task', null, null)]}
        pendingTaskIds={new Set()}
        onSaveSchedule={jest.fn()}
      />
    );

    expect(screen.getByTestId('calendar-timeline-task-timed')).toBeTruthy();
    expect(screen.getByTestId('calendar-timeline-all-day-all-day')).toBeTruthy();
    expect(screen.getByText('All-day task')).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('Open task: Timed task'));
    expect(router.push).toHaveBeenCalledWith('/task/timed');
  });

  it('allows schedule and duration editing through accessible controls without a gesture', async () => {
    const onSaveSchedule = jest.fn();
    await render(
      <CalendarDayTimeline
        dayKey="2026-09-23"
        locale="en"
        tasks={[task('timed', 'Timed task', '09:30', 45)]}
        pendingTaskIds={new Set()}
        onSaveSchedule={onSaveSchedule}
      />
    );

    await fireEvent.press(screen.getByLabelText('Edit schedule for Timed task'));
    await fireEvent.changeText(screen.getByLabelText('Scheduled time (HH:MM)'), '10:15');
    await fireEvent.changeText(screen.getByLabelText('Duration in minutes'), '60');
    await fireEvent.press(screen.getByTestId('calendar-schedule-save'));

    expect(onSaveSchedule).toHaveBeenCalledWith(expect.objectContaining({ id: 'timed' }), '2026-09-23', '10:15', 60);
  });
});
