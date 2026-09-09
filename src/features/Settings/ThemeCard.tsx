import { Pressable, Text, View } from 'react-native';

import { useTranslation } from 'react-i18next';

import { Radius } from '@/constants/theme';
import { type ThemeOverride, useThemeOverride } from '@/lib/theme/ThemeOverrideProvider';

import { SettingsCard } from './SettingsCard';

// null == follow the system, matching web's next-themes "system" option.
const OPTIONS: { value: ThemeOverride; labelKey: string; testID: string }[] = [
  { value: 'light', labelKey: 'theme.light', testID: 'theme-light' },
  { value: 'dark', labelKey: 'theme.dark', testID: 'theme-dark' },
  { value: null, labelKey: 'theme.system', testID: 'theme-system' },
];

// Light / Dark / System segmented control. The provider persists the choice and
// applies it via Appearance.setColorScheme, which both NativeWind and React
// Navigation read — so no extra plumbing is needed here.
export function ThemeCard() {
  const { t } = useTranslation('common');
  const { override, setOverride } = useThemeOverride();

  return (
    <SettingsCard title={t('pages.settings.themeLabel')} testID="settings-theme-card">
      <View className="flex-row gap-2">
        {OPTIONS.map(option => {
          const selected = override === option.value;
          return (
            <Pressable
              key={option.testID}
              onPress={() => setOverride(option.value)}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              testID={option.testID}
              className={`flex-1 items-center px-3 py-2 ${selected ? 'bg-primary' : 'bg-muted dark:bg-muted-dark'}`}
              style={{ borderRadius: Radius.md }}
            >
              <Text
                className={`text-xs font-medium ${
                  selected ? 'text-primary-foreground' : 'text-muted-foreground dark:text-muted-foreground-dark'
                }`}
              >
                {t(option.labelKey)}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </SettingsCard>
  );
}
