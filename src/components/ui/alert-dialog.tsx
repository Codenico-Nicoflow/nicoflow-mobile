import { forwardRef, type ReactNode } from 'react';
import { Pressable, Text } from 'react-native';

import { Sheet, SheetDescription, SheetFooter, SheetHeader, type SheetRef, SheetTitle } from './sheet';

export interface AlertDialogProps {
  children: ReactNode;
  onDismiss?: () => void;
}

// Consolidated on the Sheet foundation, same as Dialog — but locked height
// (no drag-to-resize) and no pan-down-to-close, since an alert dialog's
// destructive/cancel choice should be a deliberate tap, not an accidental
// swipe dismissal.
export const AlertDialog = forwardRef<SheetRef, AlertDialogProps>(function AlertDialog({ children, onDismiss }, ref) {
  return (
    <Sheet ref={ref} snapPoints={['35%']} enablePanDownToClose={false} onDismiss={onDismiss}>
      {children}
    </Sheet>
  );
});

export function AlertDialogAction({ onPress, children }: { onPress: () => void; children: ReactNode }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      className="h-11 rounded-md items-center justify-center bg-destructive dark:bg-destructive-dark"
    >
      <Text className="text-destructive-foreground dark:text-destructive-foreground-dark text-[15px] font-semibold">
        {children}
      </Text>
    </Pressable>
  );
}

export function AlertDialogCancel({ onPress, children }: { onPress: () => void; children: ReactNode }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      className="h-11 rounded-md items-center justify-center border border-input dark:border-input-dark"
    >
      <Text className="text-foreground dark:text-foreground-dark text-[15px] font-semibold">{children}</Text>
    </Pressable>
  );
}

export {
  SheetDescription as AlertDialogDescription,
  SheetFooter as AlertDialogFooter,
  SheetHeader as AlertDialogHeader,
  SheetTitle as AlertDialogTitle,
};
export type { SheetRef as AlertDialogRef };
