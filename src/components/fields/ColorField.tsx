import { Pressable, Text, View } from 'react-native';

import { Check, Palette } from 'lucide-react-native';

import { FieldLabel } from './FieldLabel';

// Web's ColorField is a free-hex-entry input; mobile trades that for a
// preset swatch grid (no HTML <input type="color"> equivalent on RN) —
// same "Color" label/default (#3B82F6), same validated hex output, just a
// tap-to-select affordance instead of typing. Palette chosen to give a
// spread of distinct, legible tones against both themes.
const PRESET_COLORS = [
  '#3B82F6', // blue (default)
  '#8B5CF6', // violet
  '#EC4899', // pink
  '#EF4444', // red
  '#F97316', // orange
  '#EAB308', // yellow
  '#22C55E', // green
  '#14B8A6', // teal
  '#06B6D4', // cyan
  '#6366F1', // indigo
  '#78716C', // stone
  '#64748B', // slate
];

interface ColorFieldProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
}

export function ColorField({ value, onChange, label }: ColorFieldProps) {
  return (
    <View className="gap-2">
      <FieldLabel icon={Palette} label={label} />
      <View className="flex-row flex-wrap gap-2.5">
        {PRESET_COLORS.map(color => {
          const selected = color.toLowerCase() === value.toLowerCase();
          return (
            <Pressable
              key={color}
              onPress={() => onChange(color)}
              accessibilityRole="button"
              accessibilityLabel={color}
              accessibilityState={{ selected }}
              className="size-9 items-center justify-center rounded-full"
              style={{ backgroundColor: color }}
            >
              {selected && <Check size={16} color="#ffffff" />}
            </Pressable>
          );
        })}
      </View>
      <Text className="text-xs text-muted-foreground dark:text-muted-foreground-dark">{value}</Text>
    </View>
  );
}
