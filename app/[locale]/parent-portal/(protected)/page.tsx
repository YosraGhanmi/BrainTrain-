import { Link } from '@/i18n/navigation';
import { PlusCircle } from 'lucide-react';
import { prisma } from '@/lib/db/prisma';
import { requireParent } from '@/lib/portal-auth/guard';
import { resolveSelectedChild } from '@/lib/portal-auth/selected-child';
import { readContent } from '@/lib/content/store';
import { getCourseEntryOrThrow } from '@/lib/content/lookup';
import NewsCard, { type FeedItem } from '@/components/portal/NewsCard';
import StatisticsCard from '@/components/portal/StatisticsCard';
import BadgesCard from '@/components/portal/BadgesCard';
import type { AppLocale } from '@/i18n/routing';

export const dynamic = 'force-dynamic';

export default async function ParentDashboardPage({ params }: { params: { locale: AppLocale } }) {
  const parent = await requireParent(params.locale);
  const children = await prisma.child.findMany({
    where: { parentId: parent.parentId },
    orderBy: { createdAt: 'asc' },
  });
  const selected = resolveSelectedChild(children);
  const { news } = readContent();

  if (!selected) {
    return (
      <div>
        <div className="flex items-center justify-between">
          <h1 className="font-display text-3xl font-bold text-ink">Dashboard</h1>
          <Link
            href="/parent-portal/children/new"
            className="flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-accent"
          >
            <PlusCircle className="h-4 w-4" />
            Add a child
          </Link>
        </div>
        <p className="mt-10 rounded-2xl border border-dashed border-ink/15 bg-white p-10 text-center text-stone">
          No children yet. Add your first child to start enrolling in courses.
        </p>
      </div>
    );
  }

  const child = await prisma.child.findUnique({
    where: { id: selected.id },
    include: {
      badges: { orderBy: { awardedAt: 'desc' } },
      notes: { orderBy: { createdAt: 'desc' }, take: 10 },
      enrollments: {
        where: { status: { in: ['PENDING', 'ACTIVE'] } },
        include: { courseSession: true },
      },
    },
  });
  if (!child) return null;

  const duePayments = await prisma.payment.findMany({
    where: {
      status: { in: ['PENDING', 'OVERDUE'] },
      enrollment: { childId: child.id },
    },
    include: { enrollment: { include: { courseSession: true } } },
    orderBy: { dueDate: 'desc' },
  });

  const enrolledCourseSlugs = new Set(child.enrollments.map((e) => e.courseSession.courseSlug));
  const visibleNews = news.filter(
    (n) =>
      (n.targetAgeGroups.length === 0 || n.targetAgeGroups.includes(child.ageGroupSlug)) &&
      (n.targetCourses.length === 0 || n.targetCourses.some((slug) => enrolledCourseSlugs.has(slug)))
  );

  const feed: FeedItem[] = [
    ...visibleNews.map((n) => ({
      id: `news-${n.id}`,
      type: 'news' as const,
      title: n.title,
      date: n.createdAt,
    })),
    ...duePayments.map((p) => ({
      id: `pay-${p.id}`,
      type: 'reminder' as const,
      title: `Payment due: ${getCourseEntryOrThrow(p.enrollment.courseSession.courseSlug).title.en}`,
      date: p.dueDate.toISOString(),
      href: '/parent-portal/payments',
    })),
    ...child.badges.map((b) => ({
      id: `badge-${b.id}`,
      type: 'notification' as const,
      title: `New badge earned: ${b.title}`,
      date: b.awardedAt.toISOString(),
    })),
    ...child.notes.map((n) => ({
      id: `note-${n.id}`,
      type: 'notification' as const,
      title: 'A teacher added a note. Check it now',
      date: n.createdAt.toISOString(),
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="grid h-full grid-cols-1 gap-6 lg:grid-cols-3 lg:[grid-template-rows:1fr]">
      <div className="flex flex-col gap-6 lg:col-span-2">
        <NewsCard items={feed} />
        <StatisticsCard />
      </div>
      <BadgesCard badges={child.badges} />
    </div>
  );
}
