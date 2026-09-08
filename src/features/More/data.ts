import { type Href } from 'expo-router';

import { Bell, type LucideIcon, Search, Settings, Sparkles } from 'lucide-react-native';

export interface MoreDestination {
  /** Stable id — doubles as the testID suffix. */
  id: string;
  /** Route to push. Each is its own stack screen, not a nested tab. */
  href: Href;
  /** i18n key, resolved against the namespaces MoreList loads. */
  labelKey: string;
  icon: LucideIcon;
}

// The four sections E-034's 5-tab design pushed out of the tab bar
// (MOBILE_NAV_DESTINATIONS in features/Tabs/data.ts). Icons match web's
// choices per section so the two clients read the same at a glance.
//
// Search has no nav:* key — web renders it as a command-palette trigger, not
// a nav destination — so it borrows common:search.hintTitle ("Search
// everything"), which is already translated in all three locales. Move it to
// nav:search if @nicoflow/shared ever gains one.
export const MORE_DESTINATIONS: MoreDestination[] = [
  { id: 'ai', href: '/ai', labelKey: 'nav:ai', icon: Sparkles },
  { id: 'search', href: '/search', labelKey: 'common:search.hintTitle', icon: Search },
  { id: 'settings', href: '/settings', labelKey: 'nav:settings', icon: Settings },
  { id: 'notifications', href: '/notifications', labelKey: 'nav:notifications', icon: Bell },
];
