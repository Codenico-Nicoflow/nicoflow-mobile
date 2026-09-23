import { useColorScheme } from 'react-native';

import { Stack } from 'expo-router';

import { useTranslation } from 'react-i18next';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/ui/screen-header';
import { SettingsScreen } from '@/features/Settings/SettingsScreen';

// Non-(tabs) routes are isolated in their own native view hierarchy, so this
// needs its own SafeAreaProvider or SafeAreaView collapses to 0 height.
export default function SettingsRoute() {
  const { t } = useTranslation('common');
  const isDark = useColorScheme() === 'dark';

  return (
    <SafeAreaProvider>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: '',
          headerBackButtonDisplayMode: 'minimal',
          headerStyle: { backgroundColor: isDark ? '#0b1120' : '#f8fafc' },
          headerTintColor: isDark ? '#e2e8f0' : '#0f172a',
          headerShadowVisible: false,
        }}
      />
      <SafeAreaView style={{ flex: 1 }} className="bg-background dark:bg-background-dark">
        <ScreenHeader title={t('pages.settings.title')} />

        <SettingsScreen />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
