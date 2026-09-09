'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';
import { ChevronDown, Globe, Menu, UserCircle, Users } from 'lucide-react';
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
  onMenuClick,
}: {
  fullName: string;
  email: string;
  settingsHref?: string;
  childSwitcher?: { children: { id: string; fullName: string }[]; selectedChildId: string };
  onMenuClick?: () => void;
}) {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [childOpen, setChildOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const currentLocale = LOCALES.find((l) => l.code === locale) ?? LOCALES[0];
  const selectedChild = childSwitcher?.children.find((c) => c.id === childSwitcher.selectedChildId);

  return (
    <div className="flex items-center justify-between gap-2 px-3 py-3 sm:gap-3 sm:px-4 lg:px-8 lg:py-4">
      <button
        type="button"
        onClick={onMenuClick}
        aria-label="Open menu"
        className="shrink-0 rounded-lg p-2 text-ink transition hover:bg-slate-100 lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      {childSwitcher ? (
        childSwitcher.children.length > 0 ? (
        <div
          className="relative min-w-0"
          onBlur={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node)) setChildOpen(false);
          }}
        >
          <button
            type="button"
            onClick={() => setChildOpen((v) => !v)}
            className="flex items-center gap-2 rounded-full px-2 py-2 text-sm font-semibold text-ink transition hover:bg-slate-50 sm:px-4"
          >
            <span className="max-w-[6rem] truncate sm:max-w-[10rem]">{selectedChild?.fullName}</span>
            <ChevronDown className="h-3.5 w-3.5 shrink-0 text-stone" />
          </button>
          {childOpen ? (
            <ul className="absolute left-0 z-20 mt-2 w-56 max-w-[85vw] overflow-hidden rounded-xl border border-ink/10 bg-white py-1.5 shadow-soft">
              {childSwitcher.children.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setChildOpen(false);
                      startTransition(async () => {
                        const formData = new FormData();
                        formData.set('locale', locale);
                        formData.set('childId', c.id);
                        await selectChild(formData);
                        router.refresh();
                      });
                    }}
                    className={`block w-full truncate px-4 py-2 text-left text-sm font-semibold transition ${
                      c.id === childSwitcher.selectedChildId ? 'bg-slate-50 text-accent' : 'text-ink hover:bg-slate-50'
                    }`}
                  >
                    {c.fullName}
                  </button>
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
            className="flex min-w-0 items-center gap-2 rounded-full border border-ink/15 px-2 py-2 text-sm font-semibold text-ink transition hover:bg-slate-50 sm:px-4"
          >
            <Users className="h-4 w-4 shrink-0 text-accent" />
            <span className="hidden sm:inline">Add a child</span>
          </Link>
        )
      ) : (
        <div className="min-w-0 flex-1" />
      )}

      <div className="flex items-center gap-2 sm:gap-3">
      <div
        className="relative"
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node)) setLangOpen(false);
        }}
      >
        <button
          type="button"
          onClick={() => setLangOpen((v) => !v)}
          className="flex items-center gap-1.5 rounded-md border border-ink/15 px-2.5 py-2 text-sm font-semibold uppercase text-ink transition hover:bg-slate-50 sm:gap-2 sm:px-4"
        >
          <Globe className="h-4 w-4 shrink-0 text-accent" />
          {currentLocale.code}
          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-stone" />
        </button>
        {langOpen ? (
          <ul className="absolute right-0 z-20 mt-2 w-40 max-w-[85vw] overflow-hidden rounded-md border border-ink/10 bg-white py-1.5 shadow-soft">
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
          <div className="absolute right-0 z-20 mt-2 w-64 max-w-[85vw] overflow-hidden rounded-xl border border-ink/10 bg-white py-2 shadow-soft">
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
