'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/admin/guard';
import { ageGroupSlugForBirthDate, listAgeGroupEntries, getAgeGroupEntryOrThrow, getCourseEntryOrThrow } from '@/lib/content/lookup';
import { DEFAULT_SESSION_CAPACITY, DEFAULT_SESSION_TERM } from '@/lib/scheduling/slots';
import { getDbTimeSlot } from '@/lib/db/time-slots';
import { quoteEnrollment } from '@/lib/pricing/compute';
import { planTypesForCourse } from '@/lib/content/summer';
import {
  createDbChild,
  generateUniqueClaimCode,
  getDbChild,
  updateDbChild,
  type ChildContactFields,
  type DbChild,
  type PastClass,
} from '@/lib/db/children';
import { createDbEnrollment, getDbPayment, updateDbPayment, type PaymentMethod, type PlanType } from '@/lib/db/enrollments';
import {
  createDbCourseSession,
  getDbCourseSession,
  listDbCourseSessionsByCourse,
  type DbCourseSession,
} from '@/lib/db/sessions';

const PAYMENT_METHODS: PaymentMethod[] = ['CASH', 'CHEQUE', 'CARD'];

function field(formData: FormData, name: string): string {
  return String(formData.get(name) ?? '').trim();
}

// Parallel pastSchoolYear / pastCourse fields, one pair per "year" row.
function parsePastClasses(formData: FormData): PastClass[] {
  const years = formData.getAll('pastSchoolYear').map((v) => String(v).trim());
  const notes = formData.getAll('pastNote').map((v) => String(v).trim());
  return formData
    .getAll('pastCourse')
    .map((v, i) => ({ schoolYear: years[i] ?? '', course: String(v).trim(), note: notes[i] || null }))
    .filter((c) => c.course);
}

function parseContactFields(formData: FormData): ChildContactFields {
  const registeredAt = new Date(field(formData, 'registeredAt'));
  return {
    contactName: field(formData, 'contactName') || null,
    contactPhone: field(formData, 'contactPhone') || null,
    contactEmail: field(formData, 'contactEmail').toLowerCase() || null,
    registeredAt: Number.isNaN(registeredAt.getTime()) ? null : registeredAt,
  };
}

// The group for a course at a timetable slot. Staff import children from the
// paper records mid-year, so a group that hasn't been set up on the Course
// sessions page yet is created on the spot (no teacher, default capacity).
async function findOrCreateSession(courseSlug: string, timeSlotId: string): Promise<DbCourseSession | null> {
  const slot = timeSlotId ? await getDbTimeSlot(timeSlotId) : null;
  if (!slot) return null;
  const sameSlot = (s: DbCourseSession) =>
    s.dayOfWeek === slot.dayOfWeek && s.startTime === slot.startTime && s.endTime === slot.endTime;

  const existing = (await listDbCourseSessionsByCourse(courseSlug)).find(sameSlot);
  if (existing) return existing;

  const id = await createDbCourseSession({
    courseSlug,
    teacherId: null,
    dayOfWeek: slot.dayOfWeek,
    extraDays: [],
    label: '',
    summer: false,
    startTime: slot.startTime,
    endTime: slot.endTime,
    location: '',
    capacity: DEFAULT_SESSION_CAPACITY,
    term: DEFAULT_SESSION_TERM,
  });
  revalidatePath('/admin/sessions');
  return getDbCourseSession(id);
}

// Enrolls the child in a group as staff: always active, and the first
// payment is either recorded as already paid or left pending so the usual
// overdue alerts and SMS reminders pick it up once a parent is linked.
// Unlike parents, staff may pick a course outside the child's age group.
async function enrollAsStaff(child: DbChild, formData: FormData): Promise<'ok' | string> {
  const courseSlug = field(formData, 'courseSlug');
  const planType = field(formData, 'planType') as PlanType;
  const paymentMethod = field(formData, 'paymentMethod') as PaymentMethod;
  const paid = field(formData, 'paymentStatus') === 'PAID';

  if (!courseSlug || !PAYMENT_METHODS.includes(paymentMethod)) return 'enroll';
  const course = await getCourseEntryOrThrow(courseSlug);
  if (!planTypesForCourse(course).includes(planType)) return 'enroll';

  // Summer groups have their own days and times, so staff pick the group
  // itself rather than a weekly timetable slot
  const groupId = field(formData, 'courseSessionId');
  const session = course.summer
    ? groupId
      ? await getDbCourseSession(groupId)
      : null
    : await findOrCreateSession(courseSlug, field(formData, 'timeSlotId'));
  if (!session || session.courseSlug !== courseSlug) return 'enroll';

  const { amount, currency, discountPercent, laterDueDates } = await quoteEnrollment(course, planType, child);

  try {
    const { paymentId } = await createDbEnrollment({
      childId: child.id,
      courseSessionId: session.id,
      session,
      planType,
      paymentMethod,
      amount,
      currency,
      discountPercent,
      laterDueDates,
      forceActive: true,
    });
    if (paid) {
      // parentNotifiedAt set so the parent doesn't get a "payment confirmed"
      // popup for something settled on paper before they had an account
      const now = new Date();
      await updateDbPayment(paymentId, { status: 'PAID', paidAt: now, parentNotifiedAt: now });
    }
  } catch (err) {
    if (err instanceof Error && err.message === 'CAPACITY_FULL') return 'capacity';
    if (err instanceof Error && err.message === 'SCHEDULE_CONFLICT') return 'conflict';
    if (err instanceof Error && err.message === 'DUPLICATE') return 'duplicate';
    throw err;
  }
  return 'ok';
}

export async function createExistingChild(formData: FormData): Promise<void> {
  await requireAdmin();

  const fullName = field(formData, 'fullName');
  const dateOfBirth = new Date(field(formData, 'dateOfBirth'));
  const institution = field(formData, 'institution');
  const specialNeeds = field(formData, 'specialNeeds');

  if (!fullName || Number.isNaN(dateOfBirth.getTime())) {
    redirect('/admin/children/new?error=required');
  }
  // Detected from the date of birth; the picked one only when no group fits
  const ageGroupSlug = ageGroupSlugForBirthDate(dateOfBirth, await listAgeGroupEntries()) ?? field(formData, 'ageGroupSlug');
  if (!ageGroupSlug) redirect('/admin/children/new?error=required');
  await getAgeGroupEntryOrThrow(ageGroupSlug);

  const claimCode = await generateUniqueClaimCode();
  const childId = await createDbChild({
    parentId: '',
    fullName,
    dateOfBirth,
    ageGroupSlug,
    institution: institution || null,
    specialNeeds: specialNeeds || null,
    claimCode,
    pastClasses: parsePastClasses(formData),
    ...parseContactFields(formData),
  });

  // The child exists either way; an enrollment problem is reported on the
  // child's page where staff can retry with another group.
  let enrollResult = 'ok';
  if (field(formData, 'courseSlug')) {
    const child = await getDbChild(childId);
    enrollResult = await enrollAsStaff(child!, formData);
  }

  revalidatePath('/admin/children');
  redirect(`/admin/children/${childId}?${enrollResult === 'ok' ? 'created=1' : `created=1&error=${enrollResult}`}`);
}

export async function updateChildDetails(childId: string, formData: FormData): Promise<void> {
  await requireAdmin();
  const child = await getDbChild(childId);
  if (!child) redirect('/admin/children');

  const fullName = field(formData, 'fullName');
  const dateOfBirth = new Date(field(formData, 'dateOfBirth'));
  if (!fullName || Number.isNaN(dateOfBirth.getTime())) redirect(`/admin/children/${childId}/edit?error=details`);
  const ageGroupSlug = ageGroupSlugForBirthDate(dateOfBirth, await listAgeGroupEntries()) ?? (field(formData, 'ageGroupSlug') || child!.ageGroupSlug);
  await getAgeGroupEntryOrThrow(ageGroupSlug);

  await updateDbChild(childId, {
    fullName,
    dateOfBirth,
    ageGroupSlug,
    institution: field(formData, 'institution') || null,
    specialNeeds: field(formData, 'specialNeeds') || null,
    ...parseContactFields(formData),
  });
  revalidatePath('/admin/children');
  revalidatePath(`/admin/children/${childId}`);
  redirect(`/admin/children/${childId}?saved=1`);
}

export async function addChildEnrollment(childId: string, formData: FormData): Promise<void> {
  await requireAdmin();
  const child = await getDbChild(childId);
  if (!child) redirect('/admin/children');

  const result = await enrollAsStaff(child!, formData);
  revalidatePath(`/admin/children/${childId}`);
  redirect(`/admin/children/${childId}?${result === 'ok' ? 'saved=1' : `error=${result}`}`);
}

export async function markChildPaymentPaid(childId: string, paymentId: string): Promise<void> {
  await requireAdmin();
  const payment = await getDbPayment(paymentId);
  if (!payment) redirect(`/admin/children/${childId}?error=1`);
  await updateDbPayment(paymentId, { status: 'PAID', paidAt: new Date(), parentNotifiedAt: null });
  revalidatePath('/admin/payments');
  revalidatePath(`/admin/children/${childId}`);
  redirect(`/admin/children/${childId}?saved=1`);
}

export async function addPastClass(childId: string, formData: FormData): Promise<void> {
  await requireAdmin();
  const child = await getDbChild(childId);
  if (!child) redirect('/admin/children');

  const course = field(formData, 'course');
  if (!course) redirect(`/admin/children/${childId}?error=pastClass`);
  const pastClasses = [...child!.pastClasses, { schoolYear: field(formData, 'schoolYear'), course, note: field(formData, 'note') || null }];
  await updateDbChild(childId, { pastClasses });

  revalidatePath(`/admin/children/${childId}`);
  redirect(`/admin/children/${childId}?saved=1`);
}

export async function removePastClass(childId: string, index: number): Promise<void> {
  await requireAdmin();
  const child = await getDbChild(childId);
  if (!child) redirect('/admin/children');

  await updateDbChild(childId, { pastClasses: child!.pastClasses.filter((_, i) => i !== index) });
  revalidatePath(`/admin/children/${childId}`);
}

export async function regenerateChildClaimCode(childId: string): Promise<void> {
  await requireAdmin();
  const child = await getDbChild(childId);
  // A code only makes sense until a parent has linked the child
  if (!child || child.parentId) redirect(`/admin/children/${childId}`);

  await updateDbChild(childId, { claimCode: await generateUniqueClaimCode() });
  revalidatePath(`/admin/children/${childId}`);
  revalidatePath('/admin/children');
}
