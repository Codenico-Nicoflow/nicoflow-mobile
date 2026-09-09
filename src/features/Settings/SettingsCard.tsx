import { Text, View } from 'react-native';

import type { ReactNode } from 'react';

import { Radius } from '@/constants/theme';

interface SettingsCardProps {
  title: string;
  children: ReactNode;
  testID?: string;
}

// Section shell for every Settings card — --card background, --border outline,
// --radius-lg (14px), title at text-sm font-semibold. Mirrors web's Settings
// card treatment so the two clients read as one product.
export function SettingsCard({ title, children, testID }: SettingsCardProps) {
  return (
    <View
      className="border border-border dark:border-border-dark bg-card dark:bg-card-dark px-4 py-3"
      style={{ borderRadius: Radius.lg }}
      testID={testID}
    >
      <Text className="mb-3 text-sm font-semibold text-foreground dark:text-foreground-dark">{title}</Text>
      {children}
    </View>
  );
}
