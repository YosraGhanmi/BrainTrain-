'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowRight, Menu, X } from 'lucide-react';
import RadialReveal from '@/components/effects/RadialReveal';
import LanguageSwitcher from '@/components/navbar/LanguageSwitcher';
import { Link } from '@/i18n/navigation';

// `overHero`: the page opens on a full-screen video, so at the top the pill is
// a clear frosted glass with light text instead of cutting a white band across it.
export default function Navbar({ solid = false, overHero = false }: { solid?: boolean; overHero?: boolean }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const shrink = solid || scrolled;
  const onVideo = overHero && !shrink;
  const t = useTranslations('nav');

  const navItems = [
    { label: t('home'), href: '/' },
    { label: t('about'), href: '/#philosophy' },
    { label: t('courses'), href: '/courses' },
    { label: t('contact'), href: '/contact' },
  ];

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // A floating pill holding logo, links and actions as one centred block. Over
  // the video it's untinted glass (blur only) so the footage shows through;
  // a light blur keeps the per-frame recompute cheap.
  return (
    <header className="fixed inset-x-0 top-0 z-50 px-4 pt-4 xl:px-8">
      <div
        className={`mx-auto flex max-w-6xl items-center gap-4 rounded-full border py-2 pl-6 pr-2 transition-all duration-500 ${shrink ? 'border-white/40 bg-white/80 shadow-soft backdrop-blur-xl' : onVideo ? 'border-white/25 bg-white/[0.06] backdrop-blur-md' : 'border-white/10 bg-white/10'}`}
      >
        <Link className="flex shrink-0 items-center gap-3 text-sm font-semibold uppercase tracking-[0.35em] text-ink" href="/">
          <span className="relative h-10 w-28 overflow-hidden">
            <Image src="/ID BRAINTRAIN.png" alt="BrainTrain logo" fill sizes="112px" className="object-contain object-left opacity-90" />
          </span>
        </Link>

        <nav className="hidden items-center gap-6 lg:flex lg:flex-1 lg:justify-center xl:gap-9">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={`group relative whitespace-nowrap text-sm uppercase tracking-[0.2em] transition ${onVideo ? 'text-white/85 hover:text-white' : 'text-stone hover:text-ink'}`}
            >
              {item.label}
              <span
                aria-hidden
                className={`pointer-events-none absolute left-1/2 top-full mt-2 h-0 w-0 -translate-x-1/2 -translate-y-1 border-x-[5px] border-t-[6px] border-x-transparent ${onVideo ? 'border-t-white' : 'border-t-ink'} opacity-0 transition-all duration-150 ease-out group-hover:translate-y-0 group-hover:opacity-100`}
              />
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-4 lg:ml-0">
          <div className="hidden lg:block">
            <LanguageSwitcher light={onVideo} />
          </div>
          <div className="hidden lg:inline-flex">
            <RadialReveal
              href="/parent-portal/login"
              boxClassName="rounded-full border border-ink/15 bg-white/90 shadow-sm"
              faceClassName="inline-flex items-center gap-2 whitespace-nowrap px-5 py-2.5 text-sm font-semibold uppercase tracking-[0.2em]"
              restColorClassName="text-ink"
              hoverColorClassName="bg-ink text-white"
            >
              {t('login')}
              <ArrowRight className="h-4 w-4" />
            </RadialReveal>
          </div>
          <button
            className="inline-flex items-center rounded-full border border-ink/10 bg-white/90 p-3 text-ink transition hover:border-ink/30 lg:hidden"
            onClick={() => setOpen(!open)}
            aria-label={open ? 'Close menu' : 'Open menu'}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open ? (
        <div className="mx-auto mt-3 max-w-6xl lg:hidden">
          <div className="rounded-3xl border border-stone/10 bg-white/90 p-5 shadow-soft">
            <div className="grid gap-4">
              {navItems.map((item) => (
                <Link key={item.label} href={item.href} className="text-sm uppercase tracking-[0.2em] text-ink transition hover:text-accent" onClick={() => setOpen(false)}>
                  {item.label}
                </Link>
              ))}
              <div className="flex items-center justify-center py-1">
                <LanguageSwitcher />
              </div>
              <Link href="/parent-portal/login" className="inline-flex items-center justify-center whitespace-nowrap rounded-full bg-ink px-5 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-stone">
                {t('login')}
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
