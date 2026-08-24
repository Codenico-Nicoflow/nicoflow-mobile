import { Text, View } from 'react-native';

import { useTranslation } from 'react-i18next';

import { Select, SelectTrigger } from '@/components/ui/select';

export type ProjectStatus = 'active' | 'completed' | 'archived';

interface ProjectStatusFieldProps {
  value: ProjectStatus;
  onChange: (value: ProjectStatus) => void;
}

// Edit-mode only, matching web — new projects always start 'active' server-side.
export function ProjectStatusField({ value, onChange }: ProjectStatusFieldProps) {
  const { t } = useTranslation('project');
  const options = [
    { label: t('project:status.active'), value: 'active' },
    { label: t('project:status.completed'), value: 'completed' },
    { label: t('project:status.archived'), value: 'archived' },
  ];

  return (
    <View className="gap-1.5">
      <Text className="text-sm font-semibold text-foreground dark:text-foreground-dark">
        {t('project:statusField.label')}
      </Text>
      <Select value={value} onValueChange={v => onChange(v as ProjectStatus)} options={options}>
        <SelectTrigger placeholder={t('project:statusField.placeholder')} />
      </Select>
    </View>
  );
}
