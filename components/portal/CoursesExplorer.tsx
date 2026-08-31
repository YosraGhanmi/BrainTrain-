'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { Search, ChevronDown } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import type { EnrollmentStatus } from '@prisma/client';

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: 'bg-emerald-50 text-emerald-700',
  PENDING: 'bg-amber-50 text-amber-700',
};

export type CourseInfo = {
  slug: string;
  title: string;
  sessionsCount: number;
  status: EnrollmentStatus | null;
  media: ReactNode;
};

type Filter = 'enrolled' | 'all' | 'not-enrolled';

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All courses' },
  { key: 'enrolled', label: 'Enrolled' },
  { key: 'not-enrolled', label: 'Not enrolled' },
];

export default function CoursesExplorer({ courses }: { courses: CourseInfo[] }) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [filterOpen, setFilterOpen] = useState(false);

  const currentFilter = FILTERS.find((f) => f.key === filter)!;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return courses.filter((c) => {
      if (filter === 'enrolled' && !c.status) return false;
      if (filter === 'not-enrolled' && c.status) return false;
      if (q && !c.title.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [courses, filter, query]);

  return (
    <div>
      <div className="flex items-center justify-end gap-3">
        <div
          className="relative"
          onBlur={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node)) setFilterOpen(false);
          }}
        >
          <button
            type="button"
            onClick={() => setFilterOpen((v) => !v)}
            className="flex items-center gap-2 rounded-full border border-ink/15 bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:bg-slate-50"
          >
            {currentFilter.label}
            <ChevronDown className="h-3.5 w-3.5 text-stone" />
          </button>
          {filterOpen ? (
            <ul className="absolute right-0 z-20 mt-2 w-44 overflow-hidden rounded-xl border border-ink/10 bg-white py-1.5 shadow-soft">
              {FILTERS.map((f) => (
                <li key={f.key}>
                  <button
                    type="button"
                    onClick={() => {
                      setFilter(f.key);
                      setFilterOpen(false);
                    }}
                    className={`block w-full px-4 py-2 text-left text-sm font-semibold transition ${
                      f.key === filter ? 'bg-slate-50 text-accent' : 'text-ink hover:bg-slate-50'
                    }`}
                  >
                    {f.label}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search courses..."
            className="w-full rounded-full border border-ink/10 bg-white py-2 pl-9 pr-4 text-sm outline-none focus:border-accent"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="mt-8 rounded-2xl border border-dashed border-ink/15 bg-white p-8 text-center text-stone">
          No courses match.
        </p>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((course) => (
            <Link
              key={course.slug}
              href={`/parent-portal/courses/${course.slug}`}
              className="relative rounded-tl-xl rounded-tr-[2.5rem] rounded-bl-[2.5rem] rounded-br-xl border border-ink/10 bg-white p-6 text-center shadow-sm transition hover:border-accent/40 hover:shadow-md"
            >
              {course.status ? (
                <span
                  className={`absolute -top-3 left-6 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide shadow-sm ${STATUS_STYLES[course.status]}`}
                >
                  {course.status}
                </span>
              ) : null}

              {course.media}

              <h3 className="mt-5 text-lg font-extrabold text-ink">{course.title}</h3>
              <p className="mt-1 text-xs text-stone">{course.sessionsCount} sessions</p>

              <span className="mt-4 block w-full rounded-full bg-[#ff8c42] px-4 py-2 text-sm font-bold text-white transition group-hover:opacity-90">
                {course.status ? 'View sessions' : 'Enroll'}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
