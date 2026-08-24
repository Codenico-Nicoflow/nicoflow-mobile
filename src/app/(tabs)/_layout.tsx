import { View } from 'react-native';

import { Tabs } from 'expo-router';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CustomTabBar } from '@/features/Tabs/CustomTabBar';
import { TimezoneDriftBanner } from '@/features/TimezoneDrift/TimezoneDriftBanner';

export default function AppTabs() {
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1 }}>
      <View style={{ position: 'absolute', top: insets.top, left: 0, right: 0, zIndex: 10 }}>
        <TimezoneDriftBanner />
      </View>
      <Tabs tabBar={props => <CustomTabBar {...props} />} screenOptions={{ headerShown: false }}>
        <Tabs.Screen name="today" options={{ title: 'Today' }} />
        <Tabs.Screen name="inbox" options={{ title: 'Inbox' }} />
        <Tabs.Screen name="areas" options={{ title: 'Areas' }} />
        <Tabs.Screen name="calendar" options={{ title: 'Calendar' }} />
        <Tabs.Screen name="more" options={{ title: 'More' }} />
      </Tabs>
    </View>
  );
}
