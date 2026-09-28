import { I18nManager, Pressable, Text, View } from 'react-native';

import type { IGoogleCalendar, IGoogleEvent } from '@nicoflow/shared/api';
import { useTranslation } from 'react-i18next';

import { Radius, Shadows } from '@/constants/theme';

import { googleEventTimeRange } from './googleCalendarOverlay';

const FALLBACK_EVENT_COLOR = '#4285F4';

const formatEventDate = (timestamp: string, locale: string): string => {
  const dayKey = timestamp.slice(0, 10);
  const [year, month, day] = dayKey.split('-').map(Number);
  return new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric' }).format(
    new Date(year ?? 0, (month ?? 1) - 1, day ?? 1, 12)
  );
};

export const calendarEventColor = (event: IGoogleEvent, calendars: readonly IGoogleCalendar[]): string =>
  calendars.find(calendar => calendar.id === event.calendarId)?.backgroundColor || FALLBACK_EVENT_COLOR;

interface CalendarGoogleEventCardProps {
  event: IGoogleEvent;
  calendars: readonly IGoogleCalendar[];
  locale: string;
  compact?: boolean;
  onSelect: (event: IGoogleEvent) => void;
}

export function CalendarGoogleEventCard({
  event,
  calendars,
  locale,
  compact = false,
  onSelect,
}: CalendarGoogleEventCardProps) {
  const { t } = useTranslation('common');
  const calendar = calendars.find(candidate => candidate.id === event.calendarId);
  const color = calendarEventColor(event, calendars);
  const timeLabel = event.allDay ? t('pages.calendar.googleAllDay') : googleEventTimeRange(event);
  const dateLabel = formatEventDate(event.start, locale);
  const accessibilityLabel = t('pages.calendar.googleEventLabel', {
    title: event.title,
    time: timeLabel ? `${dateLabel} · ${timeLabel}` : dateLabel,
  });

  return (
    <Pressable
      onPress={() => onSelect(event)}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      className={`overflow-hidden ${compact ? 'min-h-5 flex-row items-center gap-1 px-1' : 'gap-1 rounded-md border border-border dark:border-border-dark bg-card dark:bg-card-dark p-3'}`}
      style={compact ? undefined : [{ borderRadius: Radius.md }, Shadows.sm]}
      testID="google-calendar-event"
    >
      <View className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} accessibilityElementsHidden />
      <View
        className={compact ? 'min-w-0 flex-1' : 'min-w-0 flex-1 border-s-2 ps-2'}
        style={compact ? undefined : I18nManager.isRTL ? { borderRightColor: color } : { borderLeftColor: color }}
      >
        <Text
          className={
            compact
              ? 'text-[9px] font-medium text-foreground dark:text-foreground-dark'
              : 'text-sm font-semibold text-foreground dark:text-foreground-dark'
          }
          numberOfLines={compact ? 1 : 2}
        >
          {event.title}
        </Text>
        <Text
          className={
            compact
              ? 'text-[8px] text-muted-foreground dark:text-muted-foreground-dark'
              : 'text-xs text-muted-foreground dark:text-muted-foreground-dark'
          }
        >
          {timeLabel}
          {!compact && calendar ? ` · ${calendar.summary}` : ''}
        </Text>
      </View>
      {!compact && !calendar ? (
        <Text className="text-xs text-muted-foreground dark:text-muted-foreground-dark">
          {t('pages.calendar.googleCalendarName', { name: event.calendarId })}
        </Text>
      ) : null}
      {!compact ? (
        <Text className="sr-only" accessibilityElementsHidden>
          {dateLabel}
        </Text>
      ) : null}
    </Pressable>
  );
}
