import { createContext, type ReactNode, useCallback, useContext, useRef, useState } from 'react';
import { Modal, Pressable, View, type LayoutRectangle } from 'react-native';

import { cn } from '@/lib/utils/cn';

interface PopoverContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  anchorRect: LayoutRectangle | null;
  setAnchorRect: (rect: LayoutRectangle | null) => void;
}

const PopoverContext = createContext<PopoverContextValue | null>(null);

function usePopoverContext() {
  const ctx = useContext(PopoverContext);
  if (!ctx) throw new Error('Popover parts must be used within <Popover>');
  return ctx;
}

export interface PopoverProps {
  children: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function Popover({ children, open: controlledOpen, onOpenChange }: PopoverProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const [anchorRect, setAnchorRect] = useState<LayoutRectangle | null>(null);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolledOpen;

  const setOpen = (next: boolean) => {
    if (!isControlled) setUncontrolledOpen(next);
    onOpenChange?.(next);
  };

  return (
    <PopoverContext.Provider value={{ open, setOpen, anchorRect, setAnchorRect }}>{children}</PopoverContext.Provider>
  );
}

export function PopoverTrigger({ children }: { children: ReactNode }) {
  const { setOpen, setAnchorRect } = usePopoverContext();
  const ref = useRef<View>(null);

  const handlePress = useCallback(() => {
    ref.current?.measureInWindow((x, y, width, height) => {
      setAnchorRect({ x, y, width, height });
      setOpen(true);
    });
  }, [setAnchorRect, setOpen]);

  return (
    <View ref={ref} collapsable={false}>
      <Pressable onPress={handlePress} accessibilityRole="button">
        {children}
      </Pressable>
    </View>
  );
}

export function PopoverContent({ children, className }: { children: ReactNode; className?: string }) {
  const { open, setOpen, anchorRect } = usePopoverContext();

  if (!open || !anchorRect) return null;

  return (
    <Modal transparent visible={open} animationType="fade" onRequestClose={() => setOpen(false)}>
      <Pressable className="flex-1" onPress={() => setOpen(false)}>
        <View
          style={{ position: 'absolute', top: anchorRect.y + anchorRect.height + 4, left: anchorRect.x, width: 288 }}
          className={cn(
            'rounded-md border p-4 shadow-md bg-card dark:bg-card-dark border-border dark:border-border-dark',
            className
          )}>
          <Pressable onPress={e => e.stopPropagation()}>{children}</Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}
