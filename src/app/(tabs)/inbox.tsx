import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function InboxScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={{ paddingTop: insets.top }} className="flex-1 bg-background dark:bg-background-dark">
      <View className="flex-1 items-center justify-center gap-2 px-6">
        <Text className="text-2xl font-bold text-foreground dark:text-foreground-dark">Inbox</Text>
        <Text className="text-sm text-center text-muted-foreground dark:text-muted-foreground-dark">
          Capture and process lands in a later story.
        </Text>
      </View>
    </View>
  );
}
