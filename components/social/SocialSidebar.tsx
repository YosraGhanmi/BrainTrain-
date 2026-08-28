'use client';

import { usePathname } from '@/i18n/navigation';
import { Facebook, Instagram, Linkedin, Share2, type LucideIcon } from 'lucide-react';
import type { SocialLink } from '@/lib/content/types';

const ICONS: Record<string, LucideIcon> = {
  Facebook,
  Instagram,
  LinkedIn: Linkedin,
};

function iconFor(label: string): LucideIcon {
  return ICONS[label] ?? Share2;
}

export default function SocialSidebar({ socials }: { socials: SocialLink[] }) {
  // Admin has its own left-hand nav in the same screen region — the public
  // marketing sidebar would visually collide with it, so it's hidden there
  // rather than fighting for the same space. Same idea for the parent-portal
  // login/signup screen, whose diagonal navy panel occupies that edge too,
  // plus its own "Back to website" link in the same corner.
  const pathname = usePathname();
  if (pathname?.startsWith('/admin')) return null;
  if (pathname?.startsWith('/parent-portal/login') || pathname?.startsWith('/parent-portal/register')) return null;

  return (
    <div className="fixed left-0 top-1/2 z-40 hidden -translate-y-1/2 flex-col items-start gap-3 lg:flex">
      {socials.map(({ label, href }) => {
        const Icon = iconFor(label);
        return (
          <a
            key={label}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={label}
            className="group flex h-11 w-11 items-center overflow-hidden rounded-r-full border border-l-0 border-[#1e2a5e]/20 bg-white/80 text-[#1e2a5e] shadow-sm backdrop-blur-sm transition-[width,background-color,color] duration-300 ease-out hover:w-36 hover:border-[#1e2a5e] hover:bg-[#1e2a5e] hover:text-white"
          >
            <span className="flex h-11 w-11 flex-none items-center justify-center">
              <Icon className="h-4 w-4" strokeWidth={1.75} />
            </span>
            <span className="whitespace-nowrap pr-4 text-sm font-semibold opacity-0 transition-opacity duration-200 group-hover:opacity-100">
              {label}
            </span>
          </a>
        );
      })}
    </div>
  );
}
