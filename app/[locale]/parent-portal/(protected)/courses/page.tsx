import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import { requireParent } from '@/lib/portal-auth/guard';
import { resolveSelectedChild } from '@/lib/portal-auth/selected-child';
import { listCourseEntriesForAgeGroup } from '@/lib/content/lookup';
import { readContent } from '@/lib/content/store';
import { isCourseOffered } from '@/lib/content/summer';
import { getIcon } from '@/lib/content/icons';
import { localized } from '@/lib/i18n/format';
import CourseIllustration from '@/components/illustrations/CourseIllustration';
import CoursesExplorer from '@/components/portal/CoursesExplorer';
import { listDbChildren } from '@/lib/db/children';
import { listDbEnrollmentsWithSessionsByChild } from '@/lib/db/read-models';
import type { EnrollmentStatus } from '@/lib/db/enrollments';
import type { AppLocale } from '@/i18n/routing';

export const dynamic = 'force-dynamic';

export default async function ParentCoursesPage(props: { params: Promise<{ locale: AppLocale }> }) {
  const params = await props.params;
  const parent = await requireParent(params.locale);
  const t = await getTranslations({ locale: params.locale, namespace: 'parentPortal' });
  const children = await listDbChildren(parent.parentId);
  const selected = await resolveSelectedChild(children);

  if (!selected) {
    return (
      <p className="rounded-2xl border border-dashed border-ink/15 bg-white p-10 text-center text-stone">
        {t('noChildren')}
      </p>
    );
  }

  const child = children.find((entry) => entry.id === selected.id) ?? null;
  if (!child) return null;
  const enrollments = await listDbEnrollmentsWithSessionsByChild(child.id, ['PENDING', 'ACTIVE']);

  // Summer courses only while the summer school is open, listed first
  const content = (await readContent());
  const eligibleCourses = (await listCourseEntriesForAgeGroup(child.ageGroupSlug))
    .filter((course) => isCourseOffered(course, content))
    .sort((a, b) => Number(Boolean(b.summer)) - Number(Boolean(a.summer)));

  // If a child has both a PENDING and an ACTIVE session for the same course,
  // ACTIVE is the more relevant status to surface on the catalog card.
  const enrollmentByCourse = new Map<string, { status: EnrollmentStatus; enrollmentId: string }>();
  for (const e of enrollments) {
    const slug = e.courseSession.courseSlug;
    const current = enrollmentByCourse.get(slug);
    if (!current || (current.status === 'PENDING' && e.status === 'ACTIVE')) {
      enrollmentByCourse.set(slug, { status: e.status, enrollmentId: e.id });
    }
  }

  const courses = eligibleCourses.map((course) => ({
    slug: course.slug,
    title: localized(course.title, params.locale),
    sessionsCount: course.sessions,
    summer: Boolean(course.summer),
    status: enrollmentByCourse.get(course.slug)?.status ?? null,
    enrollmentId: enrollmentByCourse.get(course.slug)?.enrollmentId ?? null,
    childId: child.id,
    media: course.image ? (
      <div className="relative h-32 w-full overflow-hidden rounded-2xl">
        <Image
          src={course.image}
          alt={localized(course.title, params.locale)}
          fill
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover"
        />
      </div>
    ) : (
      <CourseIllustration icon={getIcon(course.icon)} color={course.color} className="h-32 w-full rounded-2xl" />
    ),
  }));

  return <CoursesExplorer courses={courses} />;
}
