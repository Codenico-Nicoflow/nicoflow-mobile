import { Text, useColorScheme, View } from 'react-native';

import { AlertTriangle, Check, CloudOff, Loader2, type LucideIcon, Pencil } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { SaveStatus, type SaveStatusValue } from './types';

interface SaveStatusIndicatorProps {
  status: SaveStatusValue;
}

// Mirrors web's SaveStatusIndicator.tsx: hidden entirely at idle, exact copy
// per state. No spin animation on the "Saving…" icon here (RN's Loader2 has
// no CSS animate-spin equivalent without a dedicated Animated wrapper, and
// the label text alone already communicates the state).
export function SaveStatusIndicator({ status }: SaveStatusIndicatorProps) {
  const { t } = useTranslation('notes');
  const isDark = useColorScheme() === 'dark';

  if (status === SaveStatus.IDLE) return null;

  const { icon: Icon, label, tone } = presentation(status);
  const color = tone === 'destructive' ? (isDark ? '#f87171' : '#ef4444') : isDark ? '#94a3b8' : '#64748b';

  return (
    <View className="flex-row items-center gap-1.5" accessibilityLiveRegion="polite" testID="note-save-status">
      <Icon size={14} color={color} />
      <Text
        className={
          tone === 'destructive'
            ? 'text-xs text-destructive dark:text-destructive-dark'
            : 'text-xs text-muted-foreground dark:text-muted-foreground-dark'
        }
      >
        {t(label)}
      </Text>
    </View>
  );
}

function presentation(status: Exclude<SaveStatusValue, typeof SaveStatus.IDLE>): {
  icon: LucideIcon;
  label: 'save.unsaved' | 'save.saving' | 'save.saved' | 'save.error' | 'save.conflictTitle';
  tone: 'muted' | 'destructive';
} {
  switch (status) {
    case SaveStatus.SAVING:
      return { icon: Loader2, label: 'save.saving', tone: 'muted' };
    case SaveStatus.SAVED:
      return { icon: Check, label: 'save.saved', tone: 'muted' };
    case SaveStatus.CONFLICT:
      return { icon: AlertTriangle, label: 'save.conflictTitle', tone: 'destructive' };
    case SaveStatus.ERROR:
      return { icon: CloudOff, label: 'save.error', tone: 'destructive' };
    case SaveStatus.UNSAVED:
    default:
      return { icon: Pencil, label: 'save.unsaved', tone: 'muted' };
  }
}
