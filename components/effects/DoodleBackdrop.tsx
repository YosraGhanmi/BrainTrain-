import {
  X,
  Pin,
  CheckCircle2,
  TreePine,
  Ghost,
  Circle,
  Mic,
  Leaf,
  MoonStar,
  Dices,
  Scissors,
  Droplet,
  Sparkles,
  Star,
  Heart,
  Feather,
  Puzzle,
  type LucideIcon,
} from 'lucide-react';

const decorativeIcons: { icon: LucideIcon; top: string; left: string; size: number; rotate: number }[] = [
  { icon: X, top: '6%', left: '8%', size: 28, rotate: -8 },
  { icon: Pin, top: '4%', left: '22%', size: 34, rotate: 6 },
  { icon: CheckCircle2, top: '8%', left: '42%', size: 30, rotate: 0 },
  { icon: TreePine, top: '10%', left: '62%', size: 32, rotate: 10 },
  { icon: Circle, top: '18%', left: '52%', size: 14, rotate: 0 },
  { icon: Ghost, top: '12%', left: '90%', size: 32, rotate: -6 },

  { icon: Mic, top: '26%', left: '18%', size: 28, rotate: -4 },
  { icon: Heart, top: '52%', left: '15%', size: 20, rotate: 10 },
  { icon: Dices, top: '72%', left: '20%', size: 30, rotate: -8 },

  { icon: Feather, top: '20%', left: '4%', size: 24, rotate: 10 },
  { icon: Puzzle, top: '44%', left: '6%', size: 26, rotate: -6 },
  { icon: Circle, top: '64%', left: '2%', size: 14, rotate: 0 },
  { icon: TreePine, top: '88%', left: '5%', size: 26, rotate: -10 },

  { icon: MoonStar, top: '24%', left: '81%', size: 28, rotate: -10 },
  { icon: Sparkles, top: '48%', left: '78%', size: 24, rotate: 12 },
  { icon: Star, top: '74%', left: '80%', size: 20, rotate: -8 },

  { icon: Scissors, top: '18%', left: '95%', size: 24, rotate: 8 },
  { icon: Droplet, top: '38%', left: '97%', size: 20, rotate: -12 },
  { icon: X, top: '60%', left: '94%', size: 22, rotate: 6 },
  { icon: Leaf, top: '84%', left: '96%', size: 24, rotate: 10 },
];

// Faint navy doodles scattered behind the programmes and method sections. Sits absolutely
// inside a `relative overflow-hidden` section, behind its content.
export default function DoodleBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0">
      {decorativeIcons.map(({ icon: Icon, top, left, size, rotate }, i) => (
        <Icon
          key={i}
          className="absolute text-[#0b1a3a] opacity-[0.08]"
          style={{
            top,
            left,
            width: size,
            height: size,
            transform: `rotate(${rotate}deg)`,
          }}
          strokeWidth={2}
        />
      ))}
    </div>
  );
}
