import { Pressable, Text, View } from 'react-native';

import type { ITask } from '@nicoflow/shared/types';
import { ChevronRight } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { Radius, Shadows } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface CalendarDayTaskCardProps {
  task: ITask;
  dayKey: string;
  locale: string;
  pending: boolean;
  onOpenTask: (taskId: string) => void;
}

export function CalendarDayTaskCard({ task, dayKey, locale, pending, onOpenTask }: CalendarDayTaskCardProps) {
  const { t } = useTranslation('common');
  const colors = useTheme();
  const scheduledFor = task.scheduledFor ?? dayKey;
  const dateLabel = new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric', year: 'numeric' }).format(
    new Date(`${scheduledFor}T12:00:00`)
  );
  const timeLabel = task.scheduledTime ?? t('pages.calendar.allDay');
  const durationLabel = task.estimatedMinutes == null
    ? t('pages.calendar.noDuration')
    : t('pages.calendar.durationMinutesValue', { count: task.estimatedMinutes });

  return (
    <View
      className="rounded-lg border border-border dark:border-border-dark bg-card dark:bg-card-dark"
      style={[{ borderRadius: Radius.lg }, Shadows.sm]}
      testID={`calendar-day-task-${task.id}`}
    >
      <Pressable
        onPress={() => onOpenTask(task.id)}
        accessibilityRole="button"
        accessibilityLabel={t('pages.calendar.openTask', { title: task.title })}
        accessibilityState={{ busy: pending }}
        className="min-h-16 flex-row items-center gap-3 px-3 py-3"
      >
        <View className="flex-1 gap-1">
          <Text className="text-sm font-semibold text-foreground dark:text-foreground-dark">{task.title}</Text>
          <Text className="text-xs text-muted-foreground dark:text-muted-foreground-dark">
            {t('pages.calendar.scheduledOn', { date: dateLabel })}
          </Text>
          <Text className="text-xs text-muted-foreground dark:text-muted-foreground-dark">
            {timeLabel} · {durationLabel}
          </Text>
          {pending ? (
            <Text className="text-xs text-muted-foreground dark:text-muted-foreground-dark" accessibilityLiveRegion="polite">
              {t('pages.calendar.saving')}
            </Text>
          ) : null}
        </View>
        <ChevronRight size={18} color={colors.textSecondary} accessibilityElementsHidden />
      </Pressable>
    </View>
  );
}
