import { View } from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AreasList } from '@/features/Areas/AreasList';

export default function AreasScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={{ paddingTop: insets.top }} className="flex-1 bg-background dark:bg-background-dark">
      <AreasList />
    </View>
  );
}
