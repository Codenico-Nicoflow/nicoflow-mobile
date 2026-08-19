import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TimeSpreadView } from '@/features/TimeSpread/TimeSpreadView';

export default function TodayScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={{ paddingTop: insets.top }} className="flex-1 bg-background dark:bg-background-dark">
      <TimeSpreadView />
    </View>
  );
}
