import { Text, View } from 'react-native';

import { Select, SelectTrigger } from '@/components/ui/select';
import { useGetAreasQuery } from '@/lib/store';

interface AreaPickerProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
  placeholder: string;
  loadingPlaceholder: string;
  error?: string;
}

// Web's Area selector on the Project dialog. Reuses the same Select
// primitive as ProjectPicker (task dialog's project selector).
export function AreaPicker({ value, onChange, label, placeholder, loadingPlaceholder, error }: AreaPickerProps) {
  const { data: areasData, isLoading } = useGetAreasQuery();
  const areaOptions = (areasData?.items ?? []).map(a => ({ label: a.name, value: a.id }));

  return (
    <View className="gap-1.5">
      <Text className="text-sm font-semibold text-foreground dark:text-foreground-dark">{label}</Text>
      <Select value={value} onValueChange={onChange} options={areaOptions} disabled={isLoading}>
        <SelectTrigger placeholder={isLoading ? loadingPlaceholder : placeholder} disabled={isLoading} />
      </Select>
      {error && <Text className="text-xs text-destructive dark:text-destructive-dark">{error}</Text>}
    </View>
  );
}
