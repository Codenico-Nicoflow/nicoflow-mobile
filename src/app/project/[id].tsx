import { useLocalSearchParams } from 'expo-router';

import { SafeAreaView } from 'react-native-safe-area-context';

import { ProjectView } from '@/features/Project/ProjectView';

export default function ProjectDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark">
      <ProjectView projectId={id} />
    </SafeAreaView>
  );
}
