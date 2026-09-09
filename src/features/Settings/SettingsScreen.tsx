import { ScrollView, View } from 'react-native';

import { AccountCard } from './AccountCard';
import { NotificationsCard } from './NotificationsCard';
import { PlanCard } from './PlanCard';
import { SecurityCard } from './SecurityCard';
import { SignOutCard } from './SignOutCard';
import { ThemeCard } from './ThemeCard';

// Settings, one card per section — same order and grouping as web's Settings
// page. Each card owns its own data and mutations, so this is only layout.
export function SettingsScreen() {
  return (
    <ScrollView
      className="flex-1"
      contentContainerClassName="gap-3 px-3 pb-10"
      keyboardShouldPersistTaps="handled"
      testID="settings-screen"
    >
      <View className="gap-3">
        <AccountCard />
        <PlanCard />
        <ThemeCard />
        <NotificationsCard />
        <SecurityCard />
        <SignOutCard />
      </View>
    </ScrollView>
  );
}
