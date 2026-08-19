import { forwardRef, type ReactNode, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { BackHandler, Platform, Pressable, Text, useColorScheme, View } from 'react-native';

import {
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
  BottomSheetModal,
  BottomSheetView,
} from '@gorhom/bottom-sheet';

export interface SheetRef {
  present: () => void;
  dismiss: () => void;
}

export interface SheetProps {
  children: ReactNode;
  snapPoints?: (string | number)[];
  onDismiss?: () => void;
  enablePanDownToClose?: boolean;
}

// Foundation primitive — everything sheet/modal-shaped (Dialog, AlertDialog)
// builds on this, not the other way around. Spring open/close + backdrop
// fade are gorhom's defaults; we don't override the animation config.
export const Sheet = forwardRef<SheetRef, SheetProps>(function Sheet(
  { children, snapPoints, onDismiss, enablePanDownToClose = true },
  ref
) {
  const modalRef = useRef<BottomSheetModal>(null);
  const points = useMemo(() => snapPoints ?? ['50%'], [snapPoints]);
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const [isOpen, setIsOpen] = useState(false);

  useImperativeHandle(ref, () => ({
    present: () => modalRef.current?.present(),
    dismiss: () => modalRef.current?.dismiss(),
  }));

  // BottomSheetModal has no built-in Android hardware-back handling — a
  // dismissed sheet's index goes to -1 via onChange, so track that and, while
  // open, intercept the back press to close the sheet instead of the screen
  // beneath it.
  useEffect(() => {
    if (Platform.OS !== 'android' || !isOpen) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      modalRef.current?.dismiss();
      return true;
    });
    return () => sub.remove();
  }, [isOpen]);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} pressBehavior="close" />
    ),
    []
  );

  return (
    <BottomSheetModal
      ref={modalRef}
      snapPoints={points}
      enablePanDownToClose={enablePanDownToClose}
      onDismiss={onDismiss}
      onChange={index => setIsOpen(index >= 0)}
      // 'switch' (the gorhom default) minimizes whatever sheet is already
      // open when a new one presents — fine for two independent sheets, but
      // when a Select opens from inside this Sheet (TaskCreateSheet's
      // project/priority/repeat pickers, BucketProcessSheet's project/type
      // pickers) it minimizes THIS sheet instead of stacking on top, which
      // reads as the outer sheet auto-closing mid-pick. 'push' keeps every
      // sheet independent so nesting works.
      stackBehavior="push"
      backdropComponent={renderBackdrop}
      backgroundStyle={{ borderRadius: 20, backgroundColor: isDark ? '#0b1120' : '#f8fafc' }}
      handleIndicatorStyle={{ width: 40, backgroundColor: isDark ? '#283549' : '#e2e8f0' }}>
      <BottomSheetView className="flex-1 px-4">{children}</BottomSheetView>
    </BottomSheetModal>
  );
});

export function SheetHeader({ children }: { children: ReactNode }) {
  return <View className="gap-1.5 pb-4">{children}</View>;
}

export function SheetFooter({ children }: { children: ReactNode }) {
  return <View className="mt-auto gap-2 pt-4">{children}</View>;
}

export function SheetTitle({ children }: { children: ReactNode }) {
  return <Text className="text-foreground dark:text-foreground-dark text-lg font-semibold">{children}</Text>;
}

export function SheetDescription({ children }: { children: ReactNode }) {
  return <Text className="text-muted-foreground dark:text-muted-foreground-dark text-sm">{children}</Text>;
}

// Convenience close trigger for content that isn't a header action button —
// most sheets close via swipe-down or backdrop tap, this covers explicit
// in-content "Cancel"/"Close" text actions.
export function SheetClose({ onPress, children }: { onPress: () => void; children: ReactNode }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button">
      {children}
    </Pressable>
  );
}
