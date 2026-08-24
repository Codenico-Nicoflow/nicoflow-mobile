import { Text, View } from 'react-native';

import { useTranslation } from 'react-i18next';

import { Select, SelectTrigger } from '@/components/ui/select';
import { useGetProjectsQuery } from '@/lib/store';

interface ProjectPickerProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

// Single source of truth for the project <Select> — was duplicated verbatim
// in TaskCreateSheet and BucketProcessSheet before TaskSheet unified them.
export function ProjectPicker({ value, onChange, error }: ProjectPickerProps) {
  const { t } = useTranslation('task');
  const { data: projectsData } = useGetProjectsQuery();
  const projectOptions = (projectsData?.items ?? []).map(p => ({ label: p.name, value: p.id }));

  return (
    <View className="gap-1.5">
      <Text className="text-sm font-semibold text-foreground dark:text-foreground-dark">
        {t('dialog.projectLabel')}
      </Text>
      <Select value={value} onValueChange={onChange} options={projectOptions}>
        <SelectTrigger placeholder={t('dialog.projectPlaceholder')} />
      </Select>
      {error && <Text className="text-xs text-destructive dark:text-destructive-dark">{error}</Text>}
    </View>
  );
}
