import type { IGoogleEvent } from '@nicoflow/shared/api';

import {
  eventsOnDay,
  googleEventGeometry,
  googleEventTimeRange,
  layoutGoogleEvents,
  usableGoogleEvents,
} from './googleCalendarOverlay';

const timed = (id: string, start: string, end: string): IGoogleEvent => ({
  id,
  title: id,
  start,
  end,
  allDay: false,
  calendarId: 'calendar-a',
  htmlLink: 'https://calendar.google.com/event',
});

describe('Google Calendar mobile overlay', () => {
  it('keeps API-converted account wall-clock times without converting through the device timezone', () => {
    const meeting = timed('meeting', '2026-03-08T09:30:00+02:00', '2026-03-08T10:15:00+02:00');
    expect(googleEventTimeRange(meeting)).toBe('09:30 – 10:15');
    expect(googleEventGeometry(meeting, '2026-03-08', 1)).toMatchObject({ top: 570, height: 45 });
  });

  it('treats all-day end dates as exclusive and includes multi-day events on every covered day', () => {
    const event: IGoogleEvent = {
      ...timed('conference', '2026-03-08', '2026-03-10'),
      allDay: true,
    };
    expect(eventsOnDay([event], '2026-03-08')).toEqual([event]);
    expect(eventsOnDay([event], '2026-03-09')).toEqual([event]);
    expect(eventsOnDay([event], '2026-03-10')).toEqual([]);
  });

  it('clips events that cross midnight to each day without counting an event ending at midnight tomorrow', () => {
    const overnight = timed('overnight', '2026-03-08T23:30:00+02:00', '2026-03-09T00:30:00+02:00');
    const endedAtMidnight = timed('finished', '2026-03-08T23:00:00+02:00', '2026-03-09T00:00:00+02:00');
    expect(eventsOnDay([overnight, endedAtMidnight], '2026-03-09')).toEqual([overnight]);
    expect(googleEventGeometry(overnight, '2026-03-09', 1)).toMatchObject({ top: 0, height: 30 });
  });

  it('does not render cached events as fresh after a failed or incomplete response', () => {
    expect(usableGoogleEvents('ok', false)).toBe(true);
    expect(usableGoogleEvents('disconnected', false)).toBe(false);
    expect(usableGoogleEvents('error', false)).toBe(false);
    expect(usableGoogleEvents('ok', true)).toBe(false);
  });

  it('places overlapping events into separate lanes', () => {
    const events = [
      timed('first', '2026-03-08T09:00:00+02:00', '2026-03-08T10:00:00+02:00'),
      timed('second', '2026-03-08T09:30:00+02:00', '2026-03-08T10:30:00+02:00'),
      timed('third', '2026-03-08T11:00:00+02:00', '2026-03-08T11:30:00+02:00'),
    ];
    expect(layoutGoogleEvents(events, '2026-03-08').map(item => [item.event.id, item.column, item.columns])).toEqual([
      ['first', 0, 2],
      ['second', 1, 2],
      ['third', 0, 1],
    ]);
  });
});
