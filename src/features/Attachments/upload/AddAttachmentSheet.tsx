import { forwardRef, useImperativeHandle, useRef } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Camera, FileUp, ImageIcon, type LucideIcon } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { Sheet, type SheetRef } from '@/components/ui/sheet';
import { toast } from '@/components/ui/toast';
import { Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { pickDocument, pickFromCamera, pickFromLibrary, type PickResult } from './pickers';
import type { PickedFile } from './validate';

export type AddAttachmentSheetRef = SheetRef;

interface AddAttachmentSheetProps {
  onPicked: (file: PickedFile) => void;
}

const SOURCES: { id: string; icon: LucideIcon; labelKey: string; pick: () => Promise<PickResult> }[] = [
  { id: 'camera', icon: Camera, labelKey: 'attachments.sourceCamera', pick: pickFromCamera },
  { id: 'library', icon: ImageIcon, labelKey: 'attachments.sourceLibrary', pick: pickFromLibrary },
  { id: 'file', icon: FileUp, labelKey: 'attachments.sourceFile', pick: pickDocument },
];

// The "Add attachment" source picker. Built on the app's own Sheet rather than
// ActionSheetIOS / a native Android dialog, so it carries the same surface,
// radius and typography as every other sheet in the app.
//
// A denied permission disables nothing: the sheet stays open and the other two
// sources still work, since only one of them needed that permission.
export const AddAttachmentSheet = forwardRef<AddAttachmentSheetRef, AddAttachmentSheetProps>(
  function AddAttachmentSheet({ onPicked }, ref) {
    const { t } = useTranslation('task');
    const colors = useTheme();
    const sheetRef = useRef<SheetRef>(null);

    useImperativeHandle(ref, () => ({
      present: () => sheetRef.current?.present(),
      dismiss: () => sheetRef.current?.dismiss(),
    }));

    const handlePick = async (pick: () => Promise<PickResult>) => {
      const result = await pick();

      if (result.status === 'picked') {
        sheetRef.current?.dismiss();
        onPicked(result.file);
        return;
      }
      if (result.status === 'denied') {
        toast.error(t('attachments.permissionDenied'));
        return;
      }
      if (result.status === 'failed') {
        toast.error(t('attachments.uploadFailed', { name: t('attachments.addButton') }));
      }
      // cancelled → nothing to say; the user chose to back out.
    };

    return (
      <Sheet ref={sheetRef} snapPoints={['35%']}>
        <View className="gap-2 px-4 pb-4" testID="add-attachment-sheet">
          <Text className="mb-1 text-sm font-semibold text-foreground dark:text-foreground-dark">
            {t('attachments.addButton')}
          </Text>

          {SOURCES.map(source => (
            <Pressable
              key={source.id}
              onPress={() => void handlePick(source.pick)}
              accessibilityRole="button"
              testID={`attachment-source-${source.id}`}
              className="flex-row items-center gap-3 border border-border dark:border-border-dark bg-card dark:bg-card-dark px-3 py-3 active:bg-accent dark:active:bg-accent-dark"
              style={{ borderRadius: Radius.lg }}
            >
              <source.icon size={18} color={colors.primary} />
              <Text className="text-sm text-foreground dark:text-foreground-dark">{t(source.labelKey)}</Text>
            </Pressable>
          ))}

          <Text className="mt-1 text-xs text-muted-foreground dark:text-muted-foreground-dark">
            {t('attachments.hint')}
          </Text>
        </View>
      </Sheet>
    );
  }
);
