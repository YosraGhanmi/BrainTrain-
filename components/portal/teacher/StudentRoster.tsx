'use client';

import { useMemo, useState } from 'react';
import { Search, LayoutGrid, List, Users, CheckCircle2, Clock3, Award } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

export type RosterStudent = {
  childId: string;
  fullName: string;
  photoUrl: string | null;
  photoColor: string | null;
  age: number;
  status: 'PENDING' | 'ACTIVE';
  progressPercent: number;
  badges: { id: string; emoji: string; imageUrl: string | null; title: string }[];
};

const STATUS_STYLES: Record<RosterStudent['status'], string> = {
  ACTIVE: 'bg-emerald-100 text-emerald-700',
  PENDING: 'bg-amber-100 text-amber-700',
};

function initials(fullName: string): string {
  return fullName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

function ProgressRing({ percent, color, size = 44, stroke = 4 }: { percent: number; color: string; size?: number; stroke?: number }) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.min(100, Math.max(0, percent)) / 100);
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e8eaf0" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-[stroke-dashoffset] duration-700 ease-out"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[0.6rem] font-bold text-ink">{percent}%</span>
    </div>
  );
}

function Avatar({ student, courseColor, size = 56 }: { student: RosterStudent; courseColor: string; size?: number }) {
  return student.photoUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={student.photoUrl}
      alt=""
      className="shrink-0 rounded-full object-cover"
      style={{ width: size, height: size }}
    />
  ) : (
    <span
      className="flex shrink-0 items-center justify-center rounded-full font-bold text-white"
      style={{ width: size, height: size, fontSize: size * 0.32, backgroundColor: student.photoColor ?? courseColor }}
    >
      {initials(student.fullName)}
    </span>
  );
}

function BadgeRow({ badges }: { badges: RosterStudent['badges'] }) {
  const t = useTranslations('teacherPortal.roster');
  if (badges.length === 0) return <p className="text-xs text-stone/60">{t('noBadgesYet')}</p>;
  const visible = badges.slice(0, 3);
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex -space-x-1.5">
        {visible.map((badge) => (
          <span
            key={badge.id}
            title={badge.title}
            className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-amber-50 text-xs"
          >
            {badge.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={badge.imageUrl} alt="" className="h-full w-full rounded-full object-cover" />
            ) : (
              badge.emoji
            )}
          </span>
        ))}
      </div>
      <span className="text-xs font-semibold text-stone">{t('badgeCount', { count: badges.length })}</span>
    </div>
  );
}

export default function StudentRoster({
  sessionId,
  students,
  courseColor,
}: {
  sessionId: string;
  students: RosterStudent[];
  courseColor: string;
}) {
  const t = useTranslations('teacherPortal.roster');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'PENDING'>('ALL');
  const [sortBy, setSortBy] = useState<'NAME' | 'PROGRESS' | 'BADGES'>('NAME');
  const [view, setView] = useState<'grid' | 'list'>('grid');

  const stats = useMemo(() => {
    const active = students.filter((s) => s.status === 'ACTIVE').length;
    const pending = students.filter((s) => s.status === 'PENDING').length;
    const avgProgress =
      students.length > 0 ? Math.round(students.reduce((sum, s) => sum + s.progressPercent, 0) / students.length) : 0;
    return { total: students.length, active, pending, avgProgress };
  }, [students]);

  const visibleStudents = useMemo(() => {
    let list = students;
    if (statusFilter !== 'ALL') list = list.filter((s) => s.status === statusFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((s) => s.fullName.toLowerCase().includes(q));
    }
    return [...list].sort((a, b) => {
      if (sortBy === 'PROGRESS') return b.progressPercent - a.progressPercent;
      if (sortBy === 'BADGES') return b.badges.length - a.badges.length;
      return a.fullName.localeCompare(b.fullName);
    });
  }, [students, search, statusFilter, sortBy]);

  return (
    <div>
      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="flex items-center gap-3 rounded-2xl border border-ink/5 bg-white p-4 shadow-soft">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent2/10">
            <Users className="h-5 w-5 text-accent2" />
          </span>
          <div>
            <p className="font-display text-xl font-extrabold text-ink">{stats.total}</p>
            <p className="text-xs font-semibold text-stone">{t('students')}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-ink/5 bg-white p-4 shadow-soft">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          </span>
          <div>
            <p className="font-display text-xl font-extrabold text-ink">{stats.active}</p>
            <p className="text-xs font-semibold text-stone">{t('active')}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-ink/5 bg-white p-4 shadow-soft">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100">
            <Clock3 className="h-5 w-5 text-amber-600" />
          </span>
          <div>
            <p className="font-display text-xl font-extrabold text-ink">{stats.pending}</p>
            <p className="text-xs font-semibold text-stone">{t('pending')}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-ink/5 bg-white p-4 shadow-soft">
          <ProgressRing percent={stats.avgProgress} color={courseColor} size={40} stroke={4} />
          <div>
            <p className="font-display text-xl font-extrabold text-ink">{stats.avgProgress}%</p>
            <p className="text-xs font-semibold text-stone">{t('avgProgress')}</p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone/50" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className="w-full rounded-full border border-ink/10 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-accent"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
          className="rounded-full border border-ink/10 bg-white px-4 py-2.5 text-sm font-semibold text-ink outline-none focus:border-accent"
        >
          <option value="ALL">{t('allStatus')}</option>
          <option value="ACTIVE">{t('active')}</option>
          <option value="PENDING">{t('pending')}</option>
        </select>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
          className="rounded-full border border-ink/10 bg-white px-4 py-2.5 text-sm font-semibold text-ink outline-none focus:border-accent"
        >
          <option value="NAME">{t('sortName')}</option>
          <option value="PROGRESS">{t('sortProgress')}</option>
          <option value="BADGES">{t('sortBadges')}</option>
        </select>

        <div className="flex items-center gap-1 rounded-full border border-ink/10 bg-white p-1">
          <button
            type="button"
            onClick={() => setView('grid')}
            aria-label={t('gridView')}
            className={`flex h-8 w-8 items-center justify-center rounded-full transition ${
              view === 'grid' ? 'bg-accent text-white' : 'text-stone/60 hover:bg-slate-100'
            }`}
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setView('list')}
            aria-label={t('listView')}
            className={`flex h-8 w-8 items-center justify-center rounded-full transition ${
              view === 'list' ? 'bg-accent text-white' : 'text-stone/60 hover:bg-slate-100'
            }`}
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {visibleStudents.length === 0 ? (
        <p className="mt-8 rounded-2xl border border-dashed border-ink/15 bg-white p-8 text-center text-stone">
          {t('noMatch')}
        </p>
      ) : view === 'grid' ? (
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {visibleStudents.map((student) => (
            <Link
              key={student.childId}
              href={`/teacher/sessions/${sessionId}/students/${student.childId}`}
              className="rounded-2xl border border-ink/5 bg-white p-4 shadow-soft transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-center gap-3">
                <Avatar student={student} courseColor={courseColor} size={48} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-sm font-bold text-ink">{student.fullName}</p>
                  <p className="text-xs text-stone">{t('age', { age: student.age })}</p>
                  <span className={`mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.65rem] font-bold ${STATUS_STYLES[student.status]}`}>
                    <span className="h-1.5 w-1.5 rounded-full bg-current" />
                    {t(student.status === 'ACTIVE' ? 'active' : 'pending')}
                  </span>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between gap-2 border-t border-ink/5 pt-3">
                <BadgeRow badges={student.badges} />
                <div className="flex flex-col items-center gap-0.5">
                  <ProgressRing percent={student.progressPercent} color={courseColor} />
                  <span className="text-[0.6rem] font-semibold text-stone">{t('progress')}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="mt-5 space-y-2">
          {visibleStudents.map((student) => (
            <Link
              key={student.childId}
              href={`/teacher/sessions/${sessionId}/students/${student.childId}`}
              className="flex items-center gap-4 rounded-2xl border border-ink/5 bg-white p-3 shadow-soft transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <Avatar student={student} courseColor={courseColor} size={44} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-display text-sm font-bold text-ink">{student.fullName}</p>
                <p className="text-xs text-stone">{t('age', { age: student.age })}</p>
              </div>
              <span className={`shrink-0 rounded-full px-2 py-0.5 text-[0.65rem] font-bold ${STATUS_STYLES[student.status]}`}>
                {t(student.status === 'ACTIVE' ? 'active' : 'pending')}
              </span>
              <div className="hidden shrink-0 items-center gap-1.5 sm:flex">
                <Award className="h-4 w-4 text-amber-500" />
                <span className="text-xs font-semibold text-stone">{student.badges.length}</span>
              </div>
              <ProgressRing percent={student.progressPercent} color={courseColor} size={36} stroke={3} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
