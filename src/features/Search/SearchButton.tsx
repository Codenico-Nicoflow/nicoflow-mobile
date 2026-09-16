import { Pressable, useColorScheme } from 'react-native';

import { router } from 'expo-router';

import { Search } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

// Opens the search screen from a list screen's header. Known-item lookup is the
// common case ("find that task I know exists"), so search lives where the lists
// are rather than behind the More tab.
//
// Labelled with common:search.hintTitle — the same key More/data.ts uses for its
// search row, already translated in every locale. Web has no equivalent key
// because it renders search as a command-palette trigger, not a nav destination.
export function SearchButton({ testID = 'search-button' }: { testID?: string }) {
  const { t } = useTranslation('common');
  const isDark = useColorScheme() === 'dark';

  return (
    <Pressable
      onPress={() => router.push('/search')}
      accessibilityRole="button"
      accessibilityLabel={t('search.hintTitle')}
      hitSlop={8}
      className="h-9 w-9 items-center justify-center rounded-md active:bg-muted dark:active:bg-muted-dark"
      testID={testID}
    >
      <Search size={20} color={isDark ? '#94a3b8' : '#64748b'} />
    </Pressable>
  );
}
