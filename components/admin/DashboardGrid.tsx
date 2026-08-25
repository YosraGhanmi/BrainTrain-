'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
  Handshake,
  BarChart3,
  BookOpen,
  Users,
  Mail,
  Share2,
  Image as ImageIcon,
  Milestone,
  Inbox,
  type LucideIcon,
} from 'lucide-react';

interface Section {
  label: string;
  href: string;
  description: string;
}

const COLS = 3;

const ICON_BY_HREF: Record<string, LucideIcon> = {
  '/admin/messages': Inbox,
  '/admin/sponsors': Handshake,
  '/admin/stats': BarChart3,
  '/admin/courses': BookOpen,
  '/admin/age-groups': Users,
  '/admin/contact': Mail,
  '/admin/socials': Share2,
  '/admin/achievements': ImageIcon,
  '/admin/timeline': Milestone,
};

export default function DashboardGrid({ sections }: { sections: Section[] }) {
  const [hovered, setHovered] = useState<number | null>(null);

  const neighbours = useMemo(() => {
    if (hovered === null) return [];
    const out: number[] = [];
    if (hovered % COLS !== 0) out.push(hovered - 1);
    if (hovered % COLS !== COLS - 1) out.push(hovered + 1);
    out.push(hovered - COLS);
    out.push(hovered + COLS);
    return out.filter((n) => n >= 0 && n < sections.length);
  }, [hovered, sections.length]);

  return (
    <div
      className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
      onPointerLeave={() => setHovered(null)}
      style={{ perspective: 1600 }}
    >
      {sections.map((s, i) => {
        const isBig = hovered === i;
        const isSmall = !isBig && neighbours.includes(i);
        const Icon = ICON_BY_HREF[s.href];

        return (
          <Link
            key={s.href}
            href={s.href}
            onPointerEnter={() => setHovered(i)}
            className="relative rounded-2xl border border-ink/10 bg-white p-6 shadow-soft transition-all duration-200 ease-out"
            style={{
              transform: isBig
                ? 'scale(1.06) translateY(-6px) translateZ(20px)'
                : isSmall
                  ? 'scale(1.02) translateY(-2px)'
                  : 'scale(1)',
              boxShadow: isBig
                ? '0 12px 30px -8px rgba(61, 127, 255, 0.4), 0 4px 12px rgba(11, 12, 16, 0.08)'
                : undefined,
              borderColor: isBig ? 'rgba(61, 127, 255, 0.35)' : undefined,
              zIndex: isBig ? sections.length + 1 : i + 1,
            }}
          >
            {Icon ? (
              <span className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10 text-accent">
                <Icon className="h-4 w-4" />
              </span>
            ) : null}
            <h2 className="font-semibold text-ink">{s.label}</h2>
            <p className="mt-2 text-sm text-stone">{s.description}</p>
          </Link>
        );
      })}
    </div>
  );
}
