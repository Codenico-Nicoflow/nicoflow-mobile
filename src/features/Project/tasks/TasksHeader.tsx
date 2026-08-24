import { Text, View } from 'react-native';

import { Plus } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';

interface TasksHeaderProps {
  taskCount: number;
  onAddTask: () => void;
}

// Mirrors web's TasksHeader.tsx: "Tasks" title + count subtitle ("{{count}}
// task(s)" or "Manage your Tasks" at zero); "Add Task" button only shown once
// count > 0 (quick-add covers the zero-state).
export function TasksHeader({ taskCount, onAddTask }: TasksHeaderProps) {
  const { t } = useTranslation('task');

  return (
    <View className="mb-3 flex-row items-center justify-between gap-3">
      <View>
        <Text className="text-lg font-semibold text-foreground dark:text-foreground-dark">{t('header.title')}</Text>
        <Text className="text-sm text-muted-foreground dark:text-muted-foreground-dark">
          {taskCount > 0 ? t('header.taskCount', { count: taskCount }) : t('header.manageTasksHint')}
        </Text>
      </View>

      {taskCount > 0 && (
        <Button onPress={onAddTask} testID="task-add-button">
          <Plus size={16} color="#ffffff" />
          <Text className="text-sm font-medium text-primary-foreground">{t('header.addTask')}</Text>
        </Button>
      )}
    </View>
  );
}
