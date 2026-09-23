import { useColorScheme } from 'react-native';

import { Stack } from 'expo-router';

import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { NotificationsScreen } from '@/features/Notifications/NotificationsScreen';

// Non-(tabs) routes are isolated in their own native view hierarchy, so this
// needs its own SafeAreaProvider or SafeAreaView collapses to 0 height. The bare
// native header is there for the back chevron only — the title lives in the
// screen's own ScreenHeader, matching project/[id].
export default function NotificationsRoute() {
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
        <NotificationsScreen />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
