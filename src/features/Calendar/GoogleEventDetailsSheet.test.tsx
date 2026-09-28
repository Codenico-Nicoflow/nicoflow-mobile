import { createRef, type ReactNode } from 'react';
import { Linking } from 'react-native';

import type { IGoogleCalendar, IGoogleEvent } from '@nicoflow/shared/api';
import { act, fireEvent, render, screen } from '@testing-library/react-native';

import { GoogleEventDetailsSheet, type GoogleEventDetailsSheetRef } from './GoogleEventDetailsSheet';

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

const event: IGoogleEvent = {
  id: 'google-1',
  title: 'Design review',
  start: '2026-03-08T09:30:00+02:00',
  end: '2026-03-08T10:15:00+02:00',
  allDay: false,
  calendarId: 'calendar-a',
  htmlLink: 'https://calendar.google.com/event',
  location: 'Meeting room 2',
  organizer: 'Nico',
  description: 'Review the new calendar flow.',
};

describe('GoogleEventDetailsSheet', () => {
  it('shows available event details read-only and opens only its secure Google link', async () => {
    const ref = createRef<GoogleEventDetailsSheetRef>();
    const calendar: IGoogleCalendar = {
      id: 'calendar-a',
      summary: 'Work',
      backgroundColor: '#336699',
      primary: false,
      selected: true,
    };
    await render(<GoogleEventDetailsSheet ref={ref} calendars={[calendar]} locale="en" />);
    await act(() => ref.current?.present(event));

    expect(screen.getByText('Design review')).toBeTruthy();
    expect(screen.getByText(/09:30 – 10:15/)).toBeTruthy();
    expect(screen.getByText(/Work/)).toBeTruthy();
    expect(screen.getByText('Meeting room 2')).toBeTruthy();
    expect(screen.getByText('Organizer: Nico')).toBeTruthy();
    expect(screen.getByText('Review the new calendar flow.')).toBeTruthy();
    expect(screen.queryByLabelText(/edit|delete|move|reschedule/i)).toBeNull();
    await fireEvent.press(screen.getByLabelText('Open in Google Calendar'));
    expect(Linking.openURL).toHaveBeenCalledWith(event.htmlLink);
  });

  it('does not expose non-HTTPS event links', async () => {
    const ref = createRef<GoogleEventDetailsSheetRef>();
    await render(<GoogleEventDetailsSheet ref={ref} calendars={[]} locale="en" />);
    await act(() => ref.current?.present({ ...event, htmlLink: 'javascript:alert(1)' }));
    expect(screen.queryByLabelText('Open in Google Calendar')).toBeNull();
  });
});
