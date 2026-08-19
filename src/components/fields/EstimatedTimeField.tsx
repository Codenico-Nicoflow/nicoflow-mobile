import { Clock, X } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, Text, TextInput, useColorScheme, View } from 'react-native';

import { cn } from '@/lib/utils/cn';

import { FieldLabel } from './FieldLabel';

const PRESETS: { minutes: number; label: string }[] = [
  { minutes: 15, label: '15m' },
  { minutes: 30, label: '30m' },
  { minutes: 60, label: '1h' },
  { minutes: 120, label: '2h' },
  { minutes: 240, label: '4h' },
  { minutes: 480, label: '8h' },
];
const PRESET_VALUES = new Set(PRESETS.map(p => p.minutes));
const MIN_MINUTES = 1;
const MAX_MINUTES = 1440;

const formatCustom = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
};

interface EstimatedTimeFieldProps {
  value: number | null;
  onChange: (value: number | null) => void;
}

export function EstimatedTimeField({ value, onChange }: EstimatedTimeFieldProps) {
  const isDark = useColorScheme() === 'dark';
  const isOffChip = value != null && !PRESET_VALUES.has(value);
  const [customOpen, setCustomOpen] = useState(isOffChip);
  const isCustomActive = customOpen || isOffChip;

  return (
    <View className="gap-1.5">
      <FieldLabel icon={Clock} label="Estimated Time" optional />
      <View className="flex-row flex-wrap gap-2">
        {PRESETS.map(preset => {
          const active = value === preset.minutes;
          return (
            <Pressable
              key={preset.minutes}
              onPress={() => {
                setCustomOpen(false);
                onChange(preset.minutes);
              }}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              className={cn(
                'h-8 rounded-md border px-3 items-center justify-center',
                active
                  ? 'bg-primary dark:bg-primary-dark border-primary dark:border-primary-dark'
                  : 'border-input dark:border-input-dark bg-transparent'
              )}>
              <Text
                className={cn(
                  'text-sm font-medium',
                  active ? 'text-primary-foreground' : 'text-foreground dark:text-foreground-dark'
                )}>
                {preset.label}
              </Text>
            </Pressable>
          );
        })}

        <Pressable
          onPress={() => {
            if (!isCustomActive) {
              setCustomOpen(true);
              onChange(null);
            }
          }}
          accessibilityRole="button"
          accessibilityState={{ selected: isCustomActive }}
          className={cn(
            'h-8 rounded-md border px-3 items-center justify-center',
            isCustomActive
              ? 'bg-primary dark:bg-primary-dark border-primary dark:border-primary-dark'
              : 'border-input dark:border-input-dark bg-transparent'
          )}>
          <Text
            className={cn(
              'text-sm font-medium',
              isCustomActive ? 'text-primary-foreground' : 'text-foreground dark:text-foreground-dark'
            )}>
            {isCustomActive && value != null ? formatCustom(value) : 'Custom'}
          </Text>
        </Pressable>

        {value != null && (
          <Pressable
            onPress={() => {
              setCustomOpen(false);
              onChange(null);
            }}
            accessibilityRole="button"
            accessibilityLabel="Clear estimated time"
            className="h-8 w-8 items-center justify-center rounded-md border border-input dark:border-input-dark">
            <X size={14} color={isDark ? '#94a3b8' : '#64748b'} />
          </Pressable>
        )}
      </View>

      {isCustomActive && (
        <View className="mt-1 w-40 flex-row items-center gap-2 rounded-md border border-input dark:border-input-dark bg-background dark:bg-background-dark px-3">
          <TextInput
            keyboardType="number-pad"
            value={value != null ? String(value) : ''}
            onChangeText={text => {
              if (text === '') {
                onChange(null);
                return;
              }
              const parsed = parseInt(text, 10);
              if (!isNaN(parsed)) onChange(Math.min(MAX_MINUTES, Math.max(MIN_MINUTES, parsed)));
            }}
            className="h-10 flex-1 text-sm text-foreground dark:text-foreground-dark"
          />
          <Text className="text-xs text-muted-foreground dark:text-muted-foreground-dark">min</Text>
        </View>
      )}
    </View>
  );
}
