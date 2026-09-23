import { createRef, type ReactNode } from 'react';

import { router } from 'expo-router';

import type { ITask } from '@nicoflow/shared/types';
import { act, fireEvent, render, screen } from '@testing-library/react-native';

import { CalendarDaySheet, type CalendarDaySheetRef } from './CalendarDaySheet';

jest.mock('@/components/ui/sheet', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  const Native = jest.requireActual<typeof import('react-native')>('react-native');
  return {
    Sheet: React.forwardRef(({ children }: { children: ReactNode }, ref) => {
      React.useImperativeHandle(ref, () => ({ present: jest.fn(), dismiss: jest.fn() }));
      return React.createElement(Native.View, null, children);
    }),
    SheetHeader: ({ children }: { children: ReactNode }) => React.createElement(Native.View, null, children),
    SheetTitle: ({ children }: { children: ReactNode }) => React.createElement(Native.Text, null, children),
  };
});

const task = (id: string, title: string): ITask => ({ id, title, scheduledFor: '2026-09-23' }) as ITask;

describe('CalendarDaySheet', () => {
  it('shows every task in server order and opens the existing string-id route', async () => {
    const ref = createRef<CalendarDaySheetRef>();
    const tasks = new Map([['2026-09-23', [task('task-a', 'First'), task('task-b', 'Second')]]]);
    await render(<CalendarDaySheet ref={ref} tasksByDay={tasks} locale="en" onSelectedDayChange={jest.fn()} />);

    await act(() => ref.current?.present('2026-09-23'));

    expect(screen.getAllByTestId(/calendar-day-task-task-/).map(row => row.props.testID)).toEqual([
      'calendar-day-task-task-a',
      'calendar-day-task-task-b',
    ]);
    await fireEvent.press(screen.getByTestId('calendar-day-task-task-b'));
    expect(router.push).toHaveBeenCalledWith('/task/task-b');
  });

  it('shows an explicit empty state for a selectable empty day', async () => {
    const ref = createRef<CalendarDaySheetRef>();
    await render(<CalendarDaySheet ref={ref} tasksByDay={new Map()} locale="en" onSelectedDayChange={jest.fn()} />);
    await act(() => ref.current?.present('2026-09-24'));
    expect(screen.getByTestId('calendar-day-empty')).toBeTruthy();
  });
});
