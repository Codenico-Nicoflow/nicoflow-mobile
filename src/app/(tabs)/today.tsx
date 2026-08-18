import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function TodayScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark">
      <View className="flex-1 items-center justify-center gap-2 px-6">
        <Text className="text-2xl font-bold text-foreground dark:text-foreground-dark">Today</Text>
        <Text className="text-sm text-center text-muted-foreground dark:text-muted-foreground-dark">
          Your Today / Tomorrow / Next 7 Days view lands in a later story.
        </Text>
      </View>
    </SafeAreaView>
  );
}
