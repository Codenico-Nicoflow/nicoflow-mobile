import { type LucideIcon } from 'lucide-react-native';
import { type ReactNode } from 'react';
import { Text, useColorScheme, View } from 'react-native';

export interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  testID?: string;
}

// Mirrors web's EmptyState (nicoflow-frontend/src/components/EmptyState/index.tsx):
// circle icon on a muted background, centered title + description, optional
// action slot. Used for both empty lists and errors (an error is an
// AlertTriangle icon + retry action through this same component, same as
// web's HabitsErrorState) — there is no separate error-screen primitive.
export function EmptyState({ icon: Icon, title, description, action, testID }: EmptyStateProps) {
  const isDark = useColorScheme() === 'dark';
  const mutedColor = isDark ? '#94a3b8' : '#64748b';

  return (
    <View className="items-center justify-center py-12 px-6" testID={testID ?? 'empty-state'}>
      <View
        className="items-center justify-center rounded-full bg-muted dark:bg-muted-dark border border-border dark:border-border-dark p-5 mb-4"
        testID={testID ? `${testID}-icon` : 'empty-state-icon'}>
        <Icon size={32} color={mutedColor} />
      </View>
      <Text
        className="text-base font-medium text-foreground dark:text-foreground-dark text-center mb-1"
        testID={testID ? `${testID}-title` : 'empty-state-title'}>
        {title}
      </Text>
      {!!description && (
        <Text
          className="text-sm text-muted-foreground dark:text-muted-foreground-dark text-center"
          testID={testID ? `${testID}-description` : 'empty-state-description'}>
          {description}
        </Text>
      )}
      {!!action && (
        <View className="mt-3" testID={testID ? `${testID}-action` : 'empty-state-action'}>
          {action}
        </View>
      )}
    </View>
  );
}
