import { Text, View } from 'react-native';

import { useTranslation } from 'react-i18next';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { SearchScreen } from '@/features/Search/SearchScreen';

// Non-(tabs) routes are isolated in their own native view hierarchy, so this
// needs its own SafeAreaProvider or SafeAreaView collapses to 0 height.
export default function SearchRoute() {
  const { t } = useTranslation('common');

  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1 }} className="bg-background dark:bg-background-dark">
        <View className="px-3 py-3">
          <Text className="text-lg font-semibold text-foreground dark:text-foreground-dark">
            {t('search.hintTitle')}
          </Text>
        </View>

        <SearchScreen />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
