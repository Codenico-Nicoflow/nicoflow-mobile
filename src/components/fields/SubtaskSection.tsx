import { useState } from 'react';
import { Pressable, Text, TextInput, useColorScheme, View } from 'react-native';

import { Plus, Trash2 } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { Checkbox } from '@/components/ui/checkbox';
import {
  useCreateSubtaskMutation,
  useDeleteSubtaskMutation,
  useGetSubtasksQuery,
  useUpdateSubtaskMutation,
} from '@/lib/store';

import { FieldLabel } from './FieldLabel';

interface SubtaskSectionProps {
  taskId: string;
}

// Mirrors web's SubtaskAccordion exactly: rows ordered by position, checkbox
// toggles done, per-row delete with no confirm (subtasks aren't destructive
// enough to warrant one, same as web), add input + button. Edit-mode only —
// a task must exist before it can have subtasks.
export function SubtaskSection({ taskId }: SubtaskSectionProps) {
  const { t } = useTranslation('task');
  const isDark = useColorScheme() === 'dark';
  const mutedColor = isDark ? '#94a3b8' : '#64748b';
  const { data: subtasks = [], isLoading } = useGetSubtasksQuery(taskId);
  const [createSubtask, { isLoading: isCreating }] = useCreateSubtaskMutation();
  const [updateSubtask] = useUpdateSubtaskMutation();
  const [deleteSubtask] = useDeleteSubtaskMutation();
  const [newTitle, setNewTitle] = useState('');

  const ordered = [...subtasks].sort((a, b) => a.position - b.position);

  const handleAdd = async () => {
    const title = newTitle.trim();
    if (!title) return;
    setNewTitle('');
    await createSubtask({ taskId, title }).unwrap();
  };

  return (
    <View className="gap-2">
      <FieldLabel label={t('subtasks.title')} optional />

      {!isLoading && ordered.length === 0 && (
        <Text className="text-sm text-muted-foreground dark:text-muted-foreground-dark">{t('subtasks.empty')}</Text>
      )}

      {ordered.map(subtask => (
        <View
          key={subtask.id}
          className="flex-row items-center gap-2 rounded-md border border-border dark:border-border-dark px-2 py-1.5"
        >
          <Checkbox
            checked={subtask.done}
            onCheckedChange={checked => void updateSubtask({ taskId, id: subtask.id, done: checked })}
          />
          <Text
            className={
              subtask.done
                ? 'flex-1 text-sm text-muted-foreground dark:text-muted-foreground-dark line-through'
                : 'flex-1 text-sm text-foreground dark:text-foreground-dark'
            }
          >
            {subtask.title}
          </Text>
          <Pressable
            onPress={() => void deleteSubtask({ taskId, id: subtask.id })}
            accessibilityRole="button"
            accessibilityLabel={t('subtasks.delete')}
            hitSlop={8}
          >
            <Trash2 size={16} color={mutedColor} />
          </Pressable>
        </View>
      ))}

      <View className="flex-row items-center gap-2">
        <TextInput
          value={newTitle}
          onChangeText={setNewTitle}
          onSubmitEditing={() => void handleAdd()}
          placeholder={t('subtasks.addPlaceholder')}
          placeholderTextColor={mutedColor}
          className="h-9 flex-1 rounded-md border border-input dark:border-input-dark bg-card dark:bg-card-dark px-3 text-sm text-foreground dark:text-foreground-dark"
        />
        <Pressable
          onPress={() => void handleAdd()}
          disabled={isCreating || !newTitle.trim()}
          accessibilityRole="button"
          className="h-9 flex-row items-center gap-1 rounded-md bg-secondary dark:bg-secondary-dark px-3"
          style={isCreating || !newTitle.trim() ? { opacity: 0.5 } : undefined}
        >
          <Plus size={14} color={isDark ? '#e2e8f0' : '#1e293b'} />
          <Text className="text-sm font-medium text-secondary-foreground dark:text-secondary-foreground-dark">
            {t('subtasks.add')}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
