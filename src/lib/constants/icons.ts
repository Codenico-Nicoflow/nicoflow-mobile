import { ICON_IDS, type IconId } from '@nicoflow/shared/types';
import {
  Book,
  Briefcase,
  Calendar,
  Camera,
  ChartArea,
  Clipboard,
  Code,
  Cpu,
  DollarSign,
  Film,
  Flag,
  Folder,
  Gift,
  Globe,
  Heart,
  HeartPulse,
  Leaf,
  Lightbulb,
  type LucideIcon,
  Map,
  Music,
  Palette,
  PawPrint,
  Plane,
  Rocket,
  Shield,
  ShoppingCart,
  Star,
  ToolCase,
  Trophy,
  User,
} from 'lucide-react-native';

// Same 30-id set as web's icon picker (Area/Project). Two ids intentionally
// map to a differently-named lucide icon on each platform — web's 'chat' uses
// ChartArea and 'tools' uses ToolCase (a naming mismatch in web's own
// get-icons.ts) — mirrored here by semantic label, not literal icon name, so
// both platforms render the same picture despite the odd underlying names.
export const ICON_COMPONENT_MAP: Record<IconId, LucideIcon> = {
  folder: Folder,
  briefcase: Briefcase,
  user: User,
  heart: Heart,
  'dollar-sign': DollarSign,
  book: Book,
  lightbulb: Lightbulb,
  rocket: Rocket,
  palette: Palette,
  music: Music,
  camera: Camera,
  film: Film,
  gift: Gift,
  calendar: Calendar,
  'shopping-cart': ShoppingCart,
  map: Map,
  plane: Plane,
  tools: ToolCase,
  code: Code,
  cpu: Cpu,
  shield: Shield,
  trophy: Trophy,
  chat: ChartArea,
  clipboard: Clipboard,
  flag: Flag,
  star: Star,
  leaf: Leaf,
  paw: PawPrint,
  'heart-pulse': HeartPulse,
  globe: Globe,
};

export { ICON_IDS };
export type { IconId };

export const iconComponentFor = (icon: string | undefined | null): LucideIcon =>
  ICON_COMPONENT_MAP[(icon as IconId) ?? 'folder'] ?? Folder;
