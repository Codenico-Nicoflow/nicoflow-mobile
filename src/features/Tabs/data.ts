import { CalendarDays, Inbox, LayoutGrid, type LucideIcon, MoreHorizontal, Sun } from 'lucide-react-native';

export interface MobileNavDestination {
  /** Stable id — matches the route file name under (tabs)/. */
  id: string;
  label: string;
  icon: LucideIcon;
}

// Mobile's own 5-tab set — deliberately not a reuse of web's NAV_DESTINATIONS
// (nicoflow-frontend/src/features/Rail/data.ts). Native tab bars have a hard
// ~5-item practical limit that web's rail doesn't, so this list is curated
// independently: Today/Inbox/Areas/Calendar cover the GTD core loop, and
// everything else (AI, Search, Settings, Notifications, Focus, Habits) lives
// behind More rather than competing for a tab slot.
export const MOBILE_NAV_DESTINATIONS: MobileNavDestination[] = [
  { id: 'today', label: 'Today', icon: Sun },
  { id: 'inbox', label: 'Inbox', icon: Inbox },
  { id: 'areas', label: 'Areas', icon: LayoutGrid },
  { id: 'calendar', label: 'Calendar', icon: CalendarDays },
  { id: 'more', label: 'More', icon: MoreHorizontal },
];
