'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireAdminOnly } from '@/lib/admin/guard';
import { readContent, writeContent } from '@/lib/content/store';
import { summerTerm } from '@/lib/content/summer';
import { SHEET_OUTCOME, SHEET_SKILLS, SUMMER_SHEET } from '@/lib/content/summer-sheet';
import { sessionsConflict } from '@/lib/scheduling/slots';
import {
  createDbCourseSession,
  deleteDbCourseSession,
  getDbCourseSession,
  listDbCourseSessions,
  listDbCourseSessionsByTeacher,
  updateDbCourseSession,
} from '@/lib/db/sessions';
import { upsertDbPricingRule } from '@/lib/db/pricing';
import type { CourseEntry, LocalizedString } from '@/lib/content/types';

const PAGE = '/admin/summer-school';

function field(formData: FormData, name: string): string {
  return String(formData.get(name) ?? '').trim();
}

function localizedField(formData: FormData, name: string): LocalizedString {
  return { en: field(formData, `${name}_en`), fr: field(formData, `${name}_fr`) };
}

const TIME = /^\d{2}:\d{2}$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

// Summer courses show up on the public site and in the parent portal, so
// every change here invalidates both
function revalidateSummer(): void {
  revalidatePath('/[locale]', 'layout');
  revalidatePath(PAGE);
}

// Summer groups carry the season dates as their term; keep them in step
async function syncSummerTerms(): Promise<void> {
  const term = summerTerm((await readContent()).summerSchool);
  const sessions = await listDbCourseSessions();
  await Promise.all(sessions.filter((s) => s.summer && s.term !== term).map((s) => updateDbCourseSession(s.id, { term })));
}

export async function updateSummerSettings(formData: FormData): Promise<void> {
  await requireAdminOnly();
  const startDate = field(formData, 'startDate');
  const endDate = field(formData, 'endDate');
  const discount = Number(formData.get('familyDiscountPercent'));
  if (
    !ISO_DATE.test(startDate) ||
    !ISO_DATE.test(endDate) ||
    endDate < startDate ||
    !Number.isFinite(discount) ||
    discount < 0 ||
    discount > 100
  ) {
    redirect(`${PAGE}?error=settings`);
  }

  const content = (await readContent());
  content.summerSchool = {
    ...content.summerSchool,
    enabled: field(formData, 'enabled') === 'on',
    startDate,
    endDate,
    familyDiscountPercent: discount,
    intro: localizedField(formData, 'intro'),
    closingNote: localizedField(formData, 'closingNote'),
  };
  await writeContent(content);
  await syncSummerTerms();

  revalidateSummer();
  redirect(`${PAGE}?saved=1`);
}

export async function setSummerOpen(enabled: boolean): Promise<void> {
  await requireAdminOnly();
  const content = (await readContent());
  content.summerSchool = { ...content.summerSchool, enabled };
  await writeContent(content);
  revalidateSummer();
  redirect(`${PAGE}?saved=1`);
}

// Add or edit one summer group: its own name, the weekdays it meets on, one
// time range, seats and teacher
export async function upsertSummerGroup(formData: FormData): Promise<void> {
  await requireAdminOnly();
  const id = field(formData, 'id');
  const courseSlug = field(formData, 'courseSlug');
  const label = field(formData, 'label');
  const teacherId = field(formData, 'teacherId');
  const location = field(formData, 'location');
  const startTime = field(formData, 'startTime');
  const endTime = field(formData, 'endTime');
  const capacity = Math.round(Number(formData.get('capacity')));
  const days = [...new Set(formData.getAll('days').map(Number))]
    .filter((d) => Number.isInteger(d) && d >= 0 && d <= 6)
    .sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7));

  const content = (await readContent());
  const course = content.courses.find((c) => c.slug === courseSlug && c.summer);
  if (!course || !label || days.length === 0 || !TIME.test(startTime) || !TIME.test(endTime) || endTime <= startTime || !(capacity > 0)) {
    redirect(`${PAGE}?error=group`);
  }

  const data = {
    courseSlug,
    teacherId: teacherId || null,
    label,
    dayOfWeek: days[0],
    extraDays: days.slice(1),
    summer: true,
    startTime,
    endTime,
    location,
    capacity,
    term: summerTerm(content.summerSchool),
  };

  if (teacherId) {
    const others = (await listDbCourseSessionsByTeacher(teacherId)).filter((s) => s.id !== id);
    if (others.some((s) => sessionsConflict(data, s))) redirect(`${PAGE}?error=teacherConflict`);
  }

  if (id) {
    const existing = await getDbCourseSession(id);
    if (!existing?.summer) redirect(`${PAGE}?error=group`);
    await updateDbCourseSession(id, data);
  } else {
    await createDbCourseSession(data);
  }

  revalidateSummer();
  redirect(`${PAGE}?saved=1`);
}

export async function deleteSummerGroup(id: string): Promise<void> {
  await requireAdminOnly();
  const session = await getDbCourseSession(id);
  if (session?.summer) await deleteDbCourseSession(id);
  revalidateSummer();
  redirect(`${PAGE}?saved=1`);
}

// Loads the summer programme sheet: its courses, Monthly / Full season
// prices and groups. Courses that already exist are left alone, so this
// never overwrites the admin's edits.
export async function loadSummerSheet(): Promise<void> {
  await requireAdminOnly();
  const content = (await readContent());
  const term = summerTerm(content.summerSchool);
  const capacity = content.classFormat.maxGroupSize;

  for (const sheetGroup of SUMMER_SHEET) {
    const ageGroup = content.ageGroups.find(
      (g) => g.minAge !== null && g.maxAge !== null && g.minAge <= sheetGroup.sampleAge && sheetGroup.sampleAge <= g.maxAge,
    );
    if (!ageGroup) continue;

    for (const sheetCourse of sheetGroup.courses) {
      const slug = `summer-${sheetCourse.key}-${ageGroup.slug}`;
      if (content.courses.some((c) => c.slug === slug)) continue;

      const course: CourseEntry = {
        slug,
        title: sheetCourse.title,
        description: sheetCourse.description,
        icon: sheetCourse.icon,
        color: sheetCourse.color,
        sessions: sheetCourse.sessions,
        sessionHours: sheetCourse.sessionHours,
        price: 0,
        ageGroupSlug: ageGroup.slug,
        tagline: { en: '', fr: '' },
        highlights: [],
        outcome: SHEET_OUTCOME,
        skills: SHEET_SKILLS,
        tools: [],
        summer: true,
      };
      // Saved before its prices and groups: if those fail half-way, the
      // course is still there to finish by hand instead of being re-created
      content.courses.push(course);
      await writeContent(content);

      await Promise.all([
        upsertDbPricingRule({ planType: 'MONTHLY', courseSlug: slug, amount: sheetCourse.monthly, currency: 'TND' }),
        upsertDbPricingRule({ planType: 'SEASON', courseSlug: slug, amount: sheetCourse.season, currency: 'TND' }),
        ...sheetCourse.groups.map((group) =>
          createDbCourseSession({
            courseSlug: slug,
            teacherId: null,
            label: group.label,
            dayOfWeek: group.days[0],
            extraDays: group.days.slice(1),
            summer: true,
            startTime: group.startTime,
            endTime: group.endTime,
            location: '',
            capacity: group.capacity ?? capacity,
            term,
          }),
        ),
      ]);
    }
  }

  revalidateSummer();
  redirect(`${PAGE}?saved=1`);
}
