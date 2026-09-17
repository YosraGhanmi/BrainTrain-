import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { PlusCircle } from 'lucide-react';
import { requireParent } from '@/lib/portal-auth/guard';
import { resolveSelectedChild } from '@/lib/portal-auth/selected-child';
import { readContent } from '@/lib/content/store';
import { getAgeGroupEntryOrThrow, getCourseEntryOrThrow } from '@/lib/content/lookup';
import { localized } from '@/lib/i18n/format';
import NewsCard, { type FeedItem } from '@/components/portal/NewsCard';
import TeacherNotesCard from '@/components/portal/TeacherNotesCard';
import BadgesCard from '@/components/portal/BadgesCard';
import ChildProfileCard from '@/components/portal/ChildProfileCard';
import type { AppLocale } from '@/i18n/routing';
import { listFirebaseBadgesByChild } from '@/lib/firebase/badges';
import { listFirebaseChildren } from '@/lib/firebase/children';
import { listFirebasePaymentsWithRelationsByChild, listFirebaseEnrollmentsWithSessionsByChild, listTeacherNotesForDashboard } from '@/lib/firebase/read-models';

export const dynamic = 'force-dynamic';

export default async function ParentDashboardPage(props: { params: Promise<{ locale: AppLocale }> }) {
  const params = await props.params;
  const parent = await requireParent(params.locale);
  const t = await getTranslations({ locale: params.locale, namespace: 'parentPortal.dashboard' });
  const children = await listFirebaseChildren(parent.parentId);
  const selected = await resolveSelectedChild(children);
  const { news } = readContent();

  if (!selected) {
    return (
      <div>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="font-display text-3xl font-bold text-ink">{t('title')}</h1>
          <Link
            href="/parent-portal/children/new"
            className="flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-accent"
          >
            <PlusCircle className="h-4 w-4" />
            {t('addChild')}
          </Link>
        </div>
        <p className="mt-10 rounded-2xl border border-dashed border-ink/15 bg-white p-10 text-center text-stone">
          {t('noChildrenYet')}
        </p>
      </div>
    );
  }

  const child = children.find((entry) => entry.id === selected.id) ?? null;
  if (!child) return null;
  const [enrollments, badges, notes, duePayments] = await Promise.all([
    listFirebaseEnrollmentsWithSessionsByChild(child.id, ['PENDING', 'ACTIVE']),
    listFirebaseBadgesByChild(child.id),
    listTeacherNotesForDashboard(child.id),
    listFirebasePaymentsWithRelationsByChild(child.id).then((payments) =>
      payments.filter((payment) => ['PENDING', 'OVERDUE'].includes(payment.status) && payment.enrollment),
    ),
  ]);

  const enrolledCourseSlugs = new Set(enrollments.map((e) => e.courseSession.courseSlug));
  const ageGroup = getAgeGroupEntryOrThrow(child.ageGroupSlug);
  const courseTitles = [...enrolledCourseSlugs].map((slug) => localized(getCourseEntryOrThrow(slug).title, params.locale));
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
      title: t('paymentDue', { course: localized(getCourseEntryOrThrow(p.enrollment!.courseSession.courseSlug).title, params.locale) }),
      date: p.dueDate.toISOString(),
      href: '/parent-portal/payments',
    })),
    ...badges.map((b) => ({
      id: `badge-${b.id}`,
      type: 'notification' as const,
      title: t('badgeEarned', { badge: b.title }),
      date: b.awardedAt.toISOString(),
      href: '/parent-portal#badges',
    })),
    ...notes.map((n) => ({
      id: `note-${n.id}`,
      type: 'notification' as const,
      title: t('noteAdded'),
      date: n.createdAt.toISOString(),
      href: '/parent-portal#teacher-notes',
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="grid h-full grid-cols-1 gap-6 lg:grid-cols-3 lg:[grid-template-rows:1fr]">
      <div className="flex flex-col gap-6 lg:col-span-2">
        <NewsCard items={feed} />
        <TeacherNotesCard notes={notes} locale={params.locale} />
      </div>
      <div className="flex flex-col gap-6">
        <ChildProfileCard
          locale={params.locale}
          childId={child.id}
          fullName={child.fullName}
          photoUrl={child.photoUrl}
          photoColor={child.photoColor}
          ageGroupLabel={localized(ageGroup.label, params.locale)}
          courseTitles={courseTitles}
        />
        <div className="flex-1">
          <BadgesCard badges={badges} />
        </div>
      </div>
    </div>
  );
}
