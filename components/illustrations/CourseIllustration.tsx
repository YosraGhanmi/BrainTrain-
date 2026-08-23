import { Bot, Code2, Rocket as RocketIcon, Smile, CircuitBoard, Printer, Terminal as TerminalIcon, type LucideIcon } from 'lucide-react';

const LINE = 'rgba(20,23,31,0.35)';

function Robot({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 200 200" className="h-full w-full">
      <rect x="60" y="20" width="12" height="18" fill={LINE} />
      <circle cx="66" cy="16" r="7" fill="#ff8fa3" />
      <rect x="35" y="38" width="90" height="60" rx="18" fill={color} />
      <circle cx="60" cy="66" r="9" fill="#fff" />
      <circle cx="100" cy="66" r="9" fill="#fff" />
      <circle cx="60" cy="66" r="3.5" fill={LINE} />
      <circle cx="100" cy="66" r="3.5" fill={LINE} />
      <rect x="65" y="82" width="30" height="6" rx="3" fill="#fff" opacity="0.5" />
      <rect x="18" y="105" width="24" height="55" rx="12" fill={color} opacity="0.85" />
      <rect x="118" y="105" width="24" height="55" rx="12" fill={color} opacity="0.85" />
      <rect x="48" y="100" width="64" height="70" rx="16" fill="#fff" />
      <rect x="62" y="118" width="16" height="16" rx="5" fill={color} opacity="0.35" />
      <rect x="82" y="118" width="16" height="16" rx="5" fill={color} opacity="0.35" />
      <rect x="62" y="140" width="36" height="8" rx="4" fill={color} opacity="0.3" />
      <rect x="55" y="168" width="18" height="20" rx="8" fill={color} opacity="0.85" />
      <rect x="87" y="168" width="18" height="20" rx="8" fill={color} opacity="0.85" />
    </svg>
  );
}

function Laptop({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 200 200" className="h-full w-full">
      <rect x="50" y="35" width="100" height="72" rx="10" fill="#2b3350" />
      <rect x="60" y="45" width="80" height="52" rx="6" fill="#fff" />
      <path d="M76 58 L64 71 L76 84" fill="none" stroke={color} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M124 58 L136 71 L124 84" fill="none" stroke={color} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M107 52 L93 90" stroke={color} strokeWidth="5" strokeLinecap="round" opacity="0.6" />
      <path d="M28 120 L172 120 L156 150 L44 150 Z" fill={color} strokeLinejoin="round" opacity="0.9" />
      <rect x="82" y="120" width="36" height="6" fill="#fff" opacity="0.7" />
    </svg>
  );
}

function Rocket({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 200 200" className="h-full w-full">
      <path
        d="M100 20c22 18 32 48 32 78 0 14-4 28-10 40h-44c-6-12-10-26-10-40 0-30 10-60 32-78z"
        fill="#fff"
      />
      <path d="M62 108c-18 4-30 20-32 44 20-4 34-16 40-32z" fill={color} strokeLinejoin="round" />
      <path d="M138 108c18 4 30 20 32 44-20-4-34-16-40-32z" fill={color} strokeLinejoin="round" />
      <circle cx="100" cy="80" r="16" fill={color} opacity="0.85" />
      <circle cx="100" cy="80" r="6" fill="#fff" />
      <path d="M84 138h32l-10 24c-3 8-9 8-12 0z" fill="#ffb020" strokeLinejoin="round" />
      <path d="M90 138h20l-6 40c-2 6-6 6-8 0z" fill="#ff5a5f" strokeLinejoin="round" />
    </svg>
  );
}

function Emotion({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 200 200" className="h-full w-full">
      <circle cx="100" cy="100" r="66" fill={color} />
      <circle cx="76" cy="88" r="7" fill={LINE} />
      <circle cx="124" cy="88" r="7" fill={LINE} />
      <path d="M70 118c8 16 24 26 30 26s22-10 30-26" fill="none" stroke={LINE} strokeWidth="6" strokeLinecap="round" />
      <ellipse cx="62" cy="112" rx="10" ry="7" fill="#ff8fa3" opacity="0.6" />
      <ellipse cx="138" cy="112" rx="10" ry="7" fill="#ff8fa3" opacity="0.6" />
    </svg>
  );
}

function Circuit({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 200 200" className="h-full w-full">
      <rect x="30" y="30" width="140" height="140" rx="18" fill={color} />
      <path
        d="M50 70h30v-20h40M120 50v30h30M50 130h20v20h40v-20h20"
        fill="none"
        stroke="#fff"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.85"
      />
      <rect x="85" y="85" width="30" height="30" rx="8" fill="#fff" />
      <circle cx="50" cy="70" r="5" fill="#fff" />
      <circle cx="150" cy="80" r="5" fill="#fff" />
      <circle cx="50" cy="150" r="5" fill="#fff" />
      <circle cx="130" cy="150" r="5" fill="#fff" />
    </svg>
  );
}

function Printer3D({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 200 200" className="h-full w-full">
      <rect x="24" y="30" width="152" height="140" rx="14" fill="#3a4257" />
      <rect x="40" y="46" width="120" height="108" rx="8" fill="#eef2fa" />
      <rect x="40" y="46" width="34" height="108" fill="#d7e0f0" opacity="0.7" />
      <rect x="52" y="52" width="96" height="10" rx="5" fill="#232838" />
      <rect x="90" y="52" width="20" height="90" fill="#aab3c4" opacity="0.6" />
      <path
        d="M92 120c6-10 20-10 26 0 4 6 2 14-6 16h-16c-8-2-8-10-4-16z"
        fill={color}
        strokeLinejoin="round"
      />
      <text x="150" y="182" textAnchor="end" fontSize="20" fontWeight="700" fill={LINE}>
        3D
      </text>
    </svg>
  );
}

function Terminal({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 200 200" className="h-full w-full">
      <rect x="30" y="45" width="140" height="100" rx="14" fill="#2b3350" />
      <circle cx="46" cy="58" r="4" fill="#ff5f57" />
      <circle cx="58" cy="58" r="4" fill="#febc2e" />
      <circle cx="70" cy="58" r="4" fill="#28c840" />
      <path d="M48 82l18 16-18 16" fill="none" stroke={color} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="78" y="108" width="40" height="7" rx="3.5" fill={color} />
    </svg>
  );
}

// Matched by component reference — `icon` is whatever getIcon() resolved a
// course's stored icon name to, so these are the exact same lucide imports
// the registry in lib/content/icons.ts hands back.
const ILLUSTRATIONS = new Map<LucideIcon, (props: { color: string }) => JSX.Element>([
  [Bot, Robot],
  [Code2, Laptop],
  [RocketIcon, Rocket],
  [Smile, Emotion],
  [CircuitBoard, Circuit],
  [Printer, Printer3D],
  [TerminalIcon, Terminal],
]);

export default function CourseIllustration({
  icon: Icon,
  color,
  className = '',
}: {
  icon: LucideIcon;
  color: string;
  className?: string;
}) {
  const Illustration = ILLUSTRATIONS.get(Icon);

  return (
    <div
      className={`relative flex items-center justify-center ${className}`}
      style={{ background: `radial-gradient(60% 60% at 50% 45%, ${color}1f 0%, transparent 75%)` }}
    >
      {Illustration ? (
        <div className="h-4/5 w-4/5 drop-shadow-[0_10px_16px_rgba(15,23,42,0.12)]">
          <Illustration color={color} />
        </div>
      ) : (
        <Icon className="h-14 w-14" style={{ color }} strokeWidth={1.5} />
      )}
    </div>
  );
}
