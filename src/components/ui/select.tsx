import {
  createContext,
  forwardRef,
  type ReactNode,
  useCallback,
  useContext,
  useImperativeHandle,
  useMemo,
  useRef,
} from 'react';
import { Pressable, Text, useColorScheme, View } from 'react-native';

import {
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
  BottomSheetFlatList,
  BottomSheetModal,
} from '@gorhom/bottom-sheet';
import { Check, ChevronDown, type LucideIcon } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { cn } from '@/lib/utils/cn';

export interface SelectOption {
  label: string;
  value: string;
  icon?: LucideIcon;
}

interface SelectContextValue {
  value?: string;
  onValueChange: (value: string) => void;
  options: SelectOption[];
  present: () => void;
}

const SelectContext = createContext<SelectContextValue | null>(null);

function useSelectContext() {
  const ctx = useContext(SelectContext);
  if (!ctx) throw new Error('Select parts must be used within <Select>');
  return ctx;
}

export interface SelectRef {
  present: () => void;
  dismiss: () => void;
}

export interface SelectProps {
  value?: string;
  onValueChange: (value: string) => void;
  options: SelectOption[];
  children: ReactNode;
  disabled?: boolean;
}

export const Select = forwardRef<SelectRef, SelectProps>(function Select(
  { value, onValueChange, options, children },
  ref
) {
  const modalRef = useRef<BottomSheetModal>(null);
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const insets = useSafeAreaInsets();
  const bottomPadding = insets.bottom > 0 ? insets.bottom + 12 : 16;

  useImperativeHandle(ref, () => ({
    present: () => modalRef.current?.present(),
    dismiss: () => modalRef.current?.dismiss(),
  }));

  const present = useCallback(() => modalRef.current?.present(), []);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} pressBehavior="close" />
    ),
    []
  );

  const snapPoints = useMemo(() => ['50%'], []);

  return (
    <SelectContext.Provider value={{ value, onValueChange, options, present }}>
      {children}
      <BottomSheetModal
        ref={modalRef}
        snapPoints={snapPoints}
        enablePanDownToClose
        // See Sheet.tsx's comment — 'push' so a Select opened from inside
        // another sheet (e.g. BucketProcessSheet) stacks instead of
        // minimizing the sheet it was opened from.
        stackBehavior="push"
        backdropComponent={renderBackdrop}
        backgroundStyle={{ borderRadius: 20, backgroundColor: isDark ? '#0b1120' : '#f8fafc' }}
        handleIndicatorStyle={{ width: 40, backgroundColor: isDark ? '#283549' : '#e2e8f0' }}
      >
        <BottomSheetFlatList
          data={options}
          keyExtractor={item => item.value}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: bottomPadding }}
          renderItem={({ item }) => {
            const selected = item.value === value;
            const Icon = item.icon;
            return (
              <Pressable
                onPress={() => {
                  onValueChange(item.value);
                  modalRef.current?.dismiss();
                }}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                className="flex-row items-center justify-between rounded-md px-2 py-3"
              >
                <View className="flex-row items-center gap-2">
                  {Icon && <Icon size={16} color={isDark ? '#94a3b8' : '#64748b'} />}
                  <Text className="text-sm text-foreground dark:text-foreground-dark">{item.label}</Text>
                </View>
                {selected && <Check size={16} color={isDark ? '#6366f1' : '#4f46e5'} />}
              </Pressable>
            );
          }}
        />
      </BottomSheetModal>
    </SelectContext.Provider>
  );
});

export function SelectTrigger({
  placeholder,
  className,
  disabled,
  renderValue,
}: {
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  // Overrides the default plain-text value display — e.g. a priority dot next
  // to the label. Receives the selected option (undefined when nothing is
  // picked yet) so the caller can fall back to the placeholder itself.
  renderValue?: (selected: SelectOption | undefined) => ReactNode;
}) {
  const { value, options, present } = useSelectContext();
  const scheme = useColorScheme();
  const selected = options.find(o => o.value === value);

  return (
    <Pressable
      onPress={present}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      className={cn(
        'h-9 flex-row items-center justify-between gap-2 rounded-md border border-input dark:border-input-dark bg-transparent px-3',
        disabled && 'opacity-50',
        className
      )}
    >
      {renderValue ? (
        renderValue(selected)
      ) : (
        <Text
          className={cn(
            'text-sm',
            selected
              ? 'text-foreground dark:text-foreground-dark'
              : 'text-muted-foreground dark:text-muted-foreground-dark'
          )}
        >
          {selected?.label ?? placeholder ?? ''}
        </Text>
      )}
      <ChevronDown size={16} color={scheme === 'dark' ? '#94a3b8' : '#64748b'} />
    </Pressable>
  );
}
