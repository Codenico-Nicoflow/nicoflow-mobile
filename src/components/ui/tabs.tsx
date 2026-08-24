import { createContext, type ReactNode, useContext, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { cn } from '@/lib/utils/cn';

interface TabsContextValue {
  value: string;
  setValue: (value: string) => void;
}

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabsContext() {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error('Tabs parts must be used within <Tabs>');
  return ctx;
}

export interface TabsProps {
  children: ReactNode;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  className?: string;
}

export function Tabs({ children, value, defaultValue = '', onValueChange, className }: TabsProps) {
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue);
  const isControlled = value !== undefined;
  const resolvedValue = isControlled ? value : uncontrolledValue;

  const setValue = (next: string) => {
    if (!isControlled) setUncontrolledValue(next);
    onValueChange?.(next);
  };

  return (
    <TabsContext.Provider value={{ value: resolvedValue, setValue }}>
      <View className={className}>{children}</View>
    </TabsContext.Provider>
  );
}

export function TabsList({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <View className={cn('flex-row items-center rounded-lg bg-muted dark:bg-muted-dark p-1', className)}>
      {children}
    </View>
  );
}

export function TabsTrigger({
  value,
  children,
  className,
}: {
  value: string;
  children: ReactNode;
  className?: string;
}) {
  const { value: activeValue, setValue } = useTabsContext();
  const isActive = activeValue === value;

  return (
    <Pressable
      onPress={() => setValue(value)}
      accessibilityRole="tab"
      accessibilityState={{ selected: isActive }}
      className={cn(
        'flex-1 items-center justify-center rounded-md px-3 py-1',
        isActive && 'bg-background dark:bg-background-dark shadow-sm',
        className
      )}
    >
      <Text
        className={cn(
          'text-sm font-medium',
          isActive
            ? 'text-foreground dark:text-foreground-dark'
            : 'text-muted-foreground dark:text-muted-foreground-dark'
        )}
      >
        {children}
      </Text>
    </Pressable>
  );
}

export function TabsContent({
  value,
  children,
  className,
}: {
  value: string;
  children: ReactNode;
  className?: string;
}) {
  const { value: activeValue } = useTabsContext();
  if (activeValue !== value) return null;

  return <View className={cn('mt-2', className)}>{children}</View>;
}
