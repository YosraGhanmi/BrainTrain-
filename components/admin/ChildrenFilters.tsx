'use client';

import { useEffect, useRef, useState, useTransition, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { BookX, ClipboardList, Layers, Loader2, School, Search, Wallet, X } from 'lucide-react';
import FilterMenu, { type FilterMenuOption } from '@/components/admin/FilterMenu';
import { filtersToQuery, hasActiveFilters, type ChildrenFilters as Filters } from '@/lib/children/list';

type ToggleKey = 'noCourse' | 'overdue' | 'incomplete';

// Each quick filter has its own color once on, so a glance at the bar says
// what the list is showing
const TOGGLES: { key: ToggleKey; label: string; icon: ReactNode; idle: string; on: string; badgeOn: string }[] = [
  {
    key: 'noCourse',
    label: 'No course',
    icon: <BookX />,
    idle: 'text-slate-500',
    on: 'border-slate-300 bg-slate-100 text-slate-800',
    badgeOn: 'bg-slate-800 text-white',
  },
  {
    key: 'overdue',
    label: 'Payment overdue',
    icon: <Wallet />,
    idle: 'text-rose-500',
    on: 'border-rose-200 bg-rose-50 text-rose-700',
    badgeOn: 'bg-rose-600 text-white',
  },
  {
    key: 'incomplete',
    label: 'To complete',
    icon: <ClipboardList />,
    idle: 'text-amber-500',
    on: 'border-amber-200 bg-amber-50 text-amber-800',
    badgeOn: 'bg-amber-500 text-white',
  },
];

// Search and filters of the Children page. They live in the URL, so the
// list is filtered on the server and a filtered view can be shared or
// exported as is.
export default function ChildrenFilters({
  filters,
  ageGroups,
  schools,
  counts,
  shown,
  total,
}: {
  filters: Filters;
  ageGroups: FilterMenuOption[];
  schools: FilterMenuOption[];
  // How many children each quick filter would show
  counts: Record<ToggleKey, number>;
  shown: number;
  total: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const [q, setQ] = useState(filters.q);
  const searchRef = useRef<HTMLInputElement>(null);
  // The search last sent to the URL, and the pending "search as you type"
  // timer, which any other change cancels so it can't undo that change
  const appliedQ = useRef(filters.q);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const apply = (next: Filters) => {
    clearTimeout(timer.current);
    appliedQ.current = next.q;
    const query = filtersToQuery(next);
    startTransition(() => router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false }));
  };
  const set = <K extends keyof Filters>(key: K, value: Filters[K]) => apply({ ...filters, q, [key]: value });

  // Search as you type, once typing pauses
  useEffect(() => {
    if (q === appliedQ.current) return;
    timer.current = setTimeout(() => apply({ ...filters, q }), 300);
    return () => clearTimeout(timer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  // "/" jumps to the search box, as in most admin tools
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (e.key !== '/' || e.metaKey || e.ctrlKey || target.closest('input, textarea, select, [contenteditable]')) return;
      e.preventDefault();
      searchRef.current?.focus();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const active = hasActiveFilters(filters);

  return (
    <div className="rounded-2xl border border-white/70 bg-white/90 p-2.5 shadow-soft backdrop-blur">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full sm:w-64 lg:w-72">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone" />
          <input
            ref={searchRef}
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Name or phone"
            aria-label="Search by name or phone"
            className="h-9 w-full rounded-full border border-transparent bg-slate-100/80 pl-10 pr-10 text-sm text-ink outline-none transition placeholder:text-stone/80 focus:border-accent/40 focus:bg-white focus:ring-4 focus:ring-accent/10 [&::-webkit-search-cancel-button]:hidden"
          />
          <span className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center">
            {pending ? (
              <Loader2 className="h-4 w-4 animate-spin text-stone" />
            ) : q ? (
              <button
                type="button"
                onClick={() => {
                  setQ('');
                  apply({ ...filters, q: '' });
                }}
                aria-label="Clear search"
                className="rounded-full p-0.5 text-stone transition hover:bg-slate-200 hover:text-ink"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            ) : (
              <kbd className="hidden rounded-md border border-ink/10 bg-white px-1.5 font-sans text-[0.65rem] font-semibold text-stone sm:block">/</kbd>
            )}
          </span>
        </div>

        <span aria-hidden className="mx-1 hidden h-6 w-px bg-ink/10 sm:block" />

        <FilterMenu
          label="Age group"
          icon={<Layers />}
          value={filters.group}
          options={ageGroups}
          allLabel="All age groups"
          onChange={(v) => set('group', v)}
        />
        <FilterMenu label="School" icon={<School />} value={filters.school} options={schools} allLabel="All schools" onChange={(v) => set('school', v)} />

        {TOGGLES.map((t) => {
          const on = filters[t.key];
          return (
            <button
              key={t.key}
              type="button"
              aria-pressed={on}
              onClick={() => set(t.key, !on)}
              className={`flex h-9 items-center gap-2 rounded-full border pl-3 pr-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 ${
                on ? t.on : 'border-ink/10 bg-white text-ink hover:border-ink/20 hover:bg-slate-50'
              }`}
            >
              <span className={`[&>svg]:h-4 [&>svg]:w-4 ${on ? '' : t.idle}`}>{t.icon}</span>
              {t.label}
              <span
                className={`min-w-[1.375rem] rounded-full px-1.5 py-0.5 text-center text-[0.7rem] font-bold tabular-nums ${
                  on ? t.badgeOn : 'bg-slate-100 text-stone'
                }`}
              >
                {counts[t.key]}
              </span>
            </button>
          );
        })}

        <div className="ml-auto flex items-center gap-3 pl-2 pr-1.5">
          <p className="whitespace-nowrap text-sm text-stone" aria-live="polite">
            {active ? (
              <>
                <span className="font-semibold text-ink">{shown}</span> of {total}
              </>
            ) : (
              <>
                <span className="font-semibold text-ink">{total}</span> {total === 1 ? 'child' : 'children'}
              </>
            )}
          </p>
          {active ? (
            <button
              type="button"
              onClick={() => {
                setQ('');
                apply({ q: '', group: '', school: '', noCourse: false, overdue: false, incomplete: false });
              }}
              className="whitespace-nowrap text-sm font-semibold text-accent transition hover:text-accent2 hover:underline"
            >
              Clear all
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
