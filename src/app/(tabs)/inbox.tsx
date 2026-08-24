import { View } from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { InboxView } from '@/features/Inbox/InboxView';

export default function InboxScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={{ paddingTop: insets.top }} className="flex-1 bg-background dark:bg-background-dark">
      <InboxView />
    </View>
  );
}
