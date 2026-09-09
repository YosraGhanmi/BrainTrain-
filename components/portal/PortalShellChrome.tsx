'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import PortalTopbar from '@/components/portal/PortalTopbar';
import AdminBackground from '@/components/admin/AdminBackground';

export default function PortalShellChrome({
  isLight,
  logoBlock,
  navLinksBlock,
  footerBlock,
  fullName,
  email,
  settingsHref,
  childSwitcher,
  children,
}: {
  isLight: boolean;
  logoBlock: React.ReactNode;
  navLinksBlock: React.ReactNode;
  footerBlock: React.ReactNode;
  fullName: string;
  email: string;
  settingsHref?: string;
  childSwitcher?: { children: { id: string; fullName: string }[]; selectedChildId: string };
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-surface lg:overflow-hidden">
      {mobileOpen ? (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden
        />
      ) : null}

      <aside
        className={
          (isLight
            ? 'flex h-screen w-72 max-w-[85vw] shrink-0 flex-col overflow-y-auto border-r border-ink/10 bg-white text-ink'
            : 'flex h-screen w-72 max-w-[85vw] shrink-0 flex-col overflow-y-auto bg-[#0b1a3a] text-white') +
          ` fixed inset-y-0 left-0 z-50 -translate-x-full transition-transform duration-300 lg:static lg:z-auto lg:w-64 lg:translate-x-0 ${
            mobileOpen ? 'translate-x-0' : ''
          }`
        }
      >
        <div className="flex items-start justify-between px-6 py-6">
          <div className="min-w-0 flex-1">{logoBlock}</div>
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
            className={`ml-2 shrink-0 rounded-lg p-1.5 transition lg:hidden ${
              isLight ? 'text-ink/60 hover:bg-slate-100' : 'text-white/70 hover:bg-white/10'
            }`}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div onClick={() => setMobileOpen(false)}>{navLinksBlock}</div>

        {footerBlock}
      </aside>

      <main className="flex min-w-0 flex-1 flex-col lg:h-screen lg:overflow-y-auto">
        {isLight ? (
          <div className="relative isolate flex flex-1 flex-col overflow-x-hidden bg-gradient-to-br from-[#bcd4ff] via-[#cddaff] to-[#a9c6ff]">
            <div className="pointer-events-none fixed bottom-0 left-0 right-0 top-0 z-0 lg:left-64">
              <AdminBackground />
            </div>
            <div className="relative z-20">
              <PortalTopbar
                fullName={fullName}
                email={email}
                settingsHref={settingsHref}
                childSwitcher={childSwitcher}
                onMenuClick={() => setMobileOpen(true)}
              />
            </div>
            <div className="relative z-10 flex flex-1 flex-col px-4 py-6 sm:px-6 lg:px-8 lg:py-10">{children}</div>
          </div>
        ) : (
          <>
            <PortalTopbar
              fullName={fullName}
              email={email}
              settingsHref={settingsHref}
              childSwitcher={childSwitcher}
              onMenuClick={() => setMobileOpen(true)}
            />
            <div className="flex flex-1 flex-col overflow-x-hidden px-4 py-6 sm:px-6 lg:px-8 lg:py-10">{children}</div>
          </>
        )}
      </main>
    </div>
  );
}
