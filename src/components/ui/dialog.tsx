import { forwardRef, type ReactNode } from 'react';

import { Sheet, SheetDescription, SheetFooter, SheetHeader, type SheetRef, SheetTitle } from './sheet';

export interface DialogProps {
  children: ReactNode;
  snapPoints?: (string | number)[];
  onDismiss?: () => void;
}

// Consolidated on the Sheet foundation, not a separate centered-overlay
// system — bottom sheets are the native iOS/Android convention, a
// web-style centered modal feels foreign on mobile.
export const Dialog = forwardRef<SheetRef, DialogProps>(function Dialog({ children, snapPoints, onDismiss }, ref) {
  return (
    <Sheet ref={ref} snapPoints={snapPoints} onDismiss={onDismiss}>
      {children}
    </Sheet>
  );
});

export {
  SheetDescription as DialogDescription,
  SheetFooter as DialogFooter,
  SheetHeader as DialogHeader,
  SheetTitle as DialogTitle,
};
export type { SheetRef as DialogRef };
