import { readContent } from '@/lib/content/store';
import { prisma } from '@/lib/db/prisma';
import CoursesManager from '@/components/admin/CoursesManager';
import type { CourseEntry } from '@/lib/content/types';

export const dynamic = 'force-dynamic';

// One pastel per age group, cycling if there are ever more than four.
const AGE_GROUP_PASTELS = ['#a78bfa', '#fdba74', '#7dd3fc', '#86efac', '#f9a8d4', '#fcd34d'];

export default async function AdminCoursesPage() {
  const { courses, ageGroups } = readContent();

  const overrideRules = await prisma.pricingRule.findMany({ where: { courseSlug: { not: null } } });
  const courseOverrides: Record<string, { MONTHLY?: number; QUARTERLY?: number; YEARLY?: number; currency: string }> = {};
  for (const rule of overrideRules) {
    if (!rule.courseSlug) continue;
    const entry = (courseOverrides[rule.courseSlug] ??= { currency: rule.currency });
    entry[rule.planType] = Number(rule.amount);
  }

  const blank: CourseEntry = {
    slug: '',
    title: { en: '', fr: '' },
    icon: 'Bot',
    color: '#3d7fff',
    description: { en: '', fr: '' },
    sessions: 0,
    price: 0,
    ageGroupSlug: ageGroups[0]?.slug ?? '',
  };

  const groupedCourses = ageGroups.map((group, i) => ({
    group,
    color: AGE_GROUP_PASTELS[i % AGE_GROUP_PASTELS.length],
    courses: courses.filter((c) => c.ageGroupSlug === group.slug),
  }));

  return (
    <div>
      <h1 className="text-center font-display text-4xl font-semibold text-ink">Courses</h1>
      <CoursesManager ageGroups={ageGroups} groupedCourses={groupedCourses} blank={blank} courseOverrides={courseOverrides} />
    </div>
  );
}
