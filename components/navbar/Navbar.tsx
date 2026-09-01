'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { ArrowRight, Menu, X } from 'lucide-react';
import RadialReveal from '@/components/effects/RadialReveal';
import { Link, usePathname } from '@/i18n/navigation';

export default function Navbar({ solid = false }: { solid?: boolean }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const shrink = solid || scrolled;
  const t = useTranslations('nav');
  const locale = useLocale();
  const pathname = usePathname();

  const navItems = [
    { label: t('home'), href: '/' },
    { label: t('about'), href: '/#philosophy' },
    { label: t('achievements'), href: '/#stats' },
    { label: t('courses'), href: '/courses' },
    { label: t('contact'), href: '/#contact' },
  ];

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className={`fixed inset-x-0 top-0 z-50 border-b transition-all duration-500 ${shrink ? 'bg-white/80 border-white/30 shadow-soft' : 'bg-white/10 border-white/10'} backdrop-blur-3xl`}>
      <div className="relative flex items-center px-6 py-2.5 xl:px-8">
        <div className="mx-auto flex w-full max-w-7xl items-center gap-0">
          <Link className="flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.35em] text-ink" href="/">
            <span className="relative h-12 w-32 overflow-hidden">
              <Image src="/ID BRAINTRAIN.png" alt="BrainTrain logo" fill className="object-contain object-left opacity-90" />
            </span>
          </Link>

          <nav className="hidden items-center gap-10 md:flex md:flex-1 md:justify-center">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="group relative text-sm uppercase tracking-[0.2em] text-stone transition hover:text-ink"
              >
                {item.label}
                <span
                  aria-hidden
                  className="pointer-events-none absolute left-1/2 top-full mt-2 h-0 w-0 -translate-x-1/2 -translate-y-1 border-x-[5px] border-t-[6px] border-x-transparent border-t-ink opacity-0 transition-all duration-150 ease-out group-hover:translate-y-0 group-hover:opacity-100"
                />
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden items-center gap-1 rounded-full border border-ink/15 bg-white/90 p-1 text-xs font-semibold uppercase tracking-[0.15em] md:flex">
            <Link
              href={pathname}
              locale="en"
              className={`rounded-full px-3 py-1.5 transition ${locale === 'en' ? 'bg-ink text-white' : 'text-ink/60 hover:text-ink'}`}
            >
              EN
            </Link>
            <Link
              href={pathname}
              locale="fr"
              className={`rounded-full px-3 py-1.5 transition ${locale === 'fr' ? 'bg-ink text-white' : 'text-ink/60 hover:text-ink'}`}
            >
              FR
            </Link>
          </div>
          <div className="hidden md:inline-flex">
            <RadialReveal
              href="/parent-portal/login"
              boxClassName="rounded-full border border-ink/15 bg-white/90 shadow-sm"
              faceClassName="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold uppercase tracking-[0.2em]"
              restColorClassName="text-ink"
              hoverColorClassName="bg-ink text-white"
            >
              {t('login')}
              <ArrowRight className="h-4 w-4" />
            </RadialReveal>
          </div>
          <button
            className="inline-flex items-center rounded-full border border-ink/10 bg-white/90 p-3 text-ink transition hover:border-ink/30 md:hidden"
            onClick={() => setOpen(!open)}
            aria-label={open ? 'Close menu' : 'Open menu'}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open ? (
        <div className="mx-auto mt-4 max-w-7xl px-6 xl:px-8 md:hidden">
          <div className="rounded-3xl border border-stone/10 bg-white/90 p-5 shadow-soft">
            <div className="grid gap-4">
              {navItems.map((item) => (
                <Link key={item.label} href={item.href} className="text-sm uppercase tracking-[0.2em] text-ink transition hover:text-accent" onClick={() => setOpen(false)}>
                  {item.label}
                </Link>
              ))}
              <div className="flex items-center justify-center gap-2 py-1 text-xs font-semibold uppercase tracking-[0.15em]">
                <Link
                  href={pathname}
                  locale="en"
                  className={`transition ${locale === 'en' ? 'text-ink' : 'text-ink/40 hover:text-ink/70'}`}
                >
                  EN
                </Link>
                <span className="text-ink/20">/</span>
                <Link
                  href={pathname}
                  locale="fr"
                  className={`transition ${locale === 'fr' ? 'text-ink' : 'text-ink/40 hover:text-ink/70'}`}
                >
                  FR
                </Link>
              </div>
              <Link href="/parent-portal/login" className="inline-flex items-center justify-center rounded-full bg-ink px-5 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-stone">
                {t('login')}
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
