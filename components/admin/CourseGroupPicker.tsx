'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronDown, ChevronRight, Check } from 'lucide-react';

export type CoursePickerGroup = {
  slug: string;
  label: string;
  courses: Array<{ slug: string; title: string }>;
};

// Course dropdown folded by age group: pick an age group to open it, then a
// course. Submits the chosen slug as `name`, like a <select> would.
export default function CourseGroupPicker({
  name,
  groups,
  placeholder = 'Course',
  required = false,
}: {
  name: string;
  groups: CoursePickerGroup[];
  placeholder?: string;
  required?: boolean;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  const selectedGroup = groups.find((g) => g.courses.some((c) => c.slug === value));
  const selected = selectedGroup?.courses.find((c) => c.slug === value);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const escape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', escape);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      {/* Carries the value and the browser's "required" check; kept
          focusable-but-invisible since read-only inputs skip validation */}
      <input
        name={name}
        value={value}
        onChange={() => undefined}
        required={required}
        tabIndex={-1}
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0"
        onInvalid={() => setOpen(true)}
      />

      <button
        type="button"
        onClick={() => {
          setOpen((v) => !v);
          setExpanded(selectedGroup?.slug ?? null);
        }}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="relative flex w-full items-center justify-between gap-2 rounded-xl border border-ink/10 bg-slate-50 px-4 py-2.5 text-left outline-none focus:border-accent"
      >
        <span className={`truncate ${selected ? 'text-ink' : ''}`}>
          {selected ? `${selected.title} (${selectedGroup?.label})` : placeholder}
        </span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-stone transition ${open ? 'rotate-180' : ''}`} />
      </button>

      {open ? (
        <div className="absolute left-0 right-0 z-30 mt-1 max-h-80 overflow-y-auto rounded-xl border border-ink/10 bg-white py-1 shadow-soft">
          {groups.length === 0 ? <p className="px-4 py-2.5 text-sm text-stone">No courses yet.</p> : null}
          {groups.map((group) => {
            const isOpen = expanded === group.slug;
            return (
              <div key={group.slug}>
                <button
                  type="button"
                  onClick={() => setExpanded(isOpen ? null : group.slug)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-2 px-4 py-2.5 text-left text-sm font-bold text-ink transition hover:bg-slate-50"
                >
                  <span className="flex items-center gap-2">
                    <ChevronRight className={`h-4 w-4 text-stone transition ${isOpen ? 'rotate-90' : ''}`} />
                    {group.label}
                  </span>
                  <span className="text-xs font-semibold text-stone">{group.courses.length}</span>
                </button>
                {isOpen ? (
                  <ul role="listbox" className="pb-1">
                    {group.courses.map((course) => {
                      const isSelected = course.slug === value;
                      return (
                        <li key={course.slug}>
                          <button
                            type="button"
                            role="option"
                            aria-selected={isSelected}
                            onClick={() => {
                              setValue(course.slug);
                              setOpen(false);
                            }}
                            className={`flex w-full items-center justify-between gap-2 py-2 pl-10 pr-4 text-left text-sm transition ${
                              isSelected ? 'bg-accent/10 font-semibold text-accent' : 'text-ink hover:bg-slate-50'
                            }`}
                          >
                            {course.title}
                            {isSelected ? <Check className="h-4 w-4 shrink-0" /> : null}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
