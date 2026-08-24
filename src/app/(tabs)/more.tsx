import { Text, View } from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemeToggle } from '@/features/Tabs/ThemeToggle';

export default function MoreScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={{ paddingTop: insets.top }} className="flex-1 bg-background dark:bg-background-dark">
      <View className="flex-1 gap-6 px-6 pt-6">
        <Text className="text-2xl font-bold text-foreground dark:text-foreground-dark">More</Text>
        <Text className="text-sm text-muted-foreground dark:text-muted-foreground-dark">
          AI, Search, Settings, and Notifications land in a later story.
        </Text>
        <ThemeToggle />
      </View>
    </View>
  );
}
