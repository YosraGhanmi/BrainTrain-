import { MapPin } from 'lucide-react';
import { prisma } from '@/lib/db/prisma';
import { requireParent } from '@/lib/portal-auth/guard';
import { resolveSelectedChild } from '@/lib/portal-auth/selected-child';
import { getCourseEntryOrThrow } from '@/lib/content/lookup';
import type { AppLocale } from '@/i18n/routing';

export const dynamic = 'force-dynamic';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default async function ParentSchedulePage({ params }: { params: { locale: AppLocale } }) {
  const parent = await requireParent(params.locale);
  const children = await prisma.child.findMany({
    where: { parentId: parent.parentId },
    orderBy: { createdAt: 'asc' },
  });
  const selected = resolveSelectedChild(children);

  if (!selected) {
    return (
      <p className="rounded-2xl border border-dashed border-ink/15 bg-white p-10 text-center text-stone">
        No children yet. Add a child to start enrolling in courses.
      </p>
    );
  }

  const child = await prisma.child.findUnique({
    where: { id: selected.id },
    include: {
      enrollments: {
        where: { status: 'ACTIVE' },
        include: { courseSession: true },
      },
    },
  });
  if (!child) return null;

  const byDay = DAYS.map((_, dayOfWeek) =>
    child.enrollments
      .filter((e) => e.courseSession.dayOfWeek === dayOfWeek)
      .sort((a, b) => a.courseSession.startTime.localeCompare(b.courseSession.startTime))
  );

  const hasAny = byDay.some((day) => day.length > 0);

  return (
    <div>
      {!hasAny ? (
        <p className="mt-10 rounded-2xl border border-dashed border-ink/15 bg-white p-10 text-center text-stone">
          No active sessions scheduled yet.
        </p>
      ) : (
        <div className="mt-8 space-y-6">
          {DAYS.map((day, dayOfWeek) =>
            byDay[dayOfWeek].length === 0 ? null : (
              <section key={day}>
                <h2 className="font-display text-sm font-bold uppercase tracking-wide text-stone">{day}</h2>
                <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {byDay[dayOfWeek].map((enrollment) => {
                    const course = getCourseEntryOrThrow(enrollment.courseSession.courseSlug);
                    return (
                      <div key={enrollment.id} className="rounded-2xl border border-ink/10 bg-white p-6 shadow-soft">
                        <h3 className="font-display text-base font-bold text-ink">{course.title.en}</h3>
                        <div className="mt-4 space-y-1.5 text-sm text-stone">
                          <span className="font-semibold text-accent">
                            {enrollment.courseSession.startTime}–{enrollment.courseSession.endTime}
                          </span>
                          <span className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-accent" />
                            {enrollment.courseSession.location}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )
          )}
        </div>
      )}
    </div>
  );
}
