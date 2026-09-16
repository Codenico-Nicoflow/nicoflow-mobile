import { NotificationCategory } from '@nicoflow/shared/types';
import {
  Bell,
  CheckCircle2,
  FolderCheck,
  type LucideIcon,
  Megaphone,
  Sparkles,
  Sunrise,
  Trophy,
} from 'lucide-react-native';

// Glyph per notification type. Unknown types fall back to the bell so a type the
// backend adds later never renders blank.
const TYPE_ICON: Record<string, LucideIcon> = {
  morning_digest: Sunrise,
  evening_digest: Bell,
  task_completed: CheckCircle2,
  project_completed: FolderCheck,
  system_announcement: Megaphone,
  inbox_zero: Sparkles,
  streak_milestone: Trophy,
};

export const iconForType = (type: string): LucideIcon => TYPE_ICON[type] ?? Bell;

export interface CategoryStyle {
  iconBg: string;
  iconColor: (isDark: boolean) => string;
  accent: string;
}

// Same category treatment web uses (reminder=amber, celebration=emerald,
// summary=muted, system=primary). Icon colors are resolved as values rather than
// classes because lucide-react-native takes a `color` prop, not className.
const STYLES: Record<string, CategoryStyle> = {
  [NotificationCategory.REMINDER]: {
    iconBg: 'bg-amber-500/10',
    iconColor: isDark => (isDark ? '#fbbf24' : '#d97706'),
    accent: 'bg-amber-500',
  },
  [NotificationCategory.SUMMARY]: {
    iconBg: 'bg-muted dark:bg-muted-dark',
    iconColor: isDark => (isDark ? '#94a3b8' : '#64748b'),
    accent: 'bg-primary dark:bg-primary-dark',
  },
  [NotificationCategory.CELEBRATION]: {
    iconBg: 'bg-emerald-500/10',
    iconColor: isDark => (isDark ? '#34d399' : '#059669'),
    accent: 'bg-emerald-500',
  },
  [NotificationCategory.SYSTEM]: {
    iconBg: 'bg-primary/10',
    iconColor: isDark => (isDark ? '#818cf8' : '#4f46e5'),
    accent: 'bg-primary dark:bg-primary-dark',
  },
};

// An unrecognised category resolves to system, matching categoryForType's own
// fallback — forward-compatible with categories added server-side.
export const styleForCategory = (category: string): CategoryStyle =>
  STYLES[category] ?? STYLES[NotificationCategory.SYSTEM];
