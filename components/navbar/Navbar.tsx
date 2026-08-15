'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import RadialReveal from '@/components/effects/RadialReveal';

const navItems = [
  { label: 'Home', href: '#top' },
  { label: 'About', href: '#philosophy' },
  { label: 'Achievements', href: '#stats' },
  { label: 'Courses', href: '#courses' },
  { label: 'Contact', href: '#contact' },
];

export default function Navbar() {
  const [shrink, setShrink] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setShrink(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className={`fixed inset-x-0 top-0 z-50 border-b transition-all duration-500 ${shrink ? 'bg-white/80 border-white/30 shadow-soft' : 'bg-white/10 border-white/10'} backdrop-blur-3xl`}> 
      <div className="relative flex items-center px-6 py-2.5 xl:px-8">
        <div className="mx-auto flex w-full max-w-7xl items-center gap-0">
          <a className="flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.35em] text-ink" href="#top">
            <span className="relative h-12 w-32 overflow-hidden">
              <Image src="/ID BRAINTRAIN.png" alt="BrainTrain logo" fill className="object-contain object-left opacity-90" />
            </span>
          </a>

          <nav className="hidden items-center gap-10 md:flex md:flex-1 md:justify-center">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="group relative text-sm uppercase tracking-[0.2em] text-stone transition hover:text-ink"
              >
                {item.label}
                <span
                  aria-hidden
                  className="pointer-events-none absolute left-1/2 top-full mt-2 h-0 w-0 -translate-x-1/2 -translate-y-1 border-x-[5px] border-t-[6px] border-x-transparent border-t-ink opacity-0 transition-all duration-150 ease-out group-hover:translate-y-0 group-hover:opacity-100"
                />
              </a>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:inline-flex">
            <RadialReveal
              href="/login"
              boxClassName="rounded-full border border-ink/15 bg-white/90 shadow-sm"
              faceClassName="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold uppercase tracking-[0.2em]"
              restColorClassName="text-ink"
              hoverColorClassName="bg-ink text-white"
            >
              Log in
              <ArrowRight className="h-4 w-4" />
            </RadialReveal>
          </div>
          <button className="inline-flex items-center rounded-full border border-ink/10 bg-white/90 p-3 text-ink transition hover:border-ink/30 md:hidden" onClick={() => setOpen(!open)}>
            <Sparkles className="h-5 w-5" />
          </button>
        </div>
      </div>

      {open ? (
        <div className="mx-auto mt-4 max-w-7xl px-6 xl:px-8 md:hidden">
          <div className="rounded-3xl border border-stone/10 bg-white/90 p-5 shadow-soft">
            <div className="grid gap-4">
              {navItems.map((item) => (
                <a key={item.label} href={item.href} className="text-sm uppercase tracking-[0.2em] text-ink transition hover:text-accent" onClick={() => setOpen(false)}>
                  {item.label}
                </a>
              ))}
              <a href="/login" className="inline-flex items-center justify-center rounded-full bg-ink px-5 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-stone">
                Log in
              </a>
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
