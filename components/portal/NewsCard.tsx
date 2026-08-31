'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from '@/i18n/navigation';

export type FeedItemType = 'news' | 'reminder' | 'notification';

export type FeedItem = {
  id: string;
  type: FeedItemType;
  title: string;
  date: string;
  href?: string;
};

const PAGE_SIZE = 5;

const TYPE_STYLES: Record<FeedItemType, string> = {
  news: 'text-accent',
  reminder: 'text-red-600',
  notification: 'text-emerald-600',
};

export default function NewsCard({ items }: { items: FeedItem[] }) {
  const [page, setPage] = useState(0);
  const pageCount = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const visible = items.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  return (
    <div className="flex-1 rounded-3xl border border-ink/10 bg-white p-6 shadow-soft">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-ink">News</h2>
        {items.length > PAGE_SIZE ? (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              aria-label="Previous"
              className="rounded-full p-1 text-stone transition hover:bg-slate-50 disabled:opacity-30"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
              disabled={page >= pageCount - 1}
              aria-label="Next"
              className="rounded-full p-1 text-stone transition hover:bg-slate-50 disabled:opacity-30"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        ) : null}
      </div>

      <div className="mt-4 divide-y divide-ink/5">
        {visible.length === 0 ? (
          <p className="py-3 text-sm text-stone">No news yet.</p>
        ) : (
          visible.map((item) => {
            const row = (
              <div className="flex items-center gap-4 py-3">
                <span className="w-24 shrink-0 text-xs text-stone">
                  {new Date(item.date).toLocaleDateString()}
                </span>
                <p className={`text-sm font-semibold ${TYPE_STYLES[item.type]}`}>{item.title}</p>
              </div>
            );
            return item.href ? (
              <Link key={item.id} href={item.href} className="block transition hover:bg-slate-50">
                {row}
              </Link>
            ) : (
              <div key={item.id}>{row}</div>
            );
          })
        )}
      </div>
    </div>
  );
}
