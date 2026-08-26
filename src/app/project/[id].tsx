import { View } from 'react-native';

import { useLocalSearchParams } from 'expo-router';

import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { ProjectView } from '@/features/Project/ProjectView';

// react-native-screens' native-stack isolates each top-level (non-tab-group)
// route into its own native view hierarchy — the root SafeAreaProvider
// (app/_layout.tsx) doesn't bridge across that boundary, so screens outside
// (tabs) need their own local provider or SafeAreaView collapses to 0 height.
export default function ProjectDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <SafeAreaProvider>
      <View style={{ flex: 1 }} className="bg-background dark:bg-background-dark">
        <SafeAreaView style={{ flex: 1 }} className="bg-background dark:bg-background-dark">
          <ProjectView projectId={id} />
        </SafeAreaView>
      </View>
    </SafeAreaProvider>
  );
}
