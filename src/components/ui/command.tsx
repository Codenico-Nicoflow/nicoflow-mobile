import { Search, X } from 'lucide-react-native';
import { type ReactNode } from 'react';
import { Modal, Pressable, Text, TextInput, useColorScheme, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { cn } from '@/lib/utils/cn';

export interface CommandProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  children: ReactNode;
}

export function Command({ open, onOpenChange, value, onValueChange, placeholder = 'Search…', children }: CommandProps) {
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  return (
    <Modal visible={open} animationType="slide" onRequestClose={() => onOpenChange(false)} presentationStyle="pageSheet">
      <View style={{ paddingTop: insets.top }} className="flex-1 bg-background dark:bg-background-dark">
        <View className="flex-row items-center gap-2 border-b border-border dark:border-border-dark px-4 py-3">
          <Search size={18} color={isDark ? '#94a3b8' : '#64748b'} />
          <TextInput
            autoFocus
            value={value}
            onChangeText={onValueChange}
            placeholder={placeholder}
            placeholderTextColor={isDark ? '#94a3b8' : '#64748b'}
            className="flex-1 text-base text-foreground dark:text-foreground-dark"
          />
          {value.length > 0 && (
            <Pressable onPress={() => onValueChange('')} accessibilityRole="button" accessibilityLabel="Clear search">
              <X size={16} color={isDark ? '#94a3b8' : '#64748b'} />
            </Pressable>
          )}
          <Pressable onPress={() => onOpenChange(false)} accessibilityRole="button">
            <Text className="text-sm text-primary dark:text-primary-dark">Cancel</Text>
          </Pressable>
        </View>
        <View className="flex-1">{children}</View>
      </View>
    </Modal>
  );
}

export function CommandEmpty({ children }: { children: ReactNode }) {
  return (
    <View className="items-center justify-center py-12">
      <Text className="text-sm text-muted-foreground dark:text-muted-foreground-dark">{children}</Text>
    </View>
  );
}

export function CommandGroup({ heading, children }: { heading?: string; children: ReactNode }) {
  return (
    <View className="gap-1 px-2 py-2">
      {heading && <Text className="px-2 py-1 text-xs font-medium text-muted-foreground dark:text-muted-foreground-dark">{heading}</Text>}
      {children}
    </View>
  );
}

export function CommandItem({ children, onPress, className }: { children: ReactNode; onPress: () => void; className?: string }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" className={cn('flex-row items-center gap-2 rounded-md px-2 py-3', className)}>
      {children}
    </Pressable>
  );
}
