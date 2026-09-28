import type { IGoogleCalendar, IGoogleEvent } from '@nicoflow/shared/api';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { CalendarGoogleEventCard } from './CalendarGoogleEventCard';

const event: IGoogleEvent = {
  id: 'google-1',
  title: 'Design review',
  start: '2026-03-08T09:30:00+02:00',
  end: '2026-03-08T10:15:00+02:00',
  allDay: false,
  calendarId: 'calendar-a',
  htmlLink: 'https://calendar.google.com/event',
};

describe('CalendarGoogleEventCard', () => {
  it('shows a colored read-only event card with its calendar and account-local time', async () => {
    const calendar: IGoogleCalendar = {
      id: 'calendar-a',
      summary: 'Work',
      backgroundColor: '#336699',
      primary: false,
      selected: true,
    };

    await render(
      <CalendarGoogleEventCard event={event} calendars={[calendar]} locale="en" compact={false} onSelect={jest.fn()} />
    );

    expect(screen.getByTestId('google-calendar-event')).toBeTruthy();
    expect(screen.getByText(/09:30 – 10:15/)).toBeTruthy();
    expect(screen.getByText(/Work/)).toBeTruthy();
    expect(screen.queryByLabelText(/edit|delete|move/i)).toBeNull();
  });

  it('opens read-only event details from a compact month marker', async () => {
    const onSelect = jest.fn();
    await render(<CalendarGoogleEventCard event={event} calendars={[]} locale="en" compact onSelect={onSelect} />);

    await fireEvent.press(screen.getByLabelText('Google Calendar event: Design review, Mar 8 · 09:30 – 10:15'));
    expect(onSelect).toHaveBeenCalledWith(event);
  });
});
