import { LayoutList, Rows3 } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Pressable, useColorScheme, View } from 'react-native';

import { cn } from '@/lib/utils/cn';

import type { ViewMode } from './viewMode';

const OPTIONS: { mode: ViewMode; icon: typeof LayoutList }[] = [
  { mode: 'tabs', icon: LayoutList },
  { mode: 'combined', icon: Rows3 },
];

export function ViewModeToggle({ mode, onChange }: { mode: ViewMode; onChange: (mode: ViewMode) => void }) {
  const { t } = useTranslation('task');
  const isDark = useColorScheme() === 'dark';

  return (
    <View className="flex-row items-center gap-1 rounded-lg bg-muted dark:bg-muted-dark p-1" accessibilityRole="radiogroup">
      {OPTIONS.map(({ mode: optionMode, icon: Icon }) => {
        const isActive = optionMode === mode;
        return (
          <Pressable
            key={optionMode}
            onPress={() => onChange(optionMode)}
            accessibilityRole="radio"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={t(optionMode === 'tabs' ? 'timeSpread.viewModeTabs' : 'timeSpread.viewModeCombined')}
            testID={`timespread-viewmode-${optionMode}`}
            className={cn('rounded-md p-1.5', isActive && 'bg-background dark:bg-background-dark shadow-sm')}>
            <Icon size={16} color={isActive ? (isDark ? '#f8fafc' : '#0f172a') : isDark ? '#94a3b8' : '#64748b'} />
          </Pressable>
        );
      })}
    </View>
  );
}
