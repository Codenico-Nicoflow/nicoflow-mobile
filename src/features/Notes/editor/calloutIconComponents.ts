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

// Matches web's calloutIconComponents.ts exactly — the native icon picker
// (NoteToolbar/NoteEditor) renders these Lucide components, not emoji. The
// webview's own internal glyph rendering (editorHtml.ts, drawing the actual
// note content inside the bundled HTML shell) is a separate, legitimate
// case: Lucide React components can't run inside that isolated DOM, so it
// keeps its own emoji copy — untouched by this file.
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
