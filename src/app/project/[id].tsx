import { useColorScheme, View } from 'react-native';

import { Stack, useLocalSearchParams } from 'expo-router';

import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { ProjectView } from '@/features/Project/ProjectView';

// react-native-screens' native-stack isolates each top-level (non-tab-group)
// route into its own native view hierarchy — the root SafeAreaProvider AND
// the root GestureHandlerRootView (both in app/_layout.tsx) don't bridge
// across that boundary, so screens outside (tabs) need their own local
// instance of each. Without the local GestureHandlerRootView here, the task
// list's DraggableFlatList silently failed to render any rows at all — same
// underlying cause as SafeAreaView collapsing to 0 height, just a different
// symptom (gesture-handler's pan/tap detectors never attach without a root
// in scope on this side of the native-stack boundary).
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
    <GestureHandlerRootView style={{ flex: 1 }}>
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
    </GestureHandlerRootView>
  );
}
