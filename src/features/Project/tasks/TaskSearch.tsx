import { Pressable, TextInput, useColorScheme, View } from 'react-native';

import { Search, X } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

interface TaskSearchProps {
  value: string;
  onChange: (value: string) => void;
}

// Mirrors web's TaskSearch.tsx: a compact inline filter over the already-loaded
// task list (title + notes, client-side, debounced by the caller) — not the
// global command-palette search. Icon-left, clear-button-right when non-empty.
export function TaskSearch({ value, onChange }: TaskSearchProps) {
  const { t } = useTranslation(['task', 'common']);
  const isDark = useColorScheme() === 'dark';
  const mutedColor = isDark ? '#94a3b8' : '#64748b';

  return (
    <View className="relative justify-center">
      <Search size={16} color={mutedColor} style={{ position: 'absolute', left: 12, zIndex: 1 }} />
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={t('search.placeholder')}
        placeholderTextColor={mutedColor}
        accessibilityLabel={t('search.placeholder')}
        className="h-10 rounded-md border border-input dark:border-input-dark bg-card dark:bg-card-dark text-sm text-foreground dark:text-foreground-dark"
        style={{ paddingStart: 36, paddingEnd: value ? 36 : 12 }}
      />
      {!!value && (
        <Pressable
          onPress={() => onChange('')}
          accessibilityRole="button"
          accessibilityLabel={t('common:actions.cancel')}
          hitSlop={8}
          style={{ position: 'absolute', right: 12 }}
        >
          <X size={16} color={mutedColor} />
        </Pressable>
      )}
    </View>
  );
}
