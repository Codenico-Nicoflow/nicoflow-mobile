import { TaskEnergy } from '@nicoflow/shared/types';
import { BatteryLow, BatteryMedium, Brain, type LucideIcon, Zap } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import { cn } from '@/lib/utils/cn';

import { FieldLabel } from './FieldLabel';

const ENERGY_OPTIONS: { value: TaskEnergy; icon: LucideIcon; label: string; color: string; darkColor: string }[] = [
  { value: TaskEnergy.LOW, icon: BatteryLow, label: 'Low', color: '#10b981', darkColor: '#34d399' },
  { value: TaskEnergy.MEDIUM, icon: BatteryMedium, label: 'Medium', color: '#f59e0b', darkColor: '#fbbf24' },
  { value: TaskEnergy.DEEP, icon: Brain, label: 'Deep', color: '#8b5cf6', darkColor: '#a78bfa' },
];

interface EnergyFieldProps {
  value: TaskEnergy;
  onChange: (value: TaskEnergy) => void;
  isDark: boolean;
}

export function EnergyField({ value, onChange, isDark }: EnergyFieldProps) {
  return (
    <View className="gap-1.5">
      <FieldLabel icon={Zap} label="Energy" />
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
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
