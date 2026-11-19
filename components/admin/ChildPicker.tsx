'use client';

import { useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import { nameTokens } from '@/lib/children/duplicates';

export type ChildPickerOption = { id: string; fullName: string; detail: string };

// Search a child by name and submit their id in a hidden field
export default function ChildPicker({
  name,
  options,
  placeholder = 'Search a child by name',
  inputClassName,
  required = false,
}: {
  name: string;
  options: ChildPickerOption[];
  placeholder?: string;
  inputClassName: string;
  required?: boolean;
}) {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<ChildPickerOption | null>(null);

  const matches = useMemo(() => {
    const words = nameTokens(query);
    if (words.length === 0) return [];
    return options
      .filter((o) => {
        const tokens = nameTokens(o.fullName);
        return words.every((w) => tokens.some((t) => t.startsWith(w)));
      })
      .slice(0, 8);
  }, [options, query]);

  if (selected) {
    return (
      <div className={`${inputClassName} flex items-center justify-between gap-3`}>
        <input type="hidden" name={name} value={selected.id} />
        <span className="min-w-0 truncate">
          <span className="font-semibold text-ink">{selected.fullName}</span>
          {selected.detail ? <span className="text-stone"> · {selected.detail}</span> : null}
        </span>
        <button
          type="button"
          onClick={() => setSelected(null)}
          aria-label="Choose another child"
          className="rounded-full p-1 text-stone transition hover:bg-slate-200 hover:text-ink"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone" />
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        // Keeps the form from submitting with nothing picked when required
        required={required}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            if (matches.length === 1) setSelected(matches[0]);
          }
        }}
        className={`${inputClassName} pl-10`}
      />
      {query && (
        <ul className="absolute z-20 mt-1 max-h-72 w-full overflow-auto rounded-xl border border-ink/10 bg-white py-1 shadow-soft">
          {matches.length === 0 ? (
            <li className="px-4 py-2 text-sm text-stone">No child found</li>
          ) : (
            matches.map((o) => (
              <li key={o.id}>
                <button
                  type="button"
                  onClick={() => setSelected(o)}
                  className="block w-full px-4 py-2 text-left text-sm transition hover:bg-accent/5 focus:bg-accent/5 focus:outline-none"
                >
                  <span className="font-semibold text-ink">{o.fullName}</span>
                  {o.detail ? <span className="text-stone"> · {o.detail}</span> : null}
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
