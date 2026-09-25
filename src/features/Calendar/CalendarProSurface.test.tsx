import type { ITask, IUser } from '@nicoflow/shared/types';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { CalendarProSurface } from './CalendarProSurface';

const mockQuery = jest.fn();
let mockTasks: ITask[] = [];

jest.mock('@/lib/store', () => ({
  mobileWSLifecycleAdapter: { onForeground: () => jest.fn() },
  useAppUser: () => ({ timezone: 'UTC', calendar: { weekStart: 1 } }) as IUser,
  useGetCalendarTasksQuery: (range: unknown) => {
    mockQuery(range);
    return { currentData: mockTasks, isLoading: false, isError: false, refetch: jest.fn() };
  },
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
jest.mock('./CalendarDaySheet', () => ({ CalendarDaySheet: () => null }));
jest.mock('./CalendarTaskChip', () => ({ CalendarTaskChip: () => null }));
jest.mock('./CalendarTaskAgendaCard', () => ({ CalendarTaskAgendaCard: () => null }));

describe('CalendarProSurface', () => {
  beforeEach(() => {
    mockQuery.mockClear();
    mockTasks = [];
  });

  it('switches month, week and day views while retaining a valid selected date and query range', async () => {
    await render(<CalendarProSurface />);

    expect(screen.getByTestId('calendar-month-grid')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('calendar-view-week'));
    expect(screen.getByTestId('calendar-agenda')).toBeTruthy();
    expect(screen.getAllByTestId(/^calendar-agenda-day-/)).toHaveLength(7);
    expect(mockQuery).toHaveBeenLastCalledWith({ scheduledFrom: expect.any(String), scheduledTo: expect.any(String) });
    const range = mockQuery.mock.calls.at(-1)?.[0] as { scheduledFrom: string; scheduledTo: string };
    expect(
      new Date(`${range.scheduledTo}T12:00:00`).getTime() - new Date(`${range.scheduledFrom}T12:00:00`).getTime()
    ).toBe(6 * 24 * 60 * 60 * 1000);

    await fireEvent.press(screen.getByTestId('calendar-view-day'));
    expect(screen.getAllByTestId(/^calendar-agenda-day-/)).toHaveLength(1);
    await fireEvent.press(screen.getByTestId('calendar-view-month'));
    expect(screen.getByTestId('calendar-month-grid')).toBeTruthy();
  });
});
