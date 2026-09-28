import { Pressable, Text, View } from 'react-native';

import { AlertTriangle } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/hooks/use-theme';

type GoogleCalendarNoticeStatus = 'loading' | 'updating' | 'empty' | 'disconnected' | 'error';

interface GoogleCalendarStatusNoticeProps {
  status: GoogleCalendarNoticeStatus;
  onRetry?: () => void;
}

export function GoogleCalendarStatusNotice({ status, onRetry }: GoogleCalendarStatusNoticeProps) {
  const { t } = useTranslation('common');
  const colors = useTheme();
  const messageKey = `pages.calendar.google${status[0]?.toUpperCase()}${status.slice(1)}` as const;
  const isStatus = status === 'disconnected' || status === 'error';

  return (
    <View
      className="mb-2 flex-row items-center gap-2 rounded-md border border-border dark:border-border-dark bg-muted/40 px-3 py-2"
      accessibilityRole={isStatus ? 'alert' : 'none'}
      accessibilityLiveRegion={isStatus ? 'assertive' : 'polite'}
      testID={`google-calendar-status-${status}`}
    >
      {isStatus ? <AlertTriangle size={16} color={colors.textSecondary} /> : null}
      <Text className="flex-1 text-xs text-muted-foreground dark:text-muted-foreground-dark">{t(messageKey)}</Text>
      {onRetry ? (
        <Pressable onPress={onRetry} accessibilityRole="button" className="min-h-8 justify-center px-2">
          <Text className="text-xs font-semibold text-primary">{t('pages.calendar.googleRetry')}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
