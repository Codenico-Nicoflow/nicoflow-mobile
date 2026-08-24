import { useRef } from 'react';
import { Pressable, useColorScheme, View } from 'react-native';

import { ICON_IDS, type IconId } from '@nicoflow/shared/types';
import { Check } from 'lucide-react-native';

import { Sheet, SheetHeader, type SheetRef, SheetTitle } from '@/components/ui/sheet';
import { iconComponentFor } from '@/lib/constants/icons';

import { FieldLabel } from './FieldLabel';

interface IconFieldProps {
  value: string;
  onChange: (value: IconId) => void;
  label: string;
}

// Mirrors web's IconField/index.tsx: trigger button showing the selected
// icon, opens a 5-col grid of the same 30-icon set (ICON_IDS), selected icon
// gets a Check badge overlay. Web renders the grid inline in a Popover;
// mobile uses a nested Sheet (this app's sole modal primitive, see sheet.tsx)
// stacked on top of the parent Area/Project form sheet.
export function IconField({ value, onChange, label }: IconFieldProps) {
  const isDark = useColorScheme() === 'dark';
  const sheetRef = useRef<SheetRef>(null);
  const SelectedIcon = iconComponentFor(value);
  const accentColor = isDark ? '#6366f1' : '#4f46e5';

  return (
    <View className="gap-1.5">
      <FieldLabel icon={SelectedIcon} label={label} />
      <Pressable
        onPress={() => sheetRef.current?.present()}
        accessibilityRole="button"
        accessibilityLabel={label}
        className="h-12 w-12 items-center justify-center rounded-md border border-input dark:border-input-dark bg-background dark:bg-background-dark"
      >
        <SelectedIcon size={20} color={isDark ? '#e2e8f0' : '#1e293b'} />
      </Pressable>

      <Sheet ref={sheetRef} snapPoints={['60%']}>
        <SheetHeader>
          <SheetTitle>{label}</SheetTitle>
        </SheetHeader>
        <View className="flex-row flex-wrap gap-3">
          {ICON_IDS.map(id => {
            const Icon = iconComponentFor(id);
            const selected = id === value;
            return (
              <Pressable
                key={id}
                onPress={() => {
                  onChange(id);
                  sheetRef.current?.dismiss();
                }}
                accessibilityRole="button"
                accessibilityLabel={id}
                accessibilityState={{ selected }}
                className="size-12 items-center justify-center rounded-md border border-border dark:border-border-dark"
                style={selected ? { borderColor: accentColor, backgroundColor: `${accentColor}15` } : undefined}
              >
                <Icon size={20} color={selected ? accentColor : isDark ? '#94a3b8' : '#64748b'} />
                {selected && (
                  <View
                    className="absolute -right-1 -top-1 size-4 items-center justify-center rounded-full"
                    style={{ backgroundColor: accentColor }}
                  >
                    <Check size={10} color="#ffffff" />
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>
      </Sheet>
    </View>
  );
}
