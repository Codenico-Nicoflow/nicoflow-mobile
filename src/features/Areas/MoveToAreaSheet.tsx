import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { Pressable, Text, useColorScheme, View } from 'react-native';

import { type IProject } from '@nicoflow/shared/types';
import { Check } from 'lucide-react-native';

import { Sheet, type SheetRef, SheetTitle } from '@/components/ui/sheet';
import { toast } from '@/components/ui/toast';
import { iconComponentFor } from '@/lib/constants/icons';
import { useGetAreasQuery, useUpdateProjectMutation } from '@/lib/store';

export interface MoveToAreaSheetRef {
  present: (project: IProject) => void;
  dismiss: () => void;
}

// Cross-area project move: mobile's drag-and-drop only reorders WITHIN one
// area's list (react-native-draggable-flatlist doesn't support cross-list
// drops), so moving a project to a different area is a long-press-menu
// action sheet instead of a drag gesture — matches web's underlying mutation
// (updateProject({areaId})), just a different trigger.
export const MoveToAreaSheet = forwardRef<MoveToAreaSheetRef, unknown>(function MoveToAreaSheet(_props, ref) {
  const isDark = useColorScheme() === 'dark';
  const sheetRef = useRef<SheetRef>(null);
  const [project, setProject] = useState<IProject | null>(null);
  const { data: areasData } = useGetAreasQuery();
  const [updateProject] = useUpdateProjectMutation();

  useImperativeHandle(ref, () => ({
    present: p => {
      setProject(p);
      sheetRef.current?.present();
    },
    dismiss: () => sheetRef.current?.dismiss(),
  }));

  const onSelectArea = async (areaId: string) => {
    if (!project || areaId === project.areaId) {
      sheetRef.current?.dismiss();
      return;
    }
    try {
      await updateProject({ id: project.id, areaId }).unwrap();
      sheetRef.current?.dismiss();
    } catch {
      toast.error('Could not move project');
    }
  };

  const areas = areasData?.items ?? [];

  return (
    <Sheet ref={sheetRef} snapPoints={['50%']}>
      <View className="px-4 pb-2">
        <SheetTitle>Move to Area</SheetTitle>
      </View>
      <View className="gap-0.5 px-2">
        {areas.map(area => {
          const Icon = iconComponentFor(area.icon);
          const isCurrent = area.id === project?.areaId;
          return (
            <Pressable
              key={area.id}
              onPress={() => void onSelectArea(area.id)}
              accessibilityRole="button"
              className="flex-row items-center gap-3 rounded-md px-2 py-3 active:bg-accent dark:active:bg-accent-dark"
            >
              <View
                className="size-8 items-center justify-center rounded-lg"
                style={{ backgroundColor: `${area.color}20` }}
              >
                <Icon size={16} color={area.color} />
              </View>
              <Text className="flex-1 text-sm text-foreground dark:text-foreground-dark" numberOfLines={1}>
                {area.name}
              </Text>
              {isCurrent && <Check size={16} color={isDark ? '#6366f1' : '#4f46e5'} />}
            </Pressable>
          );
        })}
      </View>
    </Sheet>
  );
});
