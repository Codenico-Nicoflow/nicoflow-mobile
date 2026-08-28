import { useColorScheme, View } from 'react-native';

import { Stack, useLocalSearchParams } from 'expo-router';

import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { ProjectView } from '@/features/Project/ProjectView';

// react-native-screens' native-stack isolates each top-level (non-tab-group)
// route into its own native view hierarchy — the root SafeAreaProvider
// (app/_layout.tsx) doesn't bridge across that boundary, so screens outside
// (tabs) need their own local provider or SafeAreaView collapses to 0 height.
//
// The root Stack (RootNavigator) sets headerShown: false globally, which
// left this screen with no header and no bottom bar (it's outside (tabs)) —
// a dead end with no way back except iOS's edge-swipe gesture. Overriding
// headerShown per-screen here restores a native back button; the bottom tab
// bar deliberately stays hidden — this is a detail view, not a tab.
export default function ProjectDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
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
      <View style={{ flex: 1 }} className="bg-background dark:bg-background-dark">
        <SafeAreaView style={{ flex: 1 }} className="bg-background dark:bg-background-dark">
          <ProjectView projectId={id} />
        </SafeAreaView>
      </View>
    </SafeAreaProvider>
  );
}
