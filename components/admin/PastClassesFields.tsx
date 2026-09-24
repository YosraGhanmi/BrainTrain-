'use client';

import { useState } from 'react';
import { Plus, X } from 'lucide-react';

const inputClassName = 'w-full rounded-xl border border-ink/10 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-accent';
const labelClassName = 'mb-1.5 block text-xs font-semibold uppercase tracking-wide text-stone';

// Repeatable "school year + course" rows, submitted as parallel
// pastSchoolYear / pastCourse fields. Course names are free text (with
// current courses suggested) since paper records may name retired courses.
export default function PastClassesFields({ courseSuggestions }: { courseSuggestions: string[] }) {
  const [rows, setRows] = useState<number[]>([]);
  const [nextId, setNextId] = useState(0);

  const addRow = () => {
    setRows((r) => [...r, nextId]);
    setNextId((n) => n + 1);
  };

  return (
    <div>
      <datalist id="past-class-courses">
        {courseSuggestions.map((title) => (
          <option key={title} value={title} />
        ))}
      </datalist>

      {rows.length > 0 ? (
        <div className="mt-4 space-y-3">
          {rows.map((id, index) => (
            <div key={id} className="rounded-xl border border-ink/10 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-ink">Year {index + 1}</p>
                <button
                  type="button"
                  onClick={() => setRows((r) => r.filter((rowId) => rowId !== id))}
                  aria-label="Remove this year"
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-stone transition hover:bg-red-50 hover:text-red-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-[12rem_1fr]">
                <label className="block">
                  <span className={labelClassName}>School year</span>
                  <input name="pastSchoolYear" placeholder="2024-2025" className={inputClassName} />
                </label>
                <label className="block">
                  <span className={labelClassName}>Course</span>
                  <input name="pastCourse" required list="past-class-courses" placeholder="e.g. Robotics Junior" className={inputClassName} />
                </label>
                <label className="block sm:col-span-2">
                  <span className={labelClassName}>Note (optional)</span>
                  <input name="pastNote" placeholder="e.g. Finished the year, won the regional contest" className={inputClassName} />
                </label>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      <button
        type="button"
        onClick={addRow}
        className="mt-4 inline-flex items-center gap-2 rounded-full border border-ink/15 px-4 py-2 text-sm font-semibold text-ink transition hover:border-accent hover:text-accent"
      >
        <Plus className="h-4 w-4" />
        {rows.length === 0 ? 'Add a year' : 'Add another year'}
      </button>
    </div>
  );
}
