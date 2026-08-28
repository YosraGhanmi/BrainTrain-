import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db/prisma';
import { requireParent } from '@/lib/portal-auth/guard';
import { listCourseEntriesForAgeGroup } from '@/lib/content/lookup';
import { enrollChild } from '@/lib/enrollment/actions';
import type { AppLocale } from '@/i18n/routing';

export const dynamic = 'force-dynamic';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const ERROR_MESSAGES: Record<string, string> = {
  plan: 'Please choose a payment plan.',
  session: 'That session could not be found.',
  ineligible: "That course isn't offered for this child's age group.",
  capacity: 'That session is full — please pick another.',
  duplicate: 'This child is already enrolled in that session.',
};

export default async function EnrollPage({
  params,
  searchParams,
}: {
  params: { locale: AppLocale; childId: string };
  searchParams: { error?: string };
}) {
  const parent = await requireParent(params.locale);
  const child = await prisma.child.findUnique({ where: { id: params.childId } });
  if (!child || child.parentId !== parent.parentId) notFound();

  const eligibleCourses = listCourseEntriesForAgeGroup(child.ageGroupSlug);
  const sessions = await prisma.courseSession.findMany({
    where: { courseSlug: { in: eligibleCourses.map((c) => c.slug) } },
    include: { _count: { select: { enrollments: { where: { status: { in: ['PENDING', 'ACTIVE'] } } } } } },
    orderBy: { term: 'desc' },
  });

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-ink">Enroll {child.fullName} in a course</h1>

      {searchParams.error ? (
        <p className="mt-4 text-sm font-semibold text-red-600">
          {ERROR_MESSAGES[searchParams.error] ?? 'Something went wrong — please try again.'}
        </p>
      ) : null}

      {sessions.length === 0 ? (
        <p className="mt-8 rounded-2xl border border-dashed border-ink/15 bg-white p-8 text-center text-stone">
          No sessions are currently scheduled for this age group. Check back soon.
        </p>
      ) : (
        <div className="mt-8 space-y-4">
          {sessions.map((session) => {
            const course = eligibleCourses.find((c) => c.slug === session.courseSlug)!;
            const seatsLeft = session.capacity - session._count.enrollments;
            return (
              <div key={session.id} className="rounded-2xl border border-ink/10 bg-white p-6 shadow-soft">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="font-display text-lg font-bold text-ink">{course.title.en}</h2>
                    <p className="text-sm text-stone">
                      {session.term} · {DAYS[session.dayOfWeek]} {session.startTime}–{session.endTime} · {session.location}
                    </p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-bold ${seatsLeft > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
                    {seatsLeft > 0 ? `${seatsLeft} seats left` : 'Full'}
                  </span>
                </div>

                {seatsLeft > 0 ? (
                  <form action={enrollChild} className="mt-4 flex flex-wrap items-end gap-3">
                    <input type="hidden" name="locale" value={params.locale} />
                    <input type="hidden" name="childId" value={child.id} />
                    <input type="hidden" name="courseSessionId" value={session.id} />
                    <div className="space-y-1">
                      <label className="text-xs font-semibold uppercase tracking-wide text-stone">Payment plan</label>
                      <select name="planType" required className="rounded-xl border border-ink/10 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-accent">
                        <option value="MONTHLY">Monthly</option>
                        <option value="SEASONAL">Seasonal</option>
                        <option value="COURSE">Full course</option>
                      </select>
                    </div>
                    <button type="submit" className="rounded-full bg-ink px-5 py-2.5 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-accent">
                      Enroll
                    </button>
                  </form>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
