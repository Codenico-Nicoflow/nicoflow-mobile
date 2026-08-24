import { useState } from 'react';
import { Pressable, Text, TextInput, useColorScheme, View } from 'react-native';

import { formatDuration } from '@nicoflow/shared/utils';
import { Clock, X } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/utils/cn';

import { FieldLabel } from './FieldLabel';

const PRESETS = [15, 30, 60, 120, 240, 480];
const PRESET_KEYS: Record<number, string> = {
  15: 'fields.estChips.15m',
  30: 'fields.estChips.30m',
  60: 'fields.estChips.1h',
  120: 'fields.estChips.2h',
  240: 'fields.estChips.4h',
  480: 'fields.estChips.8h',
};
const PRESET_VALUES = new Set(PRESETS);
const MIN_MINUTES = 1;
const MAX_MINUTES = 1440;

interface EstimatedTimeFieldProps {
  value: number | null;
  onChange: (value: number | null) => void;
}

export function EstimatedTimeField({ value, onChange }: EstimatedTimeFieldProps) {
  const { t } = useTranslation('common');
  const isDark = useColorScheme() === 'dark';
  const isOffChip = value != null && !PRESET_VALUES.has(value);
  const [customOpen, setCustomOpen] = useState(isOffChip);
  const isCustomActive = customOpen || isOffChip;

  return (
    <View className="gap-1.5">
      <FieldLabel icon={Clock} label={t('fields.estimatedTimeLabel')} optional />
      <View className="flex-row flex-wrap gap-2">
        {PRESETS.map(minutes => {
          const active = value === minutes;
          return (
            <Pressable
              key={minutes}
              onPress={() => {
                setCustomOpen(false);
                onChange(minutes);
              }}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              className={cn(
                'h-8 rounded-md border px-3 items-center justify-center',
                active
                  ? 'bg-primary dark:bg-primary-dark border-primary dark:border-primary-dark'
                  : 'border-input dark:border-input-dark bg-transparent'
              )}
            >
              <Text
                className={cn(
                  'text-sm font-medium',
                  active ? 'text-primary-foreground' : 'text-foreground dark:text-foreground-dark'
                )}
              >
                {t(PRESET_KEYS[minutes] as 'fields.estChips.15m')}
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
          )}
        >
          <Text
            className={cn(
              'text-sm font-medium',
              isCustomActive ? 'text-primary-foreground' : 'text-foreground dark:text-foreground-dark'
            )}
          >
            {isCustomActive && value != null
              ? formatDuration(value, t('fields.estChips.minSuffix'), t('fields.estChips.hourSuffix'))
              : t('fields.estChips.custom')}
          </Text>
        </Pressable>

        {value != null && (
          <Pressable
            onPress={() => {
              setCustomOpen(false);
              onChange(null);
            }}
            accessibilityRole="button"
            accessibilityLabel={t('fields.estChips.clear')}
            className="h-8 w-8 items-center justify-center rounded-md border border-input dark:border-input-dark"
          >
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
          <Text className="text-xs text-muted-foreground dark:text-muted-foreground-dark">{t('fields.minutes')}</Text>
        </View>
      )}
    </View>
  );
}
