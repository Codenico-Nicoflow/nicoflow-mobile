import { clampDuration, dayEndMaximum, parseDurationInput, resizeDuration } from './calendarDuration';

describe('calendarDuration', () => {
  it('snaps drag changes to 15 minutes', () => {
    expect(resizeDuration(30, 13, '09:00')).toBe(45);
    expect(resizeDuration(30, -13, '09:00')).toBe(15);
  });

  it('lets the day-end clamp override snapping', () => {
    expect(dayEndMaximum('23:30')).toBe(29);
    expect(clampDuration(60, '23:30')).toBe(29);
    expect(resizeDuration(15, 24, '23:30')).toBe(29);
  });

  it.each(['0', '-1', '1441', '1.5', 'abc', ''])('rejects invalid input %s', value => {
    expect(parseDurationInput(value)).toBeNull();
  });

  it.each([
    ['1', 1],
    ['1440', 1440],
  ])('accepts boundary input %s', (value, expected) => {
    expect(parseDurationInput(value)).toBe(expected);
  });
});
