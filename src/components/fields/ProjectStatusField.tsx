import { View } from 'react-native';

import { Archive, CheckCircle, Clock } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { Select, SelectTrigger } from '@/components/ui/select';

import { FieldLabel } from './FieldLabel';

export type ProjectStatus = 'active' | 'completed' | 'archived';

interface ProjectStatusFieldProps {
  value: ProjectStatus;
  onChange: (value: ProjectStatus) => void;
}

// Edit-mode only, matching web — new projects always start 'active' server-side.
// Field label + per-option icons mirror web's ProjectStatusField exactly
// (CheckCircle label glyph, Clock/CheckCircle/Archive per status).
export function ProjectStatusField({ value, onChange }: ProjectStatusFieldProps) {
  const { t } = useTranslation('project');
  const options = [
    { label: t('project:status.active'), value: 'active', icon: Clock },
    { label: t('project:status.completed'), value: 'completed', icon: CheckCircle },
    { label: t('project:status.archived'), value: 'archived', icon: Archive },
  ];

  return (
    <View className="gap-1.5">
      <FieldLabel icon={CheckCircle} label={t('project:statusField.label')} />
      <Select value={value} onValueChange={v => onChange(v as ProjectStatus)} options={options}>
        <SelectTrigger placeholder={t('project:statusField.placeholder')} />
      </Select>
    </View>
  );
}
