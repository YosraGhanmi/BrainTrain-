'use client';

import { useState } from 'react';
import { useLocale } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';
import { ChevronDown, Globe, UserCircle, Users } from 'lucide-react';
import { selectChild } from '@/lib/portal-auth/actions';

const LOCALES: { code: 'en' | 'fr'; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'Français' },
];

export default function PortalTopbar({
  fullName,
  email,
  settingsHref,
  childSwitcher,
}: {
  fullName: string;
  email: string;
  settingsHref?: string;
  childSwitcher?: { children: { id: string; fullName: string }[]; selectedChildId: string };
}) {
  const locale = useLocale();
  const pathname = usePathname();
  const [childOpen, setChildOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const currentLocale = LOCALES.find((l) => l.code === locale) ?? LOCALES[0];
  const selectedChild = childSwitcher?.children.find((c) => c.id === childSwitcher.selectedChildId);

  return (
    <div className="flex items-center justify-between gap-3 border-b border-ink/10 bg-white px-8 py-4">
      {childSwitcher ? (
        childSwitcher.children.length > 0 ? (
        <div
          className="relative"
          onBlur={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node)) setChildOpen(false);
          }}
        >
          <button
            type="button"
            onClick={() => setChildOpen((v) => !v)}
            className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-ink transition hover:bg-slate-50"
          >
            <span className="max-w-[10rem] truncate">{selectedChild?.fullName}</span>
            <ChevronDown className="h-3.5 w-3.5 text-stone" />
          </button>
          {childOpen ? (
            <ul className="absolute left-0 z-20 mt-2 w-56 overflow-hidden rounded-xl border border-ink/10 bg-white py-1.5 shadow-soft">
              {childSwitcher.children.map((c) => (
                <li key={c.id}>
                  <form action={selectChild}>
                    <input type="hidden" name="locale" value={locale} />
                    <input type="hidden" name="pathname" value={pathname} />
                    <input type="hidden" name="childId" value={c.id} />
                    <button
                      type="submit"
                      onClick={() => setChildOpen(false)}
                      className={`block w-full truncate px-4 py-2 text-left text-sm font-semibold transition ${
                        c.id === childSwitcher.selectedChildId ? 'bg-slate-50 text-accent' : 'text-ink hover:bg-slate-50'
                      }`}
                    >
                      {c.fullName}
                    </button>
                  </form>
                </li>
              ))}
              <li className="border-t border-ink/10">
                <Link
                  href="/parent-portal/children/new"
                  onClick={() => setChildOpen(false)}
                  className="block px-4 py-2 text-sm font-semibold text-accent transition hover:bg-slate-50"
                >
                  + Add a child
                </Link>
              </li>
            </ul>
          ) : null}
        </div>
        ) : (
          <Link
            href="/parent-portal/children/new"
            className="flex items-center gap-2 rounded-full border border-ink/15 px-4 py-2 text-sm font-semibold text-ink transition hover:bg-slate-50"
          >
            <Users className="h-4 w-4 text-accent" />
            Add a child
          </Link>
        )
      ) : (
        <div />
      )}

      <div className="flex items-center gap-3">
      <div
        className="relative"
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node)) setLangOpen(false);
        }}
      >
        <button
          type="button"
          onClick={() => setLangOpen((v) => !v)}
          className="flex items-center gap-2 rounded-md border border-ink/15 px-4 py-2 text-sm font-semibold uppercase text-ink transition hover:bg-slate-50"
        >
          <Globe className="h-4 w-4 text-accent" />
          {currentLocale.code}
          <ChevronDown className="h-3.5 w-3.5 text-stone" />
        </button>
        {langOpen ? (
          <ul className="absolute right-0 z-20 mt-2 w-40 overflow-hidden rounded-md border border-ink/10 bg-white py-1.5 shadow-soft">
            {LOCALES.map((l) => (
              <li key={l.code}>
                <Link
                  href={pathname}
                  locale={l.code}
                  onClick={() => setLangOpen(false)}
                  className={`block px-4 py-2 text-sm font-semibold transition ${
                    l.code === locale ? 'bg-slate-50 text-accent' : 'text-ink hover:bg-slate-50'
                  }`}
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <div
        className="relative"
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node)) setProfileOpen(false);
        }}
      >
        <button
          type="button"
          onClick={() => setProfileOpen((v) => !v)}
          aria-label="Account menu"
          className="flex items-center justify-center rounded-full transition hover:opacity-80"
        >
          <UserCircle className="h-9 w-9 text-accent" />
        </button>
        {profileOpen ? (
          <div className="absolute right-0 z-20 mt-2 w-64 overflow-hidden rounded-xl border border-ink/10 bg-white py-2 shadow-soft">
            <div className="px-4 py-2">
              <p className="truncate text-sm font-bold text-ink">{fullName}</p>
              <p className="truncate text-xs text-stone">{email}</p>
            </div>
            {settingsHref ? (
              <>
                <div className="border-t border-ink/10" />
                <Link
                  href={settingsHref}
                  onClick={() => setProfileOpen(false)}
                  className="block px-4 py-2.5 text-sm font-semibold text-ink transition hover:bg-slate-50"
                >
                  Account settings
                </Link>
              </>
            ) : null}
          </div>
        ) : null}
      </div>
      </div>
    </div>
  );
}
