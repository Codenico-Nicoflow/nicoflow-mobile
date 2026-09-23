import { View } from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CalendarAccessGate } from '@/features/Calendar/CalendarAccessGate';
import { CalendarProSurface } from '@/features/Calendar/CalendarProSurface';

export default function CalendarScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={{ paddingTop: insets.top }} className="flex-1 bg-background dark:bg-background-dark">
      <CalendarAccessGate>
        <CalendarProSurface />
      </CalendarAccessGate>
    </View>
  );
}
