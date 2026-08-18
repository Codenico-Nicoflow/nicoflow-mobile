import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AreasScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark">
      <View className="flex-1 items-center justify-center gap-2 px-6">
        <Text className="text-2xl font-bold text-foreground dark:text-foreground-dark">Areas</Text>
        <Text className="text-sm text-center text-muted-foreground dark:text-muted-foreground-dark">
          Areas and Projects land in a later story.
        </Text>
      </View>
    </SafeAreaView>
  );
}
