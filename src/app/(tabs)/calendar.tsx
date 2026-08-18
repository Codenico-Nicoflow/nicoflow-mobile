import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Placeholder only — Pro-gating is E-058's scope. This screen must not crash
// for free-plan users in the meantime (AC4), so it deliberately renders no
// plan check at all yet rather than a half-built gate.
export default function CalendarScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark">
      <View className="flex-1 items-center justify-center gap-2 px-6">
        <Text className="text-2xl font-bold text-foreground dark:text-foreground-dark">Calendar</Text>
        <Text className="text-sm text-center text-muted-foreground dark:text-muted-foreground-dark">
          The calendar view (Pro) lands in a later story.
        </Text>
      </View>
    </SafeAreaView>
  );
}
