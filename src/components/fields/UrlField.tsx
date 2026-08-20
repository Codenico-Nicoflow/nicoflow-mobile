import { Link, X } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Pressable, TextInput, useColorScheme, View } from 'react-native';

import { FieldLabel } from './FieldLabel';

interface UrlFieldProps {
  value: string;
  onChange: (value: string) => void;
}

export function UrlField({ value, onChange }: UrlFieldProps) {
  const { t } = useTranslation('common');
  const isDark = useColorScheme() === 'dark';

  return (
    <View className="gap-1.5">
      <FieldLabel icon={Link} label={t('fields.urlLabel')} optional />
      <View className="flex-row gap-2">
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder="https://example.com"
          placeholderTextColor={isDark ? '#94a3b8' : '#64748b'}
          keyboardType="url"
          autoCapitalize="none"
          className="h-12 flex-1 rounded-md border border-input dark:border-input-dark px-3 text-base bg-background dark:bg-background-dark text-foreground dark:text-foreground-dark"
        />
        {!!value && (
          <Pressable
            onPress={() => onChange('')}
            accessibilityRole="button"
            accessibilityLabel={t('fields.clearUrl')}
            className="h-12 w-12 items-center justify-center rounded-md border border-input dark:border-input-dark">
            <X size={16} color={isDark ? '#94a3b8' : '#64748b'} />
          </Pressable>
        )}
      </View>
    </View>
  );
}
