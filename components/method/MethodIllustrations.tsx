import { useId, type ReactElement } from 'react';

// Hand-drawn 3D-style illustrations for the four "Notre méthode" cards, in
// the order of the default steps: a magnifying glass (inquiry), a laptop with
// code (projects), stacked toy bricks (progression) and a trophy
// (assessment). Each is a 120×120 SVG; gradient ids go through useId so two
// copies on a page never clash.

type Props = { className?: string };

// A soft shadow on the "floor" under each illustration
function FloorShadow({ id, cx = 60, cy = 110, rx = 36 }: { id: string; cx?: number; cy?: number; rx?: number }) {
  return (
    <>
      <radialGradient id={id}>
        <stop offset="0" stopColor="#0b1a3a" stopOpacity="0.22" />
        <stop offset="1" stopColor="#0b1a3a" stopOpacity="0" />
      </radialGradient>
      <ellipse cx={cx} cy={cy} rx={rx} ry="6" fill={`url(#${id})`} />
    </>
  );
}

export function MagnifierIllustration({ className }: Props) {
  const id = useId();
  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={`${id}ring`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#6fa2ff" />
          <stop offset="1" stopColor="#1f56d6" />
        </linearGradient>
        <radialGradient id={`${id}lens`} cx="0.35" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#eef6ff" />
          <stop offset="0.45" stopColor="#a9d0ff" />
          <stop offset="1" stopColor="#4f8ff7" />
        </radialGradient>
        <linearGradient id={`${id}handle`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#2c4fc4" />
          <stop offset="1" stopColor="#14296e" />
        </linearGradient>
      </defs>
      <FloorShadow id={`${id}floor`} />
      <line x1="76" y1="76" x2="100" y2="100" stroke={`url(#${id}handle)`} strokeWidth="15" strokeLinecap="round" />
      <line x1="70" y1="70" x2="78" y2="78" stroke="#3d7fff" strokeWidth="17" strokeLinecap="round" />
      <circle cx="50" cy="50" r="33" fill={`url(#${id}ring)`} />
      <circle cx="50" cy="50" r="25" fill={`url(#${id}lens)`} />
      <ellipse cx="40" cy="38" rx="10" ry="5" fill="#fff" opacity="0.85" transform="rotate(-38 40 38)" />
      <circle cx="56" cy="33" r="2.6" fill="#fff" opacity="0.8" />
      <path d="M26 58a26 26 0 0 0 32 17" fill="none" stroke="#fff" strokeOpacity="0.35" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function LaptopIllustration({ className }: Props) {
  const id = useId();
  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={`${id}lid`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#8a9cff" />
          <stop offset="1" stopColor="#4553d6" />
        </linearGradient>
        <linearGradient id={`${id}screen`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#9db0ff" />
          <stop offset="1" stopColor="#5d6ef0" />
        </linearGradient>
        <linearGradient id={`${id}base`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#d9ddff" />
          <stop offset="1" stopColor="#9aa4f0" />
        </linearGradient>
      </defs>
      <FloorShadow id={`${id}floor`} cy={99} rx={44} />
      {/* Lid and screen */}
      <rect x="22" y="20" width="76" height="56" rx="8" fill={`url(#${id}lid)`} />
      <rect x="28" y="26" width="64" height="44" rx="4" fill={`url(#${id}screen)`} />
      <path d="M28 30a4 4 0 0 1 4-4h34L40 70h-8a4 4 0 0 1-4-4z" fill="#fff" opacity="0.14" />
      {/* </> */}
      <g fill="none" stroke="#fff" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M50 39l-9 9 9 9" />
        <path d="M70 39l9 9-9 9" />
        <path d="M63 36l-6 24" />
      </g>
      {/* Keyboard deck */}
      <path d="M12 78h96l-5 13a5 5 0 0 1-4.7 3.3H21.7A5 5 0 0 1 17 91z" fill={`url(#${id}base)`} />
      <path d="M12 78h96l-1.2 3H13.2z" fill="#eef0ff" />
      <rect x="50" y="78" width="20" height="3.5" rx="1.75" fill="#7d88e0" />
      <g fill="#7d88e0" opacity="0.55">
        <rect x="26" y="84" width="68" height="2.4" rx="1.2" />
        <rect x="30" y="88.5" width="60" height="2.4" rx="1.2" />
      </g>
    </svg>
  );
}

// One toy brick in a simple oblique view: front face, top face with studs,
// and a darker right side
function Brick({ x, y, w, h, studs, front, top, side }: { x: number; y: number; w: number; h: number; studs: number; front: string; top: string; side: string }) {
  const dx = 10;
  const dy = -8;
  const studEls: ReactElement[] = [];
  for (let i = 0; i < studs; i++) {
    const cx = x + ((i + 0.5) * w) / studs + dx / 2;
    const cy = y + dy / 2;
    studEls.push(
      <g key={i}>
        <ellipse cx={cx} cy={cy} rx="6.5" ry="3" fill={side} />
        <rect x={cx - 6.5} y={cy - 5} width="13" height="5" fill={side} />
        <ellipse cx={cx} cy={cy - 5} rx="6.5" ry="3" fill={top} />
      </g>
    );
  }
  return (
    <g>
      <path d={`M${x} ${y}l${dx} ${dy}h${w}l${-dx} ${-dy}z`} fill={top} />
      <path d={`M${x + w} ${y}l${dx} ${dy}v${h}l${-dx} ${-dy}z`} fill={side} />
      <rect x={x} y={y} width={w} height={h} rx="2" fill={front} />
      <rect x={x + 3} y={y + 3} width={w - 6} height="3" rx="1.5" fill="#fff" opacity="0.25" />
      {studEls}
    </g>
  );
}

export function BricksIllustration({ className }: Props) {
  const id = useId();
  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden="true">
      <FloorShadow id={`${id}floor`} cy={103} rx={50} />
      <Brick x={8} y={66} w={50} h={32} studs={2} front="#ff8c42" top="#ffb27a" side="#d9661f" />
      <Brick x={20} y={34} w={50} h={32} studs={2} front="#ffbf3f" top="#ffd97f" side="#e09a1f" />
      <Brick x={54} y={70} w={48} h={30} studs={2} front="#ef4b4b" top="#ff8a7a" side="#c42f2f" />
    </svg>
  );
}

export function TrophyIllustration({ className }: Props) {
  const id = useId();
  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={`${id}gold`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#ffe17a" />
          <stop offset="0.55" stopColor="#ffc233" />
          <stop offset="1" stopColor="#f29a1a" />
        </linearGradient>
        <linearGradient id={`${id}base`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#24366b" />
          <stop offset="1" stopColor="#0b1a3a" />
        </linearGradient>
      </defs>
      <FloorShadow id={`${id}floor`} rx={32} />
      {/* Handles */}
      <g fill="none" stroke="#f5aa25" strokeWidth="6" strokeLinecap="round">
        <path d="M35 30H25a7 7 0 0 0-7 7c0 11 8 17 19 18" />
        <path d="M85 30h10a7 7 0 0 1 7 7c0 11-8 17-19 18" />
      </g>
      {/* Bowl */}
      <path d="M33 20h54v20c0 17-11 29-27 31-16-2-27-14-27-31z" fill={`url(#${id}gold)`} />
      <ellipse cx="60" cy="20" rx="27" ry="4" fill="#fff0b3" />
      <path d="M40 26v13c0 8 3 15 8 20" fill="none" stroke="#fff" strokeOpacity="0.45" strokeWidth="4" strokeLinecap="round" />
      <path d="M60 33l3.5 7.1 7.8 1.1-5.7 5.5 1.4 7.8-7-3.7-7 3.7 1.4-7.8-5.7-5.5 7.8-1.1z" fill="#fff7d6" />
      {/* Stem and base */}
      <path d="M54 70h12l2 10H52z" fill="#f0a020" />
      <rect x="42" y="79" width="36" height="6" rx="3" fill={`url(#${id}gold)`} />
      <rect x="35" y="85" width="50" height="18" rx="4" fill={`url(#${id}base)`} />
      <rect x="49" y="90" width="22" height="7" rx="2" fill="#ffc233" />
    </svg>
  );
}

export const METHOD_ILLUSTRATIONS = [MagnifierIllustration, LaptopIllustration, BricksIllustration, TrophyIllustration];
