import { fireEvent, render, screen } from '@testing-library/react-native';

import { GoogleCalendarStatusNotice } from './GoogleCalendarStatusNotice';

describe('GoogleCalendarStatusNotice', () => {
  it('explains disconnected and recoverable error states, with retry only for errors', async () => {
    const onRetry = jest.fn();
    await render(<GoogleCalendarStatusNotice status="error" onRetry={onRetry} />);
    expect(
      screen.getByText('Google Calendar events could not be refreshed. Your task calendar is still available.')
    ).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Retry' }));
    expect(onRetry).toHaveBeenCalledTimes(1);

    await render(<GoogleCalendarStatusNotice status="disconnected" />);
    expect(screen.getByText('Google Calendar is disconnected. Connect an account to see events.')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Retry' })).toBeNull();
  });

  it('announces loading and updating without offering a retry', async () => {
    await render(<GoogleCalendarStatusNotice status="loading" />);
    expect(screen.getByText('Loading Google Calendar events…')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Retry' })).toBeNull();

    await render(<GoogleCalendarStatusNotice status="updating" />);
    expect(screen.getByText('Refreshing Google Calendar events…')).toBeTruthy();
  });

  it('explains when selected calendars have no events in the visible range', async () => {
    await render(<GoogleCalendarStatusNotice status="empty" />);
    expect(screen.getByText('No Google Calendar events in this period.')).toBeTruthy();
  });
});
