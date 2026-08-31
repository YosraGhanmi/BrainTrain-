import Image from 'next/image';
import { prisma } from '@/lib/db/prisma';
import { requireParent } from '@/lib/portal-auth/guard';
import { resolveSelectedChild } from '@/lib/portal-auth/selected-child';
import { listCourseEntriesForAgeGroup } from '@/lib/content/lookup';
import { getIcon } from '@/lib/content/icons';
import CourseIllustration from '@/components/illustrations/CourseIllustration';
import CoursesExplorer from '@/components/portal/CoursesExplorer';
import type { EnrollmentStatus } from '@prisma/client';
import type { AppLocale } from '@/i18n/routing';

export const dynamic = 'force-dynamic';

export default async function ParentCoursesPage({ params }: { params: { locale: AppLocale } }) {
  const parent = await requireParent(params.locale);
  const children = await prisma.child.findMany({
    where: { parentId: parent.parentId },
    orderBy: { createdAt: 'asc' },
  });
  const selected = resolveSelectedChild(children);

  if (!selected) {
    return (
      <p className="rounded-2xl border border-dashed border-ink/15 bg-white p-10 text-center text-stone">
        No children yet — add a child to start enrolling in courses.
      </p>
    );
  }

  const child = await prisma.child.findUnique({
    where: { id: selected.id },
    include: {
      enrollments: {
        where: { status: { in: ['PENDING', 'ACTIVE'] } },
        include: { courseSession: true },
      },
    },
  });
  if (!child) return null;

  const eligibleCourses = listCourseEntriesForAgeGroup(child.ageGroupSlug);

  // If a child has both a PENDING and an ACTIVE session for the same course,
  // ACTIVE is the more relevant status to surface on the catalog card.
  const enrollmentByCourse = new Map<string, EnrollmentStatus>();
  for (const e of child.enrollments) {
    const slug = e.courseSession.courseSlug;
    const current = enrollmentByCourse.get(slug);
    if (!current || (current === 'PENDING' && e.status === 'ACTIVE')) {
      enrollmentByCourse.set(slug, e.status);
    }
  }

  const courses = eligibleCourses.map((course) => ({
    slug: course.slug,
    title: course.title.en,
    sessionsCount: course.sessions,
    status: enrollmentByCourse.get(course.slug) ?? null,
    media: course.image ? (
      <div className="relative h-32 w-full overflow-hidden rounded-2xl">
        <Image
          src={course.image}
          alt={course.title.en}
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
