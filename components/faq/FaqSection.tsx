'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger';
import { ArrowRight, Minus, Plus } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import FaqIllustration from '@/components/faq/FaqIllustration';
import type { FaqContent, LocalizedString } from '@/lib/content/types';
import type { AppLocale } from '@/i18n/routing';

gsap.registerPlugin(ScrollTrigger);

export default function FaqSection({ faq }: { faq: FaqContent }) {
  const sectionRef = useRef<HTMLElement>(null);
  // The first answer starts open; opening another one closes it
  const [open, setOpen] = useState<number | null>(0);
  const baseId = useId();
  const t = useTranslations('faq');
  const locale = useLocale() as AppLocale;
  const text = (value: LocalizedString) => value[locale] || value.en;

  // Plays once as each part scrolls into view: the heading, the questions one
  // by one, then the illustration building itself. Visitors who ask for
  // reduced motion get everything in place from the start.
  useEffect(() => {
    if (!sectionRef.current) return;
    const mm = gsap.matchMedia(sectionRef);

    mm.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.fromTo(
        '.faq-heading',
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 0.9,
          ease: 'power3.out',
          scrollTrigger: { trigger: '.faq-heading', start: 'top 85%', once: true },
        }
      );

      gsap.fromTo(
        '.faq-row',
        { opacity: 0, y: 28 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          ease: 'power3.out',
          stagger: 0.09,
          clearProps: 'transform',
          scrollTrigger: { trigger: '.faq-list', start: 'top 85%', once: true },
        }
      );

      // Origins go first: changing an SVG element's origin while it is scaled
      // leaves it permanently offset
      gsap.set(['.faq-floor', '.faq-mark'], { transformOrigin: '50% 50%' });
      gsap.set('.faq-sprig', { transformOrigin: '50% 100%' });

      gsap
        .timeline({ scrollTrigger: { trigger: '.faq-illustration', start: 'top 80%', once: true } })
        .fromTo('.faq-floor', { opacity: 0, scaleX: 0.5 }, { opacity: 1, scaleX: 1, duration: 0.6, ease: 'power2.out' }, 0)
        .fromTo('.faq-letter', { opacity: 0, y: 80 }, { opacity: 1, y: 0, duration: 0.8, ease: 'back.out(1.6)', stagger: 0.13 }, 0)
        .fromTo('.faq-sprig', { opacity: 0, scale: 0.4 }, { opacity: 1, scale: 1, duration: 0.6, ease: 'back.out(1.8)' }, 0.35)
        .fromTo('.faq-robot', { opacity: 0, y: 70 }, { opacity: 1, y: 0, duration: 0.7, ease: 'back.out(1.8)' }, 0.5)
        .fromTo('.faq-mark', { opacity: 0, scale: 0 }, { opacity: 1, scale: 1, duration: 0.5, ease: 'back.out(2.6)', stagger: 0.14 }, 0.85);
    });

    return () => mm.revert();
  }, []);

  if (faq.items.length === 0) return null;

  return (
    <section ref={sectionRef} id="faq" className="relative overflow-hidden bg-surface px-6 py-24 md:px-10 lg:px-16">
      <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <div>
          <h2 className="faq-heading font-display text-4xl font-extrabold leading-[1.05] tracking-tight text-[#0b1a3a] sm:text-5xl">
            {text(faq.heading)}
            <span className="block text-accent">{text(faq.headingAccent)}</span>
          </h2>

          <div className="faq-list mt-10 border-t border-[#0b1a3a]/10">
            {faq.items.map((item, i) => {
              const isOpen = open === i;
              const buttonId = `${baseId}-button-${i}`;
              const panelId = `${baseId}-panel-${i}`;
              const Icon = isOpen ? Minus : Plus;
              return (
                <div key={i} className="faq-row border-b border-[#0b1a3a]/10">
                  <h3>
                    <button
                      type="button"
                      id={buttonId}
                      aria-expanded={isOpen}
                      aria-controls={panelId}
                      onClick={() => setOpen(isOpen ? null : i)}
                      className="flex w-full items-center justify-between gap-4 py-5 text-left font-display text-base font-bold text-[#0b1a3a] transition hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:text-lg"
                    >
                      {text(item.question)}
                      <Icon className={`h-5 w-5 shrink-0 ${isOpen ? 'text-accent' : 'text-[#ff8c42]'}`} strokeWidth={2.25} aria-hidden="true" />
                    </button>
                  </h3>
                  {/* Rows animate from 0fr to 1fr so the height needs no
                      measuring; `invisible` keeps a closed answer's button out
                      of the tab order */}
                  <div
                    id={panelId}
                    role="region"
                    aria-labelledby={buttonId}
                    className={`grid transition-[grid-template-rows,visibility] duration-300 ease-out motion-reduce:transition-none ${
                      isOpen ? 'visible grid-rows-[1fr]' : 'invisible grid-rows-[0fr]'
                    }`}
                  >
                    <div className="overflow-hidden">
                      <p className="whitespace-pre-line pb-5 pr-9 text-[0.95rem] leading-relaxed text-stone">{text(item.answer)}</p>
                      {item.showPreinscriptionButton ? (
                        <div className="p-1 pb-6">
                          <Link
                            href="/preinscription"
                            className="group/btn inline-flex items-center gap-3 rounded-full bg-[#0b1a3a] py-2.5 pl-6 pr-2.5 text-sm font-bold uppercase tracking-wide text-white transition-all duration-200 hover:gap-4 hover:bg-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0b1a3a]"
                          >
                            {t('preinscription')}
                            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#ef4b4b] transition-colors duration-200 group-hover/btn:bg-white group-hover/btn:text-accent">
                              <ArrowRight className="h-4 w-4" aria-hidden="true" />
                            </span>
                          </Link>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <FaqIllustration className="faq-illustration mx-auto w-full max-w-md lg:max-w-none" />
      </div>
    </section>
  );
}
