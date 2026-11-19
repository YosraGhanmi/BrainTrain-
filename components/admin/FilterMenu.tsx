'use client';

import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { Check, ChevronDown, Search, X } from 'lucide-react';
import { nameTokens } from '@/lib/children/duplicates';

export type FilterMenuOption = { value: string; label: string; count?: number };

// A filter as a pill: "Age group" when unset, "Age group: 6-9 years" once
// picked, with a menu of options (and a search box when the list is long)
export default function FilterMenu({
  label,
  icon,
  value,
  options,
  onChange,
  allLabel,
}: {
  label: string;
  icon: ReactNode;
  value: string;
  options: FilterMenuOption[];
  onChange: (value: string) => void;
  // First entry of the menu, which clears the filter
  allLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const root = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const selected = options.find((o) => o.value === value);
  const searchable = options.length > 8;

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const words = nameTokens(query);
  const shown = words.length
    ? options.filter((o) => {
        const tokens = nameTokens(o.label);
        return words.every((w) => tokens.some((t) => t.startsWith(w)));
      })
    : options;

  const pick = (next: string) => {
    onChange(next);
    setOpen(false);
    setQuery('');
  };

  return (
    <div ref={root} className="relative">
      <div
        className={`flex h-9 items-center rounded-full border text-sm transition ${
          selected ? 'border-accent/30 bg-accent/10 text-accent' : 'border-ink/10 bg-white text-ink hover:border-ink/20 hover:bg-slate-50'
        }`}
      >
        <button
          type="button"
          aria-haspopup="true"
          aria-expanded={open}
          aria-controls={menuId}
          onClick={() => setOpen((o) => !o)}
          className={`flex h-full items-center gap-2 rounded-full pl-3.5 font-semibold outline-none focus-visible:ring-2 focus-visible:ring-accent/40 ${selected ? 'pr-1.5' : 'pr-3'}`}
        >
          <span className={`[&>svg]:h-4 [&>svg]:w-4 ${selected ? 'text-accent' : 'text-stone'}`}>{icon}</span>
          <span className="whitespace-nowrap">
            {label}
            {selected ? <span className="font-medium">: {selected.label}</span> : null}
          </span>
          {selected ? null : <ChevronDown className={`h-4 w-4 text-stone transition-transform ${open ? 'rotate-180' : ''}`} />}
        </button>
        {selected ? (
          <button
            type="button"
            onClick={() => pick('')}
            aria-label={`Clear ${label.toLowerCase()} filter`}
            className="mr-1.5 flex h-6 w-6 items-center justify-center rounded-full text-accent transition hover:bg-accent/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </div>

      {open ? (
        <div
          id={menuId}
          className="absolute left-0 z-30 mt-2 w-64 overflow-hidden rounded-2xl border border-ink/10 bg-white p-1.5 shadow-[0_18px_48px_-12px_rgba(15,23,42,0.25)]"
        >
          {searchable ? (
            <div className="relative mb-1.5">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-stone" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={`Find ${label.toLowerCase()}`}
                aria-label={`Find ${label.toLowerCase()}`}
                className="h-9 w-full rounded-xl bg-slate-50 pl-8 pr-3 text-sm outline-none focus:ring-2 focus:ring-accent/30"
              />
            </div>
          ) : null}
          <div className="max-h-72 overflow-y-auto">
            {[{ value: '', label: allLabel } as FilterMenuOption, ...shown].map((o) => {
              const active = o.value === value;
              return (
                <button
                  key={o.value || '__all'}
                  type="button"
                  aria-pressed={active}
                  onClick={() => pick(o.value)}
                  className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 ${
                    active ? 'bg-accent/10 font-semibold text-accent' : 'text-ink hover:bg-slate-50'
                  }`}
                >
                  <span className="min-w-0 flex-1 truncate">{o.label}</span>
                  {o.count !== undefined ? <span className="text-xs tabular-nums text-stone">{o.count}</span> : null}
                  <Check className={`h-4 w-4 shrink-0 ${active ? 'opacity-100' : 'opacity-0'}`} />
                </button>
              );
            })}
            {shown.length === 0 ? <p className="px-3 py-2 text-sm text-stone">No match</p> : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
