import { useState } from 'react';
import { TextInput, useColorScheme, View } from 'react-native';

import { Plus } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { toast } from '@/components/ui/toast';
import { useCreateTaskMutation } from '@/lib/store';
import { getApiErrorCode } from '@/lib/utils/apiError';

interface TaskQuickAddProps {
  projectId: string;
}

// Mirrors web's TaskQuickAdd.tsx: one field, title-only create, Enter/submit
// to add. Plan-limit gets the on-brand nudge toast, not a generic error.
export function TaskQuickAdd({ projectId }: TaskQuickAddProps) {
  const { t } = useTranslation('task');
  const isDark = useColorScheme() === 'dark';
  const mutedColor = isDark ? '#94a3b8' : '#64748b';
  const [title, setTitle] = useState('');
  const [createTask, { isLoading }] = useCreateTaskMutation();

  const submit = async () => {
    const trimmed = title.trim();
    if (!trimmed || isLoading) return;
    try {
      await createTask({ projectId, title: trimmed }).unwrap();
      setTitle('');
    } catch (error) {
      if (getApiErrorCode(error) === 'PLAN_LIMIT_EXCEEDED') {
        toast.error(t('quickAdd.planLimit'));
        return;
      }
      toast.error(t('common:mutationError'));
    }
  };

  return (
    <View className="h-10 flex-row items-center gap-2 rounded-md border border-input dark:border-input-dark bg-transparent px-3">
      <Plus size={16} color={mutedColor} />
      <TextInput
        value={title}
        onChangeText={setTitle}
        onSubmitEditing={() => void submit()}
        placeholder={t('quickAdd.placeholder')}
        placeholderTextColor={mutedColor}
        accessibilityLabel={t('quickAdd.label')}
        testID="task-quick-add"
        editable={!isLoading}
        maxLength={255}
        returnKeyType="done"
        className="flex-1 text-sm text-foreground dark:text-foreground-dark"
      />
    </View>
  );
}
