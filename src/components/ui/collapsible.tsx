import { ChevronRight } from 'lucide-react-native';
import { createContext, type ReactNode, useContext, useState } from 'react';
import { Pressable, Text, useColorScheme, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { cn } from '@/lib/utils/cn';

interface CollapsibleContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const CollapsibleContext = createContext<CollapsibleContextValue | null>(null);

function useCollapsibleContext() {
  const ctx = useContext(CollapsibleContext);
  if (!ctx) throw new Error('Collapsible parts must be used within <Collapsible>');
  return ctx;
}

export interface CollapsibleProps {
  children: ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
}

export function Collapsible({ children, open, defaultOpen = false, onOpenChange, className }: CollapsibleProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const isControlled = open !== undefined;
  const resolvedOpen = isControlled ? open : uncontrolledOpen;

  const setOpen = (next: boolean) => {
    if (!isControlled) setUncontrolledOpen(next);
    onOpenChange?.(next);
  };

  return (
    <CollapsibleContext.Provider value={{ open: resolvedOpen, setOpen }}>
      <View className={className}>{children}</View>
    </CollapsibleContext.Provider>
  );
}

export interface CollapsibleTriggerProps {
  title: string;
  className?: string;
}

export function CollapsibleTrigger({ title, className }: CollapsibleTriggerProps) {
  const { open, setOpen } = useCollapsibleContext();
  const scheme = useColorScheme();
  const iconColor = scheme === 'dark' ? '#e2e8f0' : '#0f172a';

  return (
    <Pressable
      onPress={() => setOpen(!open)}
      accessibilityRole="button"
      accessibilityState={{ expanded: open }}
      className={cn('flex-row items-center gap-2', className)}>
      <View className="h-6 w-6 items-center justify-center rounded-full bg-accent dark:bg-accent-dark">
        <ChevronRight size={14} strokeWidth={2.5} color={iconColor} style={{ transform: [{ rotate: open ? '90deg' : '0deg' }] }} />
      </View>
      <Text className="text-sm text-foreground dark:text-foreground-dark">{title}</Text>
    </Pressable>
  );
}

export function CollapsibleContent({ children, className }: { children: ReactNode; className?: string }) {
  const { open } = useCollapsibleContext();
  if (!open) return null;

  return (
    <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(150)}>
      <View className={cn('mt-3 ml-6 gap-2 rounded-lg bg-accent dark:bg-accent-dark p-4', className)}>{children}</View>
    </Animated.View>
  );
}
