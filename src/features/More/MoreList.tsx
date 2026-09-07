import { View } from 'react-native';

import { router } from 'expo-router';

import { useTranslation } from 'react-i18next';

import { MORE_DESTINATIONS } from './data';
import { MoreRow } from './MoreRow';

// Simple stack-push list, deliberately not a re-nested tab bar — these four
// sections were pushed out of the tab bar by E-034's 5-tab limit, so nesting
// a second bar here would just reintroduce the crowding it avoided.
export function MoreList() {
  const { t } = useTranslation(['nav', 'common']);

  return (
    <View className="overflow-hidden rounded-lg border border-border dark:border-border-dark bg-card dark:bg-card-dark">
      {MORE_DESTINATIONS.map((destination, index) => (
        <MoreRow
          key={destination.id}
          id={destination.id}
          label={t(destination.labelKey)}
          icon={destination.icon}
          onPress={() => router.push(destination.href)}
          isLast={index === MORE_DESTINATIONS.length - 1}
        />
      ))}
    </View>
  );
}
