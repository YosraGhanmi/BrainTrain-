'use client';

import { useEffect, useRef, useState } from 'react';
import { useLocale } from 'next-intl';
import { ChevronDown } from 'lucide-react';
import { Link, usePathname } from '@/i18n/navigation';

const LOCALES = [
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'Français' },
] as const;

export default function LanguageSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const current = LOCALES.find((l) => l.code === locale) ?? LOCALES[0];

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex items-center gap-1.5 px-1 py-1.5 text-sm uppercase tracking-[0.2em] text-stone transition hover:text-ink"
      >
        {current.code}
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open ? (
        <div
          role="listbox"
          className="absolute right-0 top-full mt-2 w-36 overflow-hidden rounded-2xl border border-ink/10 bg-white shadow-soft"
        >
          {LOCALES.map((l) => (
            <Link
              key={l.code}
              href={pathname}
              locale={l.code}
              role="option"
              aria-selected={locale === l.code}
              onClick={() => setOpen(false)}
              className={`block px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.1em] transition ${
                locale === l.code ? 'bg-ink/5 text-ink' : 'text-ink/60 hover:bg-ink/5 hover:text-ink'
              }`}
            >
              {l.label}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
