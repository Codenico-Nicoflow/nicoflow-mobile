import { Text, View } from 'react-native';

import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MoreList } from '@/features/More/MoreList';
import { ThemeToggle } from '@/features/Tabs/ThemeToggle';

export default function MoreScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation('nav');

  return (
    <View style={{ paddingTop: insets.top }} className="flex-1 bg-background dark:bg-background-dark">
      <View className="flex-1 gap-6 px-6 pt-6">
        <Text className="text-2xl font-bold text-foreground dark:text-foreground-dark">{t('more')}</Text>
        <MoreList />
        <ThemeToggle />
      </View>
    </View>
  );
}
