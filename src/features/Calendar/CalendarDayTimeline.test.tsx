import { router } from 'expo-router';

import type { IGoogleCalendar, IGoogleEvent } from '@nicoflow/shared/api';
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
        googleEvents={[]}
        googleCalendars={[]}
        onSelectGoogleEvent={jest.fn()}
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
        googleEvents={[]}
        googleCalendars={[]}
        onSelectGoogleEvent={jest.fn()}
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

  it('shows Google all-day and timed events in a distinct read-only timeline layer', async () => {
    const event: IGoogleEvent = {
      id: 'google-meeting',
      title: 'Review',
      start: '2026-09-23T13:00:00+03:00',
      end: '2026-09-23T13:45:00+03:00',
      allDay: false,
      calendarId: 'work',
      htmlLink: 'https://calendar.google.com/event',
    };
    const allDayEvent: IGoogleEvent = {
      ...event,
      id: 'google-holiday',
      title: 'Holiday',
      start: '2026-09-23',
      end: '2026-09-24',
      allDay: true,
    };
    const calendar: IGoogleCalendar = {
      id: 'work',
      summary: 'Work',
      backgroundColor: '#336699',
      primary: false,
      selected: true,
    };
    const onSelectGoogleEvent = jest.fn();
    await render(
      <CalendarDayTimeline
        dayKey="2026-09-23"
        locale="en"
        tasks={[task('timed', 'Timed task', '09:30', 45)]}
        googleEvents={[event, allDayEvent]}
        googleCalendars={[calendar]}
        onSelectGoogleEvent={onSelectGoogleEvent}
        pendingTaskIds={new Set()}
        onSaveSchedule={jest.fn()}
      />
    );

    expect(screen.getByTestId('calendar-timeline-google-event-google-meeting')).toBeTruthy();
    expect(screen.getByTestId('calendar-timeline-google-layer')).toBeTruthy();
    expect(screen.getByTestId('calendar-timeline-task-layer')).toBeTruthy();
    const googlePosition = screen.getByTestId('calendar-timeline-google-event-google-meeting').props.style[0].top;
    expect(googlePosition).toBeCloseTo(13 * 60 * 1.4);
    expect(screen.getByTestId('calendar-timeline-task-timed').props.style[0].width).toBe('100%');
    expect(screen.getByTestId('calendar-timeline-google-all-day-google-holiday')).toBeTruthy();
    expect(screen.getByLabelText('Google Calendar event: Review, Sep 23 · 13:00 – 13:45')).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('Google Calendar event: Review, Sep 23 · 13:00 – 13:45'));
    expect(onSelectGoogleEvent).toHaveBeenCalledWith(event);
  });
});
