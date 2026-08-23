'use client';

import { useRef, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';

type Row = { key: number; label: string; value: string };

export default function StatsEditor({ initial }: { initial: { label: string; value: number }[] }) {
  const nextKey = useRef(initial.length);
  const [rows, setRows] = useState<Row[]>(initial.map((r, i) => ({ key: i, label: r.label, value: String(r.value) })));

  const addRow = () => setRows((r) => [...r, { key: nextKey.current++, label: '', value: '0' }]);
  const removeRow = (key: number) => setRows((r) => r.filter((row) => row.key !== key));

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {rows.map((row) => (
        <div key={row.key} className="relative space-y-2 overflow-hidden rounded-2xl border border-accent/15 bg-accent/[0.04] p-6 text-center">
          <span className="absolute inset-x-0 top-0 h-1 bg-accent" />
          <button
            type="button"
            onClick={() => removeRow(row.key)}
            aria-label="Remove"
            className="absolute right-3 top-4 flex items-center justify-center rounded-lg border border-red-200 p-1.5 text-red-600 transition hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
          </button>

          <input
            name="value"
            type="number"
            min={0}
            defaultValue={row.value}
            placeholder="0"
            className="w-full bg-transparent text-center font-display text-5xl font-extrabold text-[#0f2d81] outline-none sm:text-6xl"
          />
          <input
            name="label"
            defaultValue={row.label}
            placeholder="Label (e.g. Students)"
            className="w-full rounded-xl border border-accent/15 bg-white px-3 py-2 text-center text-sm font-bold text-ink outline-none focus:border-accent/40"
          />
        </div>
      ))}

      <button
        type="button"
        onClick={addRow}
        className="flex min-h-[168px] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-accent/30 text-sm font-semibold text-stone transition hover:border-accent/60 hover:text-accent"
      >
        <Plus className="h-5 w-5" />
        Add stat
      </button>
    </div>
  );
}
