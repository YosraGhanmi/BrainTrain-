import { Link } from '@/i18n/navigation';
import { CalendarDays, MapPin, User, CreditCard, MessageSquare } from 'lucide-react';
import { getAgeGroupEntryOrThrow, getCourseEntryOrThrow } from '@/lib/content/lookup';
import type { Prisma } from '@prisma/client';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const STATUS_STYLES: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700',
  ACTIVE: 'bg-emerald-100 text-emerald-700',
  CANCELLED: 'bg-slate-200 text-slate-600',
};

type ChildWithEnrollments = Prisma.ChildGetPayload<{
  include: {
    enrollments: {
      include: {
        courseSession: { include: { teacher: { include: { user: true } } } };
        notes: true;
      };
    };
    badges: true;
  };
}>;

export default function ChildOverview({ child }: { child: ChildWithEnrollments }) {
  const ageGroup = getAgeGroupEntryOrThrow(child.ageGroupSlug);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-ink">{child.fullName}</h1>
          <p className="mt-1 text-sm text-stone">{ageGroup.label.en}</p>
        </div>
        <div className="flex gap-3">
          <Link
            href={`/parent-portal/children/${child.id}/payments`}
            className="flex items-center gap-2 rounded-full border border-ink/15 px-4 py-2 text-sm font-semibold text-ink transition hover:bg-ink hover:text-white"
          >
            <CreditCard className="h-4 w-4" />
            Payments
          </Link>
          <Link
            href="/parent-portal/courses"
            className="rounded-full bg-ink px-4 py-2 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-accent"
          >
            Enroll in a course
          </Link>
        </div>
      </div>

      {child.specialNeeds ? (
        <p className="mt-6 rounded-xl border border-accent/20 bg-accent/5 p-4 text-sm text-ink">
          <span className="font-semibold">Special accommodations: </span>
          {child.specialNeeds}
        </p>
      ) : null}

      <h2 className="mt-10 font-display text-xl font-bold text-ink">Badges</h2>

      {child.badges.length === 0 ? (
        <p className="mt-4 rounded-2xl border border-dashed border-ink/15 bg-white p-6 text-sm text-stone">
          No badges earned yet.
        </p>
      ) : (
        <div className="mt-4 flex flex-wrap gap-3">
          {child.badges.map((badge) => (
            <div
              key={badge.id}
              title={badge.note ?? undefined}
              className="flex items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 shadow-soft"
            >
              {badge.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={badge.imageUrl} alt="" className="h-8 w-8 rounded-full object-cover" />
              ) : (
                <span className="text-xl">{badge.emoji}</span>
              )}
              <div>
                <p className="text-sm font-bold text-amber-900">{badge.title}</p>
                <p className="text-xs text-amber-700">{badge.awardedAt.toDateString()}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <h2 className="mt-10 font-display text-xl font-bold text-ink">Enrolled courses</h2>

      {child.enrollments.length === 0 ? (
        <p className="mt-4 rounded-2xl border border-dashed border-ink/15 bg-white p-8 text-center text-stone">
          Not enrolled in any course yet.
        </p>
      ) : (
        <div className="mt-4 space-y-4">
          {child.enrollments.map((enrollment) => {
            const course = getCourseEntryOrThrow(enrollment.courseSession.courseSlug);
            const session = enrollment.courseSession;
            return (
              <div key={enrollment.id} className="rounded-2xl border border-ink/10 bg-white p-6 shadow-soft">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-display text-lg font-bold text-ink">{course.title.en}</h3>
                    <p className="text-sm text-stone">{session.term}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${STATUS_STYLES[enrollment.status]}`}>
                    {enrollment.status}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-2 text-sm text-stone sm:grid-cols-3">
                  <span className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-accent" />
                    {DAYS[session.dayOfWeek]} · {session.startTime}–{session.endTime}
                  </span>
                  <span className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-accent" />
                    {session.location}
                  </span>
                  <span className="flex items-center gap-2">
                    <User className="h-4 w-4 text-accent" />
                    {session.teacher?.user.fullName ?? 'Teacher not yet assigned'}
                  </span>
                </div>

                {enrollment.notes.length > 0 ? (
                  <div className="mt-5 border-t border-ink/10 pt-4">
                    <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-stone">
                      <MessageSquare className="h-3.5 w-3.5" />
                      Teacher remarks
                    </p>
                    <ul className="mt-2 space-y-2">
                      {enrollment.notes.map((note) => (
                        <li key={note.id} className="rounded-xl bg-slate-50 p-3 text-sm text-ink">
                          <p>{note.content}</p>
                          <p className="mt-1 text-xs text-stone">{note.createdAt.toDateString()}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
