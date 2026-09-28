import type { GoogleEventsResponse, IGoogleCalendar } from '@nicoflow/shared/api';
import type { ITask, IUser } from '@nicoflow/shared/types';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { CalendarProSurface } from './CalendarProSurface';

const mockQuery = jest.fn();
const mockGoogleQuery = jest.fn();
let mockTasks: ITask[] = [];
let mockGoogleData: GoogleEventsResponse = { events: [], googleStatus: 'ok' };
let mockGoogleCalendars: IGoogleCalendar[] = [];
let mockGoogleFetching = false;
let mockGoogleError = false;
const mockRefetchGoogleEvents = jest.fn();

jest.mock('@/lib/store', () => ({
  mobileWSLifecycleAdapter: { onForeground: () => jest.fn() },
  useAppUser: () => ({ timezone: 'UTC', calendar: { weekStart: 1 } }) as IUser,
  useGetCalendarTasksQuery: (range: unknown) => {
    mockQuery(range);
    return { currentData: mockTasks, isLoading: false, isError: false, refetch: jest.fn() };
  },
  useGetGoogleEventsQuery: (range: unknown, options: unknown) => {
    mockGoogleQuery(range, options);
    return {
      currentData: mockGoogleData,
      isLoading: false,
      isFetching: mockGoogleFetching,
      isError: mockGoogleError,
      refetch: mockRefetchGoogleEvents,
    };
  },
  useGetGoogleCalendarsQuery: () => ({ currentData: mockGoogleCalendars, refetch: jest.fn() }),
  useUpdateTaskMutation: () => [jest.fn()],
}));

jest.mock('@/hooks/use-theme', () => ({ useTheme: () => ({ primary: '#000', text: '#000', textSecondary: '#666' }) }));
jest.mock('react-native-gesture-handler', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  const Native = jest.requireActual<typeof import('react-native')>('react-native');
  return {
    Gesture: {
      Pan: () => ({ activeOffsetX: () => ({ failOffsetY: () => ({ runOnJS: () => ({ onEnd: () => ({}) }) }) }) }),
    },
    GestureDetector: ({ children }: { children: React.ReactNode }) => React.createElement(Native.View, null, children),
  };
});
jest.mock('./CalendarDaySheet', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  return { CalendarDaySheet: React.forwardRef(() => null) };
});
jest.mock('./GoogleEventDetailsSheet', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  return { GoogleEventDetailsSheet: React.forwardRef(() => null) };
});
jest.mock('./GoogleCalendarStatusNotice', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  return {
    GoogleCalendarStatusNotice: ({ status }: { status: string }) =>
      React.createElement('View', { testID: `google-calendar-status-${status}` }),
  };
});
jest.mock('./CalendarGoogleEventCard', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  return {
    CalendarGoogleEventCard: ({ event }: { event: { id: string } }) =>
      React.createElement('google-card', { eventId: event.id }),
  };
});
jest.mock('./CalendarTaskChip', () => ({ CalendarTaskChip: () => null }));
jest.mock('./CalendarTaskAgendaCard', () => ({ CalendarTaskAgendaCard: () => null }));
jest.mock('./CalendarDayTimeline', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  const Native = jest.requireActual<typeof import('react-native')>('react-native');
  return { CalendarDayTimeline: () => React.createElement(Native.View, { testID: 'calendar-day-timeline' }) };
});

describe('CalendarProSurface', () => {
  beforeEach(() => {
    mockQuery.mockClear();
    mockGoogleQuery.mockClear();
    mockTasks = [];
    mockGoogleData = { events: [], googleStatus: 'ok' };
    mockGoogleCalendars = [];
    mockGoogleFetching = false;
    mockGoogleError = false;
    mockRefetchGoogleEvents.mockClear();
  });

  it('switches month, week and day views while retaining a valid selected date and query range', async () => {
    await render(<CalendarProSurface />);

    expect(screen.getByTestId('calendar-month-grid')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('calendar-view-week'));
    expect(screen.getByTestId('calendar-agenda')).toBeTruthy();
    expect(screen.getAllByTestId(/^calendar-agenda-day-/)).toHaveLength(7);
    expect(mockQuery).toHaveBeenLastCalledWith({ scheduledFrom: expect.any(String), scheduledTo: expect.any(String) });
    const lastGoogleQuery = mockGoogleQuery.mock.calls.at(-1);
    expect(lastGoogleQuery?.[0]).toEqual({
      from: rangeDate(mockQuery.mock.calls.at(-1)?.[0], 'scheduledFrom'),
      to: rangeDate(mockQuery.mock.calls.at(-1)?.[0], 'scheduledTo'),
    });
    expect(lastGoogleQuery?.[1]).toEqual({ refetchOnMountOrArgChange: true });
    const range = mockQuery.mock.calls.at(-1)?.[0] as { scheduledFrom: string; scheduledTo: string };
    expect(
      new Date(`${range.scheduledTo}T12:00:00`).getTime() - new Date(`${range.scheduledFrom}T12:00:00`).getTime()
    ).toBe(6 * 24 * 60 * 60 * 1000);

    await fireEvent.press(screen.getByTestId('calendar-view-day'));
    expect(screen.getByTestId('calendar-day-timeline')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('calendar-view-month'));
    expect(screen.getByTestId('calendar-month-grid')).toBeTruthy();
  });

  it('does not expose stale cached Google events while a refresh is in progress', async () => {
    mockGoogleData = {
      googleStatus: 'ok',
      events: [
        {
          id: 'cached',
          title: 'Cached event',
          start: '2026-09-23T09:00:00Z',
          end: '2026-09-23T10:00:00Z',
          allDay: false,
          calendarId: 'work',
          htmlLink: 'https://calendar.google.com/event',
        },
      ],
    };
    mockGoogleFetching = true;
    await render(<CalendarProSurface />);
    expect(screen.queryByTestId('google-calendar-event')).toBeNull();
    expect(screen.getByTestId('google-calendar-status-updating')).toBeTruthy();
  });
});

const rangeDate = (value: unknown, key: string): string => {
  if (typeof value !== 'object' || value === null || !(key in value)) throw new Error(`Missing ${key} query date`);
  const date = (value as Record<string, unknown>)[key];
  if (typeof date !== 'string') throw new Error(`Invalid ${key} query date`);
  return date;
};
