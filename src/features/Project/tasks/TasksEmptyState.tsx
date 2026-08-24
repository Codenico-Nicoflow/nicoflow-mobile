import { CheckSquare } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';

interface TasksEmptyStateProps {
  onAddTask: () => void;
}

// Mirrors web's TasksEmptyState.tsx copy exactly.
export function TasksEmptyState({ onAddTask }: TasksEmptyStateProps) {
  const { t } = useTranslation('task');

  return (
    <EmptyState
      icon={CheckSquare}
      title={t('empty.title')}
      description={t('empty.description')}
      action={<Button label={t('empty.createFirstTask')} onPress={onAddTask} />}
      testID="tasks-empty-state"
    />
  );
}
