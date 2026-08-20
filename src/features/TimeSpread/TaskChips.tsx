import { type ITask } from '@nicoflow/shared/types';
import { AlarmClock, Clock, ExternalLink, Repeat } from 'lucide-react-native';
import { Linking, Pressable, useColorScheme, View } from 'react-native';

import { Badge } from '@/components/ui/badge';
import { getEnergyOption } from '@/lib/constants/energy';
import { PRIORITY_CHIP_CLASS, PRIORITY_TEXT_CLASS, priorityLabel } from '@/lib/constants/priority';

import { formatDuration, formatTaskGentleDate, gentleDateLabel } from './taskDisplay';

// Mirrors web's TaskBadges (nicoflow-frontend/src/features/Tasks/components/TaskBadges.tsx)
// field-for-field: energy, estimated minutes, time of day, gentle date, priority, repeat, link.
export function TaskChips({ task }: { task: ITask }) {
  const isDark = useColorScheme() === 'dark';
  const mutedColor = isDark ? '#94a3b8' : '#64748b';
  const energy = getEnergyOption(task.energy);
  const EnergyIcon = energy.icon;
  const gentleDate = formatTaskGentleDate(task);

  return (
    <View className="flex-row flex-wrap items-center gap-1.5">
      <Badge variant="secondary" icon={<EnergyIcon size={12} color={isDark ? energy.darkColor : energy.color} />}>
        {energy.label}
      </Badge>

      {!!task.estimatedMinutes && (
        <Badge variant="secondary" icon={<Clock size={12} color={mutedColor} />}>
          {formatDuration(task.estimatedMinutes)}
        </Badge>
      )}

      {!!task.scheduledTime && (
        <Badge variant="outline" icon={<AlarmClock size={12} color={mutedColor} />}>
          {task.scheduledTime}
        </Badge>
      )}

      {gentleDate && (
        <Badge variant="outline" icon={<Clock size={12} color={mutedColor} />}>
          {gentleDateLabel(gentleDate)}
        </Badge>
      )}

      {!!task.priority && (
        <Badge
          variant="outline"
          className={PRIORITY_CHIP_CLASS[task.priority]}
          textClassName={PRIORITY_TEXT_CLASS[task.priority]}>
          {priorityLabel(task.priority)}
        </Badge>
      )}

      {!!task.recurrenceRuleId && (
        <Badge variant="outline" icon={<Repeat size={12} color={mutedColor} />}>
          Repeats
        </Badge>
      )}

      {!!task.url && (
        <Pressable onPress={() => void Linking.openURL(task.url as string)} accessibilityRole="link">
          <Badge variant="outline" icon={<ExternalLink size={12} color={mutedColor} />}>
            Link
          </Badge>
        </Pressable>
      )}
    </View>
  );
}
