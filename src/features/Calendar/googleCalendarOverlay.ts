import type { GoogleStatus, IGoogleEvent } from '@nicoflow/shared/api';

const MINUTES_PER_DAY = 24 * 60;
const MINIMUM_EVENT_HEIGHT = 30;

const eventDayKey = (timestamp: string): string => timestamp.slice(0, 10);

const eventMinute = (timestamp: string): number | null => {
  const match = /T([01]\d|2[0-3]):([0-5]\d)/.exec(timestamp);
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
};

export const eventsOnDay = (events: readonly IGoogleEvent[], dayKey: string): IGoogleEvent[] =>
  events.filter(event => {
    if (event.allDay) return dayKey >= event.start && dayKey < event.end;

    const startDay = eventDayKey(event.start);
    const endDay = eventDayKey(event.end);
    const endMinute = eventMinute(event.end);
    return dayKey >= startDay && (dayKey < endDay || (dayKey === endDay && endMinute !== 0));
  });

export interface GoogleEventGeometry {
  top: number;
  height: number;
}

export const googleEventGeometry = (
  event: IGoogleEvent,
  dayKey: string,
  pixelsPerMinute = 1
): GoogleEventGeometry | null => {
  if (event.allDay || !eventsOnDay([event], dayKey).length) return null;
  const startsToday = eventDayKey(event.start) === dayKey;
  const endsToday = eventDayKey(event.end) === dayKey;
  const start = startsToday ? eventMinute(event.start) : 0;
  const end = endsToday ? eventMinute(event.end) : MINUTES_PER_DAY;
  if (start === null || end === null || end <= start) return null;

  return {
    top: start * pixelsPerMinute,
    height: Math.max(MINIMUM_EVENT_HEIGHT, (end - start) * pixelsPerMinute),
  };
};

export interface GoogleEventLayout extends GoogleEventGeometry {
  event: IGoogleEvent;
  column: number;
  columns: number;
}

export const layoutGoogleEvents = (
  events: readonly IGoogleEvent[],
  dayKey: string,
  pixelsPerMinute = 1
): GoogleEventLayout[] => {
  const placed = events
    .flatMap(event => {
      const geometry = googleEventGeometry(event, dayKey, pixelsPerMinute);
      return geometry ? [{ event, ...geometry, end: geometry.top + geometry.height }] : [];
    })
    .sort((left, right) => left.top - right.top || right.end - left.end);

  const output: GoogleEventLayout[] = [];
  let group: Array<(typeof placed)[number] & { column: number }> = [];
  let groupEnd = -1;
  const flush = (): void => {
    const columns = Math.max(1, ...group.map(item => item.column + 1));
    group.forEach(({ end: _end, ...item }) => output.push({ ...item, columns }));
    group = [];
    groupEnd = -1;
  };

  placed.forEach(item => {
    if (group.length > 0 && item.top >= groupEnd) flush();
    const activeColumns = new Set(group.filter(active => active.end > item.top).map(active => active.column));
    let column = 0;
    while (activeColumns.has(column)) column += 1;
    group.push({ ...item, column });
    groupEnd = Math.max(groupEnd, item.end);
  });
  if (group.length > 0) flush();
  return output;
};

export const googleEventTimeRange = (event: IGoogleEvent): string => {
  if (event.allDay) return '';
  const start = event.start.match(/T([01]\d|2[0-3]):([0-5]\d)/);
  const end = event.end.match(/T([01]\d|2[0-3]):([0-5]\d)/);
  return start && end ? `${start[1]}:${start[2]} – ${end[1]}:${end[2]}` : '';
};

export const usableGoogleEvents = (status: GoogleStatus, queryFailed: boolean): boolean =>
  status === 'ok' && !queryFailed;
