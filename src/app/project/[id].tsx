import { useLocalSearchParams } from 'expo-router';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Deep-link placeholder for `nicoflow://project/:id` — see task/[id].tsx.
export default function ProjectDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark">
      <View className="flex-1 items-center justify-center gap-2 px-6">
        <Text className="text-2xl font-bold text-foreground dark:text-foreground-dark">Project {id}</Text>
        <Text className="text-sm text-center text-muted-foreground dark:text-muted-foreground-dark">
          Project detail content lands in a later story.
        </Text>
      </View>
    </SafeAreaView>
  );
}
