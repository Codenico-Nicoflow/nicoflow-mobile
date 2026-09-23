export const DURATION_MIN = 1;
export const DURATION_MAX = 1440;
export const DURATION_SUGGESTION = 30;
export const DURATION_STEP = 15;

export const dayEndMaximum = (scheduledTime: string | null | undefined): number => {
  if (!scheduledTime) return DURATION_MAX;
  const [hours, minutes] = scheduledTime.split(':').map(Number);
  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) return DURATION_MAX;
  return Math.max(DURATION_MIN, 1439 - (hours ?? 0) * 60 - (minutes ?? 0));
};

export const clampDuration = (minutes: number, scheduledTime: string | null | undefined): number =>
  Math.min(dayEndMaximum(scheduledTime), Math.max(DURATION_MIN, minutes));

export const resizeDuration = (
  initialMinutes: number,
  translationY: number,
  scheduledTime: string | null | undefined
): number => {
  const steps = Math.round(translationY / 12);
  return clampDuration(initialMinutes + steps * DURATION_STEP, scheduledTime);
};

export const parseDurationInput = (value: string): number | null => {
  if (!/^\d+$/.test(value)) return null;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= DURATION_MIN && parsed <= DURATION_MAX ? parsed : null;
};
