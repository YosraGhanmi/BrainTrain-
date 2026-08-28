import { Link } from '@/i18n/navigation';
import { PlusCircle } from 'lucide-react';
import { prisma } from '@/lib/db/prisma';
import { requireParent } from '@/lib/portal-auth/guard';
import { getAgeGroupEntryOrThrow } from '@/lib/content/lookup';
import type { AppLocale } from '@/i18n/routing';

export const dynamic = 'force-dynamic';

export default async function ParentDashboardPage({ params }: { params: { locale: AppLocale } }) {
  const parent = await requireParent(params.locale);
  const children = await prisma.child.findMany({
    where: { parentId: parent.parentId },
    include: { enrollments: true },
    orderBy: { createdAt: 'asc' },
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-bold text-ink">My children</h1>
        <Link
          href="/parent-portal/children/new"
          className="flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-accent"
        >
          <PlusCircle className="h-4 w-4" />
          Add a child
        </Link>
      </div>

      {children.length === 0 ? (
        <p className="mt-10 rounded-2xl border border-dashed border-ink/15 bg-white p-10 text-center text-stone">
          No children yet — add your first child to start enrolling in courses.
        </p>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {children.map((child) => {
            const ageGroup = getAgeGroupEntryOrThrow(child.ageGroupSlug);
            const activeCount = child.enrollments.filter((e) => e.status !== 'CANCELLED').length;
            return (
              <Link
                key={child.id}
                href={`/parent-portal/children/${child.id}`}
                className="rounded-2xl border border-ink/10 bg-white p-6 shadow-soft transition hover:border-accent/40"
              >
                <h2 className="font-display text-xl font-bold text-ink">{child.fullName}</h2>
                <p className="mt-1 text-sm text-stone">{ageGroup.label.en}</p>
                <p className="mt-4 text-sm font-semibold text-accent">
                  {activeCount} {activeCount === 1 ? 'enrollment' : 'enrollments'}
                </p>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
