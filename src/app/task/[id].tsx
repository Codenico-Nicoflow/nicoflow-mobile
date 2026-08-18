import { useLocalSearchParams } from 'expo-router';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Deep-link placeholder for `nicoflow://task/:id` — real task detail content
// is a later story; this exists so the URL scheme resolves to a route now
// (per NIC-1945 AC3) rather than being wired retroactively once E-035 lands.
export default function TaskDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark">
      <View className="flex-1 items-center justify-center gap-2 px-6">
        <Text className="text-2xl font-bold text-foreground dark:text-foreground-dark">Task {id}</Text>
        <Text className="text-sm text-center text-muted-foreground dark:text-muted-foreground-dark">
          Task detail content lands in a later story.
        </Text>
      </View>
    </SafeAreaView>
  );
}
