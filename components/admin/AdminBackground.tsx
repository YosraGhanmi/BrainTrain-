import {
  Brain,
  Sparkles,
  Rocket,
  GraduationCap,
  Lightbulb,
  Cpu,
  BookOpen,
  Trophy,
  Bot,
  Code2,
  Star,
  Puzzle,
} from 'lucide-react';

const ICONS = [
  { Icon: Brain, top: '8%', left: '6%', size: 56, delay: '0s', duration: '9s' },
  { Icon: Sparkles, top: '18%', left: '82%', size: 36, delay: '1.2s', duration: '7s' },
  { Icon: Rocket, top: '62%', left: '90%', size: 48, delay: '0.4s', duration: '10s' },
  { Icon: GraduationCap, top: '78%', left: '10%', size: 60, delay: '2s', duration: '8.5s' },
  { Icon: Lightbulb, top: '35%', left: '4%', size: 32, delay: '1.6s', duration: '7.5s' },
  { Icon: Cpu, top: '4%', left: '46%', size: 40, delay: '0.8s', duration: '9.5s' },
  { Icon: BookOpen, top: '88%', left: '55%', size: 40, delay: '2.4s', duration: '8s' },
  { Icon: Trophy, top: '50%', left: '48%', size: 44, delay: '1s', duration: '11s' },
  { Icon: Bot, top: '68%', left: '30%', size: 36, delay: '0.6s', duration: '9s' },
  { Icon: Code2, top: '12%', left: '65%', size: 32, delay: '1.8s', duration: '7s' },
  { Icon: Star, top: '30%', left: '92%', size: 24, delay: '2.6s', duration: '6.5s' },
  { Icon: Puzzle, top: '92%', left: '85%', size: 36, delay: '0.2s', duration: '10.5s' },
];

export default function AdminBackground() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      <div className="absolute -left-24 -top-24 h-96 w-96 rounded-full bg-white/15 blur-[120px]" />
      <div className="absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-accent2/15 blur-[120px]" />

      {ICONS.map(({ Icon, top, left, size, delay, duration }, i) => (
        <Icon
          key={i}
          style={{ top, left, width: size, height: size, animationDelay: delay, animationDuration: duration }}
          className="absolute animate-float text-white/70 drop-shadow-sm"
          strokeWidth={1.5}
        />
      ))}
    </div>
  );
}
