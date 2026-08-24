import { forwardRef, type ReactNode, useCallback, useImperativeHandle, useMemo, useRef } from 'react';
import { Pressable, Text, useColorScheme, View } from 'react-native';

import {
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
  BottomSheetModal,
  BottomSheetView,
} from '@gorhom/bottom-sheet';

import { cn } from '@/lib/utils/cn';

export interface DropdownMenuRef {
  present: () => void;
  dismiss: () => void;
}

export interface DropdownMenuProps {
  children: ReactNode;
}

export const DropdownMenu = forwardRef<DropdownMenuRef, { trigger: ReactNode; children: ReactNode }>(
  function DropdownMenu({ trigger, children }, ref) {
    const modalRef = useRef<BottomSheetModal>(null);
    const scheme = useColorScheme();
    const isDark = scheme === 'dark';

    useImperativeHandle(ref, () => ({
      present: () => modalRef.current?.present(),
      dismiss: () => modalRef.current?.dismiss(),
    }));

    const renderBackdrop = useCallback(
      (props: BottomSheetBackdropProps) => (
        <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} pressBehavior="close" />
      ),
      []
    );

    const snapPoints = useMemo(() => ['35%'], []);

    return (
      <>
        <Pressable onPress={() => modalRef.current?.present()} accessibilityRole="button">
          {trigger}
        </Pressable>
        <BottomSheetModal
          ref={modalRef}
          snapPoints={snapPoints}
          enablePanDownToClose
          backdropComponent={renderBackdrop}
          backgroundStyle={{ borderRadius: 20, backgroundColor: isDark ? '#0b1120' : '#f8fafc' }}
          handleIndicatorStyle={{ width: 40, backgroundColor: isDark ? '#283549' : '#e2e8f0' }}
        >
          <BottomSheetView className="gap-1 px-2 pb-4">{children}</BottomSheetView>
        </BottomSheetModal>
      </>
    );
  }
);

export interface DropdownMenuItemProps {
  children: ReactNode;
  icon?: ReactNode;
  onPress: () => void;
  variant?: 'default' | 'destructive';
  disabled?: boolean;
}

export function DropdownMenuItem({ children, icon, onPress, variant = 'default', disabled }: DropdownMenuItemProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      className={cn('flex-row items-center gap-2 rounded-sm px-3 py-3', disabled && 'opacity-50')}
    >
      {icon}
      <Text
        className={cn(
          'text-sm',
          variant === 'destructive'
            ? 'text-destructive dark:text-destructive-dark'
            : 'text-foreground dark:text-foreground-dark'
        )}
      >
        {children}
      </Text>
    </Pressable>
  );
}

export function DropdownMenuLabel({ children }: { children: ReactNode }) {
  return (
    <Text className="px-3 py-1.5 text-xs font-medium text-muted-foreground dark:text-muted-foreground-dark">
      {children}
    </Text>
  );
}

export function DropdownMenuSeparator() {
  return <View className="my-1 h-px bg-border dark:bg-border-dark" />;
}
