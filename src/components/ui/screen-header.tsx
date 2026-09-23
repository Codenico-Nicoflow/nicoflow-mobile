import { type ReactNode } from 'react';
import { Text, View } from 'react-native';

interface ScreenHeaderProps {
  title: string;
  /** Second line under the title — counts, a status, a hint. */
  subtitle?: ReactNode;
  /** Trailing controls, laid out in a row. */
  actions?: ReactNode;
  testID?: string;
}

// The title block the list screens share. Deliberately thin: title, optional
// subtitle, optional trailing actions. Screens whose header is something else
// entirely — Today, which leads with a segment control rather than a title —
// are better off not using it than bending it into a props soup.
export function ScreenHeader({ title, subtitle, actions, testID = 'screen-header' }: ScreenHeaderProps) {
  return (
    <View className="flex-row items-start justify-between gap-2 px-4 pt-2 pb-3" testID={testID}>
      <View className="min-w-0 flex-1">
        <Text className="text-2xl font-bold text-foreground dark:text-foreground-dark">{title}</Text>
        {typeof subtitle === 'string' ? (
          <Text className="text-sm text-muted-foreground dark:text-muted-foreground-dark">{subtitle}</Text>
        ) : (
          subtitle
        )}
      </View>
      {actions && <View className="flex-row items-center gap-2">{actions}</View>}
    </View>
  );
}
