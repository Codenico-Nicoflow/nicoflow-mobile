import { Pressable, Text, useColorScheme, View } from 'react-native';

import { Repeat } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { Checkbox } from '@/components/ui/checkbox';

interface RollOverFieldProps {
  value: boolean;
  onChange: (value: boolean) => void;
}

export function RollOverField({ value, onChange }: RollOverFieldProps) {
  const { t } = useTranslation('task');
  const isDark = useColorScheme() === 'dark';

  return (
    <Pressable
      onPress={() => onChange(!value)}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: value }}
      className="flex-row items-center gap-3 rounded-lg border border-border dark:border-border-dark bg-muted/40 dark:bg-muted-dark/40 p-3"
    >
      <Checkbox checked={value} onCheckedChange={onChange} />
      <Repeat size={16} color={isDark ? '#6366f1' : '#4f46e5'} />
      <View className="flex-1 gap-0.5">
        <Text className="text-sm text-foreground dark:text-foreground-dark">{t('dialog.rollsOverLabel')}</Text>
        <Text className="text-xs text-muted-foreground dark:text-muted-foreground-dark">
          {t('dialog.rollsOverDescription')}
        </Text>
      </View>
    </Pressable>
  );
}
