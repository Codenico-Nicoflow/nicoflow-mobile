import { ActivityIndicator, Text, View } from 'react-native';

import { Lock } from 'lucide-react-native';
import type { PropsWithChildren } from 'react';
import { useTranslation } from 'react-i18next';

import { Radius, Shadows } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAppSelector } from '@/lib/store';

import { selectCalendarEntitlement } from './calendarEntitlement';

export function CalendarAccessGate({ children }: PropsWithChildren) {
  const { t } = useTranslation('common');
  const colors = useTheme();
  const entitlement = useAppSelector(selectCalendarEntitlement);

  if (entitlement === 'pending') {
    return (
      <View
        className="flex-1 items-center justify-center gap-3 px-6"
        accessibilityLabel={t('pages.calendar.loading')}
        accessibilityRole="progressbar"
        testID="calendar-entitlement-loading"
      >
        <ActivityIndicator color={colors.primary} size="small" />
        <Text className="text-sm text-muted-foreground dark:text-muted-foreground-dark text-center">
          {t('pages.calendar.loading')}
        </Text>
      </View>
    );
  }

  if (entitlement === 'free') {
    return (
      <View className="flex-1 px-4 py-5" testID="calendar-free-teaser">
        <View
          accessible={false}
          importantForAccessibility="no-hide-descendants"
          className="mb-5 overflow-hidden border border-border dark:border-border-dark bg-card dark:bg-card-dark opacity-40"
          style={[{ borderRadius: Radius.lg }, Shadows.sm]}
          testID="calendar-synthetic-grid"
        >
          <View className="flex-row border-b border-border dark:border-border-dark px-4 py-3">
            {Array.from({ length: 7 }, (_, index) => (
              <View key={index} className="flex-1 items-center">
                <View className="h-2 w-5 rounded-full bg-muted dark:bg-muted-dark" />
              </View>
            ))}
          </View>
          {Array.from({ length: 5 }, (_, row) => (
            <View key={row} className="flex-row border-b border-border dark:border-border-dark">
              {Array.from({ length: 7 }, (_, column) => (
                <View key={column} className="h-14 flex-1 border-r border-border dark:border-border-dark p-1">
                  <View className="h-2 w-2 rounded-full bg-muted dark:bg-muted-dark" />
                  {(row + column) % 3 === 0 && <View className="mt-2 h-2 rounded-full bg-primary" />}
                </View>
              ))}
            </View>
          ))}
        </View>

        <View
          className="items-center gap-3 border border-border dark:border-border-dark bg-card dark:bg-card-dark px-6 py-7"
          style={[{ borderRadius: Radius.lg }, Shadows.md]}
          accessibilityRole="summary"
        >
          <View className="h-11 w-11 items-center justify-center rounded-full bg-primary/10">
            <Lock size={20} color={colors.primary} accessibilityElementsHidden />
          </View>
          <Text className="text-lg font-semibold text-foreground dark:text-foreground-dark text-center">
            {t('pages.calendar.teaserTitle')}
          </Text>
          <Text className="text-sm text-muted-foreground dark:text-muted-foreground-dark text-center">
            {t('pages.calendar.teaserDescription')}
          </Text>
          <Text className="text-sm font-medium text-primary text-center" testID="calendar-upgrade-on-web">
            {t('pages.calendar.upgradeOnWeb')}
          </Text>
        </View>
      </View>
    );
  }

  return children;
}
