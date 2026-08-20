import { TaskEnergy } from '@nicoflow/shared/types';
import { Zap } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';

import { ENERGY_OPTIONS } from '@/lib/constants/energy';
import { cn } from '@/lib/utils/cn';

import { FieldLabel } from './FieldLabel';

interface EnergyFieldProps {
  value: TaskEnergy;
  onChange: (value: TaskEnergy) => void;
  isDark: boolean;
}

export function EnergyField({ value, onChange, isDark }: EnergyFieldProps) {
  const { t } = useTranslation(['common', 'task']);

  return (
    <View className="gap-1.5">
      <FieldLabel icon={Zap} label={t('common:fields.energyLabel')} />
      <View
        className="flex-row rounded-lg bg-muted dark:bg-muted-dark p-1"
        role="radiogroup"
        accessibilityRole="radiogroup">
        {ENERGY_OPTIONS.map(option => {
          const selected = value === option.value;
          const Icon = option.icon;
          return (
            <Pressable
              key={option.value}
              onPress={() => onChange(option.value)}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              className={cn(
                'flex-1 flex-row items-center justify-center gap-1.5 rounded-md px-2 py-2',
                selected && 'bg-background dark:bg-background-dark shadow-sm'
              )}>
              <Icon size={16} color={selected ? (isDark ? option.darkColor : option.color) : isDark ? '#94a3b8' : '#64748b'} />
              <Text
                className={cn(
                  'text-sm font-medium',
                  selected
                    ? 'text-foreground dark:text-foreground-dark'
                    : 'text-muted-foreground dark:text-muted-foreground-dark'
                )}>
                {t(`task:energy.${option.value}`)}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
