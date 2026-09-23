import { Text, View } from 'react-native';

import { CalendarDays } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/hooks/use-theme';

// NIC-2008 replaces this authenticated surface with the ranged month grid.
// Keeping it behind CalendarAccessGate ensures only Pro can mount that query.
export function CalendarProSurface() {
  const { t } = useTranslation('common');
  const colors = useTheme();

  return (
    <View className="flex-1 items-center justify-center gap-2 px-6" testID="calendar-pro-surface">
      <CalendarDays size={28} color={colors.primary} accessibilityElementsHidden />
      <Text className="text-2xl font-bold text-foreground dark:text-foreground-dark">{t('pages.calendar.title')}</Text>
      <Text className="text-sm text-center text-muted-foreground dark:text-muted-foreground-dark">
        {t('pages.calendar.ready')}
      </Text>
    </View>
  );
}
