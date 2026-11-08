import { useId } from 'react';

// Beside the FAQ: the big letters F, A and Q with the academy's robot in front
// of them, chin in hand, under a few floating question marks. Purely
// decorative. Each letter is its front shape stacked over copies of itself
// shifted down and right, which reads as a solid block.
//
// FaqSection animates the faq-* groups as they scroll into view. Those groups
// carry no transform of their own, so the animation can't overwrite a piece's
// placement.

const DEPTH = 14;

function Letter({ d, transform, front }: { d: string[]; transform: string; front: string }) {
  return (
    <g className="faq-letter">
      <g transform={transform}>
        {Array.from({ length: DEPTH }, (_, i) => DEPTH - i).map((step) => (
          <g key={step} transform={`translate(${step} ${step * 0.7})`} fill="#9db4f2">
            {d.map((path) => (
              <path key={path} d={path} fillRule="evenodd" />
            ))}
          </g>
        ))}
        <g fill={front}>
          {d.map((path) => (
            <path key={path} d={path} fillRule="evenodd" />
          ))}
        </g>
      </g>
    </g>
  );
}

function QuestionMark({ transform, color, delay }: { transform: string; color: string; delay?: string }) {
  return (
    <g className="faq-mark">
      <g transform={transform}>
        <g className="motion-safe:animate-bob" style={{ animationDelay: delay }}>
          <path d="M-15 -18a15 15 0 1 1 24 12c-6 4.5-9 7-9 15" fill="none" stroke={color} strokeWidth="9" strokeLinecap="round" />
          <circle cx="0" cy="26" r="5.8" fill={color} />
        </g>
      </g>
    </g>
  );
}

function Sprig({ transform, color }: { transform: string; color: string }) {
  return (
    <g className="faq-sprig">
      <g transform={transform} fill={color}>
        <path d="M0 0c-16-10-20-28-12-44 14 8 20 26 12 44Z" />
        <path d="M2 -6c4-18 18-28 36-28 0 18-16 30-36 28Z" />
        <path d="M-4 -8c-16-2-30-14-32-32 18 0 32 14 32 32Z" />
        <path d="M0 0c-1 18-3 34-8 50" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" />
      </g>
    </g>
  );
}

function Robot({ transform, id }: { transform: string; id: string }) {
  return (
    <g transform={transform}>
      {/* Legs and feet */}
      <rect x="-33" y="-82" width="25" height="66" rx="10" fill="#0f1f4d" />
      <rect x="8" y="-82" width="25" height="66" rx="10" fill="#0f1f4d" />
      <rect x="-44" y="-24" width="40" height="24" rx="12" fill="#0b1a3a" />
      <rect x="4" y="-24" width="40" height="24" rx="12" fill="#0b1a3a" />

      {/* Body */}
      <rect x="-50" y="-170" width="100" height="98" rx="28" fill={`url(#${id}body)`} />
      <rect x="-27" y="-146" width="40" height="30" rx="10" fill="#fff" opacity="0.92" />
      <circle cx="-16" cy="-131" r="4.5" fill="#3d7fff" />
      <circle cx="1" cy="-131" r="4.5" fill="#ef4b4b" />

      {/* Neck, antenna and head */}
      <rect x="-13" y="-182" width="26" height="16" rx="5" fill="#0f1f4d" />
      <line x1="0" y1="-266" x2="0" y2="-288" stroke="#0f1f4d" strokeWidth="5" strokeLinecap="round" />
      <circle cx="0" cy="-293" r="9" fill="#ef4b4b" />
      <rect x="-70" y="-238" width="14" height="30" rx="7" fill="#3d7fff" />
      <rect x="56" y="-238" width="14" height="30" rx="7" fill="#3d7fff" />
      <rect x="-60" y="-268" width="120" height="92" rx="32" fill={`url(#${id}head)`} stroke="#9db4f2" strokeWidth="2.5" />
      <rect x="-45" y="-254" width="90" height="56" rx="24" fill="#0b1a3a" />

      {/* Eyes glancing up at the question marks, and a small unsure mouth */}
      <circle cx="-14" cy="-232" r="7.5" fill="#8fd3ff" />
      <circle cx="20" cy="-232" r="7.5" fill="#8fd3ff" />
      <circle cx="-11.5" cy="-234.5" r="2.5" fill="#fff" />
      <circle cx="22.5" cy="-234.5" r="2.5" fill="#fff" />
      <path d="M-3 -212q7 4 14 -1" fill="none" stroke="#8fd3ff" strokeWidth="3.5" strokeLinecap="round" />

      {/* The arm across the body, then the one bringing a hand to the chin */}
      <path d="M-44 -146q-26 36 -2 44l92 -4" fill="none" stroke="#0f1f4d" strokeWidth="17" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="50" cy="-106" r="12" fill="#fff" stroke="#0f1f4d" strokeWidth="4" />
      <path d="M46 -148l26 42l-30 -66" fill="none" stroke="#0f1f4d" strokeWidth="17" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="40" cy="-176" r="13" fill="#fff" stroke="#0f1f4d" strokeWidth="4" />
    </g>
  );
}

export default function FaqIllustration({ className }: { className?: string }) {
  const id = useId();
  return (
    <svg viewBox="0 0 600 470" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={`${id}letter`} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="226">
          <stop offset="0" stopColor="#f2f5ff" />
          <stop offset="1" stopColor="#d3dffc" />
        </linearGradient>
        <linearGradient id={`${id}body`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffb27a" />
          <stop offset="1" stopColor="#ff8c42" />
        </linearGradient>
        <linearGradient id={`${id}head`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#dfe9ff" />
        </linearGradient>
        <radialGradient id={`${id}floor`}>
          <stop offset="0" stopColor="#0b1a3a" stopOpacity="0.16" />
          <stop offset="1" stopColor="#0b1a3a" stopOpacity="0" />
        </radialGradient>
      </defs>

      <ellipse className="faq-floor" cx="300" cy="428" rx="290" ry="30" fill={`url(#${id}floor)`} />
      <Sprig transform="translate(50 156) rotate(-22) scale(1.25)" color="#dfe9ff" />
      <Sprig transform="translate(552 206) rotate(24) scale(1.25)" color="#d5f3ef" />

      <Letter
        transform="translate(20 178) rotate(-6) scale(1.08)"
        front={`url(#${id}letter)`}
        d={['M0 0H136V46H54V84H122V128H54V210H0Z']}
      />
      <Letter
        transform="translate(160 138) rotate(1) scale(1.2)"
        front={`url(#${id}letter)`}
        d={['M60 0H120L180 210H122L112 170H68L58 210H0ZM79 128H101L90 78Z']}
      />
      <Letter
        transform="translate(402 186) rotate(6) scale(0.98)"
        front={`url(#${id}letter)`}
        d={[
          'M0 105a95 105 0 1 0 190 0a95 105 0 1 0-190 0ZM54 105a41 53 0 1 1 82 0a41 53 0 1 1-82 0Z',
          'M112 160L146 136L192 204L154 226Z',
        ]}
      />

      <g className="faq-robot">
        <Robot transform="translate(384 436) scale(0.92)" id={id} />
      </g>

      <QuestionMark transform="translate(476 86) scale(1.6)" color="#ef4b4b" />
      <QuestionMark transform="translate(546 112) scale(0.85)" color="#3d7fff" delay="-2s" />
      <QuestionMark transform="translate(292 76) scale(0.72)" color="#0b1a3a" delay="-4s" />
    </svg>
  );
}
