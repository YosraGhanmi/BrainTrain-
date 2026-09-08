'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Bell, Check, UserPlus, Receipt, AlertTriangle } from 'lucide-react';
import { markNotificationRead, markAllNotificationsRead } from '@/lib/admin/portal-actions';
import type { AdminNotifications } from '@/lib/admin/notifications';

function timeAgo(date: Date): string {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(date).getTime()) / 1000));
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function NotificationBell({
  pendingParents,
  expenseNotices,
  overduePayments,
  totalCount,
}: AdminNotifications) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="relative"
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setOpen(false);
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifications"
        className="relative flex h-10 w-10 items-center justify-center rounded-full text-ink/70 transition hover:bg-slate-100 hover:text-ink"
      >
        <Bell className="h-5 w-5" />
        {totalCount > 0 ? (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-white">
            {totalCount > 9 ? '9+' : totalCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 z-30 mt-2 w-80 max-w-[85vw] overflow-hidden rounded-2xl border border-ink/10 bg-white shadow-soft">
          <div className="flex items-center justify-between border-b border-ink/10 px-4 py-3">
            <p className="text-sm font-bold text-ink">Notifications</p>
            {expenseNotices.length > 0 ? (
              <form action={markAllNotificationsRead}>
                <button type="submit" className="text-xs font-semibold text-accent transition hover:underline">
                  Mark all read
                </button>
              </form>
            ) : null}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {totalCount === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-stone">You&apos;re all caught up.</p>
            ) : (
              <>
                {pendingParents.length > 0 ? (
                  <div className="border-b border-ink/5">
                    <p className="px-4 pt-3 text-[10px] font-bold uppercase tracking-wide text-stone/70">
                      Pending activations
                    </p>
                    <ul>
                      {pendingParents.map((p) => (
                        <li key={p.id}>
                          <Link
                            href="/admin/parents"
                            onClick={() => setOpen(false)}
                            className="flex items-start gap-3 px-4 py-3 transition hover:bg-slate-50"
                          >
                            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                              <UserPlus className="h-4 w-4" />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-semibold text-ink">{p.fullName}</span>
                              <span className="block truncate text-xs text-stone">wants to activate their account</span>
                              <span className="block text-[11px] text-stone/70">{timeAgo(p.createdAt)}</span>
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {overduePayments.length > 0 ? (
                  <div className="border-b border-ink/5">
                    <p className="px-4 pt-3 text-[10px] font-bold uppercase tracking-wide text-stone/70">
                      Overdue payments
                    </p>
                    <ul>
                      {overduePayments.map((p) => (
                        <li key={p.id}>
                          <Link
                            href="/admin/payments"
                            onClick={() => setOpen(false)}
                            className="flex items-start gap-3 px-4 py-3 transition hover:bg-slate-50"
                          >
                            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-700">
                              <AlertTriangle className="h-4 w-4" />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-semibold text-ink">{p.childName}</span>
                              <span className="block truncate text-xs text-stone">
                                {p.amount.toFixed(2)} {p.currency} — due {new Date(p.dueDate).toLocaleDateString()}
                              </span>
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {expenseNotices.length > 0 ? (
                  <div>
                    <p className="px-4 pt-3 text-[10px] font-bold uppercase tracking-wide text-stone/70">Dispenses</p>
                    <ul>
                      {expenseNotices.map((n) => (
                        <li key={n.id} className="flex items-start gap-3 px-4 py-3 transition hover:bg-slate-50">
                          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent">
                            <Receipt className="h-4 w-4" />
                          </span>
                          <Link
                            href={n.link ?? '/admin/dispenses'}
                            onClick={() => setOpen(false)}
                            className="min-w-0 flex-1"
                          >
                            <span className="block truncate text-sm font-semibold text-ink">{n.title}</span>
                            {n.body ? <span className="block truncate text-xs text-stone">{n.body}</span> : null}
                            <span className="block text-[11px] text-stone/70">{timeAgo(n.createdAt)}</span>
                          </Link>
                          <form action={markNotificationRead.bind(null, n.id)}>
                            <button
                              type="submit"
                              aria-label="Mark as read"
                              title="Mark as read"
                              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-stone transition hover:bg-slate-100 hover:text-ink"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                          </form>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
