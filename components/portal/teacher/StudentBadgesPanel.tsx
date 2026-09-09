'use client';

import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { BADGE_STICKERS } from '@/lib/badges/stickers';
import type { AppLocale } from '@/i18n/routing';

type Badge = {
  id: string;
  title: string;
  note: string | null;
  emoji: string;
  imageUrl: string | null;
};

export default function StudentBadgesPanel({
  badges,
  awardBadge,
  locale,
  childId,
  courseSessionId,
  returnTo,
}: {
  badges: Badge[];
  awardBadge: (formData: FormData) => Promise<void>;
  locale: AppLocale;
  childId: string;
  courseSessionId: string;
  returnTo: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <h2 className="font-display text-lg font-bold text-ink">Badges</h2>

      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-3">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Award a new badge"
          className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-full border-2 border-dashed border-ink/20 text-ink/50 transition hover:border-ink/40 hover:text-ink"
        >
          <Plus className="h-5 w-5" />
        </button>
        {badges.length === 0 ? (
          <p className="flex items-center text-sm text-stone">No badges awarded yet.</p>
        ) : (
          badges.map((badge) => (
            <div key={badge.id} title={badge.note ?? badge.title} className="flex w-14 shrink-0 flex-col items-center gap-1 text-center">
              {badge.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={badge.imageUrl} alt="" className="h-14 w-14 rounded-full object-cover" />
              ) : (
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-50 text-2xl leading-none">
                  {badge.emoji}
                </span>
              )}
              <span className="line-clamp-1 w-full text-[0.65rem] font-semibold text-ink">{badge.title}</span>
            </div>
          ))
        )}
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4" onClick={() => setOpen(false)}>
          <div
            className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-soft"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-bold text-ink">Award a badge</h3>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="rounded-full p-1 text-stone hover:bg-slate-100">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form action={awardBadge} className="mt-4 space-y-3">
              <input type="hidden" name="locale" value={locale} />
              <input type="hidden" name="childId" value={childId} />
              <input type="hidden" name="courseSessionId" value={courseSessionId} />
              <input type="hidden" name="returnTo" value={returnTo} />

              <div className="flex flex-wrap gap-3">
                {BADGE_STICKERS.map((sticker, i) => (
                  <label key={sticker.url} className="cursor-pointer">
                    <input type="radio" name="imageUrl" value={sticker.url} defaultChecked={i === 0} required className="peer sr-only" />
                    <span className="flex flex-col items-center gap-1 rounded-xl border-2 border-transparent p-1 peer-checked:border-accent">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={sticker.url} alt={sticker.label} className="h-14 w-14 rounded-full object-cover" />
                      <span className="text-[0.65rem] font-semibold text-stone">{sticker.label}</span>
                    </span>
                  </label>
                ))}
              </div>

              <input
                name="title"
                required
                placeholder="Badge title (e.g. Top Builder)"
                className="w-full rounded-xl border border-ink/10 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-accent"
              />
              <input
                name="note"
                placeholder="Note (optional)"
                className="w-full rounded-xl border border-ink/10 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-accent"
              />
              <button
                type="submit"
                className="w-full rounded-full bg-amber-500 px-5 py-2.5 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-amber-600"
              >
                Award badge
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
