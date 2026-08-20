import { FileText } from 'lucide-react-native';
import { View } from 'react-native';

import { Textarea } from '@/components/ui/textarea';

import { FieldLabel } from './FieldLabel';

interface DescriptionFieldProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
  placeholder: string;
}

export function DescriptionField({ value, onChange, label, placeholder }: DescriptionFieldProps) {
  return (
    <View className="gap-1.5">
      <FieldLabel icon={FileText} label={label} optional />
      <Textarea value={value} onChangeText={onChange} placeholder={placeholder} className="min-h-24" />
    </View>
  );
}
