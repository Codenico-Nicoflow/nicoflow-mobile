import { Pressable, Text, View } from 'react-native';

import { useThemeOverride } from '@/lib/theme/ThemeOverrideProvider';
import { cn } from '@/lib/utils/cn';

const OPTIONS: { label: string; value: 'light' | 'dark' | null }[] = [
  { label: 'Light', value: 'light' },
  { label: 'Dark', value: 'dark' },
  { label: 'System', value: null },
];

export function ThemeToggle() {
  const { override, setOverride } = useThemeOverride();

  return (
    <View className="flex-row rounded-lg bg-muted dark:bg-muted-dark p-1">
      {OPTIONS.map(option => {
        const isActive = option.value === override;
        return (
          <Pressable
            key={option.label}
            onPress={() => setOverride(option.value)}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
            className={cn(
              'flex-1 items-center rounded-md px-3 py-2',
              isActive && 'bg-background dark:bg-background-dark shadow-sm'
            )}
          >
            <Text
              className={cn(
                'text-sm font-medium',
                isActive
                  ? 'text-foreground dark:text-foreground-dark'
                  : 'text-muted-foreground dark:text-muted-foreground-dark'
              )}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
