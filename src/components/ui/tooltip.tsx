import { type ReactNode, useRef, useState } from 'react';
import { type LayoutRectangle, Modal, Pressable, Text, View } from 'react-native';

import { cn } from '@/lib/utils/cn';

export function Tooltip({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export function TooltipTrigger({ children, label }: { children: ReactNode; label: string }) {
  const [open, setOpen] = useState(false);
  const [anchorRect, setAnchorRect] = useState<LayoutRectangle | null>(null);
  const ref = useRef<View>(null);

  const handleLongPress = () => {
    ref.current?.measureInWindow((x, y, width, height) => {
      setAnchorRect({ x, y, width, height });
      setOpen(true);
    });
  };

  return (
    <View ref={ref} collapsable={false}>
      <Pressable onLongPress={handleLongPress} onPressOut={() => setOpen(false)} accessibilityLabel={label}>
        {children}
      </Pressable>
      {open && anchorRect && (
        <Modal transparent visible={open} animationType="fade">
          <View
            style={{ position: 'absolute', top: anchorRect.y - 36, left: anchorRect.x }}
            className="rounded-md bg-foreground dark:bg-foreground-dark px-3 py-1.5"
          >
            <Text className="text-xs text-background dark:text-background-dark">{label}</Text>
          </View>
        </Modal>
      )}
    </View>
  );
}

export function TooltipContent({ className }: { className?: string }) {
  return <View className={cn(className)} />;
}
