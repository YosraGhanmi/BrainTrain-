'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import AdminBackground from '@/components/admin/AdminBackground';
import NotificationBell from '@/components/admin/NotificationBell';
import type { AdminNotifications } from '@/lib/admin/notifications';

export default function AdminShell({
  sidebar,
  notifications,
  children,
}: {
  sidebar: React.ReactNode;
  notifications: AdminNotifications;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 text-ink">
      {open ? (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      ) : null}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-screen w-72 max-w-[85vw] -translate-x-full flex-col overflow-y-auto border-r border-ink/10 bg-white px-4 py-6 transition-transform duration-300 lg:static lg:z-auto lg:w-64 lg:shrink-0 lg:translate-x-0 ${
          open ? 'translate-x-0' : ''
        }`}
      >
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Close menu"
          className="absolute right-3 top-3 rounded-lg p-1.5 text-ink/60 transition hover:bg-slate-100 lg:hidden"
        >
          <X className="h-5 w-5" />
        </button>
        {sidebar}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <div className="relative z-20 flex items-center justify-between gap-3 border-b border-ink/10 bg-white px-4 py-3">
          <div className="flex items-center gap-3 lg:hidden">
            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-label="Open menu"
              className="rounded-lg p-2 text-ink transition hover:bg-slate-100"
            >
              <Menu className="h-5 w-5" />
            </button>
            <span className="text-sm font-semibold uppercase tracking-wide text-ink/70">Menu</span>
          </div>
          <div className="hidden lg:block" />
          <NotificationBell {...notifications} />
        </div>

        <main className="relative isolate flex-1 overflow-y-auto overflow-x-hidden bg-gradient-to-br from-[#bcd4ff] via-[#cddaff] to-[#a9c6ff] px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
          <div className="pointer-events-none fixed bottom-0 left-0 right-0 top-0 z-0 lg:left-64">
            <AdminBackground />
          </div>
          <div className="relative z-10">{children}</div>
        </main>
      </div>
    </div>
  );
}
