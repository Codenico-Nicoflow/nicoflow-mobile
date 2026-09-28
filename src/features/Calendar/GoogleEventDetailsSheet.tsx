import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { Linking, Pressable, Text, View } from 'react-native';

import type { IGoogleCalendar, IGoogleEvent } from '@nicoflow/shared/api';
import { ExternalLink, MapPin } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { Sheet, SheetHeader, type SheetRef, SheetTitle } from '@/components/ui/sheet';

import { googleEventTimeRange } from './googleCalendarOverlay';

export interface GoogleEventDetailsSheetRef {
  present: (event: IGoogleEvent) => void;
  dismiss: () => void;
}

interface GoogleEventDetailsSheetProps {
  calendars: readonly IGoogleCalendar[];
  locale: string;
}

const formatDate = (dayKey: string, locale: string): string =>
  new Intl.DateTimeFormat(locale, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).format(
    new Date(`${dayKey}T12:00:00`)
  );

const displayDateRange = (event: IGoogleEvent, locale: string): string => {
  const start = formatDate(event.start.slice(0, 10), locale);
  if (event.end.slice(0, 10) <= event.start.slice(0, 10)) return start;
  if (!event.allDay) return `${start} – ${formatDate(event.end.slice(0, 10), locale)}`;
  const exclusiveEnd = new Date(`${event.end.slice(0, 10)}T12:00:00`);
  exclusiveEnd.setDate(exclusiveEnd.getDate() - 1);
  const endKey = `${exclusiveEnd.getFullYear()}-${String(exclusiveEnd.getMonth() + 1).padStart(2, '0')}-${String(exclusiveEnd.getDate()).padStart(2, '0')}`;
  return endKey === event.start.slice(0, 10) ? start : `${start} – ${formatDate(endKey, locale)}`;
};

export const GoogleEventDetailsSheet = forwardRef<GoogleEventDetailsSheetRef, GoogleEventDetailsSheetProps>(
  function GoogleEventDetailsSheet({ calendars, locale }, ref) {
    const { t } = useTranslation('common');
    const sheetRef = useRef<SheetRef>(null);
    const [event, setEvent] = useState<IGoogleEvent | null>(null);
    const calendar = event ? calendars.find(candidate => candidate.id === event.calendarId) : undefined;
    const isSafeLink = Boolean(event?.htmlLink.startsWith('https://'));

    useImperativeHandle(ref, () => ({
      present: nextEvent => {
        setEvent(nextEvent);
        sheetRef.current?.present();
      },
      dismiss: () => {
        sheetRef.current?.dismiss();
        setEvent(null);
      },
    }));

    return (
      <Sheet ref={sheetRef} snapPoints={['55%']} onDismiss={() => setEvent(null)}>
        {event ? (
          <View className="gap-4" testID="google-event-details">
            <SheetHeader>
              <SheetTitle>{event.title}</SheetTitle>
              <Text className="text-sm text-muted-foreground dark:text-muted-foreground-dark">
                {event.allDay ? t('pages.calendar.googleAllDay') : googleEventTimeRange(event)} ·{' '}
                {displayDateRange(event, locale)}
              </Text>
            </SheetHeader>

            <View className="gap-3">
              <Text className="text-sm font-medium text-foreground dark:text-foreground-dark">
                {t('pages.calendar.googleCalendarName', { name: calendar?.summary ?? event.calendarId })}
              </Text>
              {event.location ? (
                <View className="flex-row items-start gap-2">
                  <MapPin size={16} />
                  <Text className="flex-1 text-sm text-muted-foreground dark:text-muted-foreground-dark">
                    {event.location}
                  </Text>
                </View>
              ) : null}
              {event.organizer ? (
                <Text className="text-sm text-muted-foreground dark:text-muted-foreground-dark">
                  {t('pages.calendar.googleOrganizer', { name: event.organizer })}
                </Text>
              ) : null}
              {event.description ? (
                <Text className="text-sm text-muted-foreground dark:text-muted-foreground-dark">
                  {event.description}
                </Text>
              ) : null}
            </View>

            {isSafeLink ? (
              <Pressable
                onPress={() => event && void Linking.openURL(event.htmlLink)}
                accessibilityRole="link"
                accessibilityLabel={t('pages.calendar.googleOpenLink')}
                className="min-h-11 flex-row items-center gap-2"
              >
                <ExternalLink size={16} />
                <Text className="text-sm font-semibold text-primary">{t('pages.calendar.googleOpenLink')}</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}
      </Sheet>
    );
  }
);
