// Mirrors web's calloutIconComponents.ts — same lucide set, native import path.
import {
  AlertTriangle,
  CheckCircle2,
  Flag,
  HelpCircle,
  Info,
  Lightbulb,
  type LucideIcon,
  Star,
  StickyNote,
} from 'lucide-react-native';

import type { NoteCalloutIcon } from './calloutIcons';

export const CALLOUT_ICON_COMPONENTS: Record<NoteCalloutIcon, LucideIcon> = {
  info: Info,
  warning: AlertTriangle,
  success: CheckCircle2,
  idea: Lightbulb,
  star: Star,
  note: StickyNote,
  flag: Flag,
  question: HelpCircle,
};
