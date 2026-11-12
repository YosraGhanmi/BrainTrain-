// Drawings for the Palmarès awards section: a gold cup on a navy podium among
// building bricks, and the small laurel and brick that decorate the cards.
// Animated with the palmares-* keyframes in app/globals.css; all of it stops
// for visitors who prefer reduced motion.

type Shades = { front: string; top: string; side: string };

const NAVY: Shades = { front: '#16265e', top: '#33468f', side: '#0c1843' };
const NAVY_LOW: Shades = { front: '#1b2c6b', top: '#2c3d84', side: '#101c4a' };
const BLUE: Shades = { front: '#6a83f2', top: '#9cb0ff', side: '#4b62d4' };
const GOLD: Shades = { front: '#e0a91f', top: '#ffe08a', side: '#a8740a' };
const LILAC: Shades = { front: '#cdd6ff', top: '#e6ebff', side: '#b3c0fb' };

const noMotion = 'motion-reduce:[animation:none]';
const centred = { transformBox: 'fill-box', transformOrigin: 'center' } as const;

// A block seen slightly from above and to the right: front, top and side
// faces, with round studs on top when `studs` is set
function Block({ x, y, w, h, d, c, studs = 0 }: { x: number; y: number; w: number; h: number; d: number; c: Shades; studs?: number }) {
  const lift = d * 0.6;
  return (
    <g>
      <path d={`M${x + w} ${y} L${x + w + d} ${y - lift} L${x + w + d} ${y + h - lift} L${x + w} ${y + h} Z`} fill={c.side} />
      <path d={`M${x} ${y} L${x + d} ${y - lift} L${x + w + d} ${y - lift} L${x + w} ${y} Z`} fill={c.top} />
      <rect x={x} y={y} width={w} height={h} rx="3" fill={c.front} />
      {Array.from({ length: studs }, (_, i) => {
        const cx = x + d / 2 + ((i + 0.5) * w) / studs;
        const cy = y - lift / 2;
        const rx = Math.min(w / studs / 3, 11);
        return (
          <g key={i}>
            <rect x={cx - rx} y={cy - 7} width={rx * 2} height={7} fill={c.side} />
            <ellipse cx={cx} cy={cy} rx={rx} ry={rx * 0.42} fill={c.side} />
            <ellipse cx={cx} cy={cy - 7} rx={rx} ry={rx * 0.42} fill={c.top} />
          </g>
        );
      })}
    </g>
  );
}

// A five-pointed star centred on (cx, cy)
function star(cx: number, cy: number, r: number): string {
  return Array.from({ length: 10 }, (_, i) => {
    const radius = i % 2 === 0 ? r : r * 0.45;
    const angle = (Math.PI / 5) * i - Math.PI / 2;
    return `${i === 0 ? 'M' : 'L'}${(cx + radius * Math.cos(angle)).toFixed(1)} ${(cy + radius * Math.sin(angle)).toFixed(1)}`;
  }).join(' ') + ' Z';
}

// A four-pointed sparkle centred on (x, y)
function sparkle(x: number, y: number, s: number): string {
  return `M${x} ${y - s} Q${x} ${y} ${x + s} ${y} Q${x} ${y} ${x} ${y + s} Q${x} ${y} ${x - s} ${y} Q${x} ${y} ${x} ${y - s} Z`;
}

const SPARKLES = [
  { x: 92, y: 64, s: 15, delay: 0 },
  { x: 398, y: 46, s: 12, delay: 1.3 },
  { x: 62, y: 196, s: 10, delay: 2.2 },
  { x: 410, y: 214, s: 9, delay: 0.7 },
  { x: 360, y: 128, s: 7, delay: 1.8 },
];

// The orbit ring, split in two so the cup sits inside it: the far half is
// drawn behind the cup, the near half in front
const RING_BACK = 'M55 112 A175 44 0 0 1 405 112';
const RING_FRONT = 'M405 112 A175 44 0 0 1 55 112';

export function TrophyPodium({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 440 400" className={className} aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="aa-gold" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#a86b00" />
          <stop offset="0.25" stopColor="#f5c542" />
          <stop offset="0.45" stopColor="#fff1a8" />
          <stop offset="0.65" stopColor="#f2b928" />
          <stop offset="1" stopColor="#9a5f00" />
        </linearGradient>
        <linearGradient id="aa-gold-v" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffe58a" />
          <stop offset="1" stopColor="#c98a00" />
        </linearGradient>
        <linearGradient id="aa-ring" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#f5c542" stopOpacity="0.2" />
          <stop offset="0.5" stopColor="#ffd75e" />
          <stop offset="1" stopColor="#f5c542" stopOpacity="0.2" />
        </linearGradient>
        <radialGradient id="aa-glow">
          <stop offset="0" stopColor="#ffe58a" stopOpacity="0.55" />
          <stop offset="1" stopColor="#ffe58a" stopOpacity="0" />
        </radialGradient>
        <clipPath id="aa-bowl">
          <path d="M150 52 C152 122 190 150 230 152 C270 150 308 122 310 52 Z" />
        </clipPath>
      </defs>

      <ellipse cx="230" cy="110" rx="170" ry="120" fill="url(#aa-glow)" />

      {/* Podium and the bricks around it, back to front */}
      <Block x={30} y={318} w={360} h={52} d={36} c={NAVY_LOW} />
      <Block x={322} y={272} w={70} h={46} d={22} c={BLUE} studs={2} />
      <Block x={140} y={230} w={150} h={88} d={30} c={NAVY} />
      <path d={star(215, 276, 19)} fill="url(#aa-gold-v)" />
      <Block x={40} y={272} w={88} h={46} d={22} c={BLUE} studs={3} />

      <g transform="rotate(-9 230 112)">
        <path d={RING_BACK} fill="none" stroke="url(#aa-ring)" strokeWidth="4" />
      </g>

      {/* The cup, gently floating */}
      <g className={`animate-bob ${noMotion}`}>
        <Block x={200} y={202} w={60} h={16} d={10} c={GOLD} />
        <path d="M222 156 L238 156 C236 176 236 188 242 202 L218 202 C224 188 224 176 222 156 Z" fill="url(#aa-gold)" />
        <ellipse cx="230" cy="156" rx="20" ry="8" fill="url(#aa-gold)" />
        <g fill="none" strokeLinecap="round">
          <path d="M156 68 C116 62 110 108 152 122" stroke="#8a5300" strokeWidth="15" />
          <path d="M156 68 C116 62 110 108 152 122" stroke="url(#aa-gold-v)" strokeWidth="10" />
          <path d="M304 68 C344 62 350 108 308 122" stroke="#8a5300" strokeWidth="15" />
          <path d="M304 68 C344 62 350 108 308 122" stroke="url(#aa-gold-v)" strokeWidth="10" />
        </g>
        <path d="M150 52 C152 122 190 150 230 152 C270 150 308 122 310 52 Z" fill="url(#aa-gold)" />
        <path d="M170 64 C172 112 190 136 212 146 C196 124 186 98 188 64 Z" fill="#ffffff" opacity="0.45" />
        {/* Light passing across the cup */}
        <g clipPath="url(#aa-bowl)">
          <rect
            x="110"
            y="40"
            width="30"
            height="130"
            fill="#ffffff"
            opacity="0.5"
            className={`animate-[palmares-cup-shine_5s_ease-in-out_infinite] ${noMotion}`}
          />
        </g>
        <path d={star(232, 100, 24)} fill="#ffe58a" stroke="#c98a00" strokeWidth="2" strokeLinejoin="round" />
        <ellipse cx="230" cy="52" rx="81" ry="13" fill="url(#aa-gold-v)" />
        <ellipse cx="230" cy="52" rx="71" ry="8" fill="#a86b00" />
      </g>

      <g transform="rotate(-9 230 112)">
        <path d={RING_FRONT} fill="none" stroke="url(#aa-ring)" strokeWidth="4" />
        {/* A spark travelling round the ring */}
        <path
          d={`${RING_BACK} A175 44 0 0 1 55 112`}
          fill="none"
          stroke="#fff6cc"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray="26 725"
          className={`animate-[palmares-orbit_6s_linear_infinite] ${noMotion}`}
        />
      </g>

      {/* A brick tumbling in the foreground */}
      <g transform="rotate(-12 110 360)">
        <Block x={52} y={352} w={96} h={40} d={20} c={BLUE} studs={3} />
      </g>

      {SPARKLES.map((s) => (
        <path
          key={`${s.x}-${s.y}`}
          d={sparkle(s.x, s.y, s.s)}
          fill="#f5c542"
          className={`animate-[palmares-twinkle_3.4s_ease-in-out_infinite] ${noMotion}`}
          style={{ ...centred, animationDelay: `${s.delay}s` }}
        />
      ))}
    </svg>
  );
}

// A laurel branch for a card's top corner
export function Laurel({ className }: { className?: string }) {
  const leaves = [
    { x: 30, y: 74, r: -50 },
    { x: 22, y: 60, r: -30 },
    { x: 20, y: 44, r: -10 },
    { x: 24, y: 28, r: 10 },
    { x: 33, y: 14, r: 30 },
    { x: 42, y: 66, r: -110 },
    { x: 38, y: 50, r: -120 },
    { x: 38, y: 34, r: -140 },
  ];
  return (
    <svg viewBox="0 0 70 96" className={className} aria-hidden="true" focusable="false">
      <path d="M40 92 C24 70 20 40 36 6" fill="none" stroke="#e5c27a" strokeWidth="2.5" strokeLinecap="round" />
      {leaves.map((leaf) => (
        <ellipse key={`${leaf.x}-${leaf.y}`} cx={leaf.x} cy={leaf.y} rx="9" ry="4" fill="#ecd08f" transform={`rotate(${leaf.r} ${leaf.x} ${leaf.y})`} />
      ))}
    </svg>
  );
}

// A pale building brick for a card's bottom corner
export function BrickDecor({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 150 110" className={className} aria-hidden="true" focusable="false">
      <g transform="rotate(-8 75 60)">
        <Block x={14} y={52} w={96} h={42} d={28} c={LILAC} studs={2} />
      </g>
    </svg>
  );
}
