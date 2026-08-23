import {
  Bot,
  Code2,
  Rocket,
  Smile,
  CircuitBoard,
  Printer,
  Terminal,
  Baby,
  Puzzle,
  Cpu,
  GraduationCap,
  BookOpen,
  type LucideIcon,
} from 'lucide-react';

// Name <-> component registry. Content is stored as a plain string (JSON has
// no room for component references), so every icon a course or age group can
// use has to be listed here — the admin UI picks from these same names.
export const ICONS: Record<string, LucideIcon> = {
  Bot,
  Code2,
  Rocket,
  Smile,
  CircuitBoard,
  Printer,
  Terminal,
  Baby,
  Puzzle,
  Cpu,
  GraduationCap,
};

export const ICON_NAMES = Object.keys(ICONS);

export function getIcon(name: string): LucideIcon {
  return ICONS[name] ?? BookOpen;
}
