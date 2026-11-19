'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/admin/guard';
import { listAgeGroupEntries, getCourseEntryOrThrow } from '@/lib/content/lookup';
import { chooseAgeGroup } from '@/lib/content/age-range';
import { findPossibleDuplicates, type DuplicateReason } from '@/lib/children/duplicates';
import { birthDateProblem, nameTooLong } from '@/lib/children/validation';
import { DEFAULT_SESSION_CAPACITY, DEFAULT_SESSION_TERM } from '@/lib/scheduling/slots';
import { getDbTimeSlot } from '@/lib/db/time-slots';
import { quoteEnrollment } from '@/lib/pricing/compute';
import { planTypesForCourse } from '@/lib/content/summer';
import {
  createDbChild,
  generateUniqueClaimCode,
  getDbChild,
  updateDbChild,
  type DbChild,
  type PastClass,
} from '@/lib/db/children';
import {
  createDbFamily,
  detachDbChildFromFamily,
  familyIsEmpty,
  getDbFamily,
  linkDbSiblings,
  PARENT_RELATIONS,
  saveDbChildFamily,
  type FamilyFields,
  type ParentRelation,
} from '@/lib/db/families';
import { prisma } from '@/lib/db/prisma';
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

// yyyy-mm-dd from <input type="date">, read as UTC midnight; null if empty
function dateField(formData: FormData, name: string): Date | null {
  const value = field(formData, name);
  const date = new Date(value);
  return value && !Number.isNaN(date.getTime()) ? date : null;
}

function relationField(formData: FormData, name: string): ParentRelation | null {
  const value = field(formData, name) as ParentRelation;
  return PARENT_RELATIONS.includes(value) ? value : null;
}

// The two parents' blocks of the child forms (components/admin/FamilyFields)
function parseFamilyFields(formData: FormData): FamilyFields {
  return {
    parent1Name: field(formData, 'parent1Name') || null,
    parent1Relation: relationField(formData, 'parent1Relation'),
    parent1Phone: field(formData, 'parent1Phone') || null,
    parent1Phone2: field(formData, 'parent1Phone2') || null,
    parent2Name: field(formData, 'parent2Name') || null,
    parent2Relation: relationField(formData, 'parent2Relation'),
    parent2Phone: field(formData, 'parent2Phone') || null,
    parent2Phone2: field(formData, 'parent2Phone2') || null,
    email: field(formData, 'email').toLowerCase() || null,
  };
}

// What's wrong with a child's form, or null: names over 30 characters, or a
// date of birth making the child younger than 4 or older than 18. On an
// edit, values left as they were aren't checked again: a child can age out
// of the range while on record, and older records may hold longer names.
function childFormProblem(
  formData: FormData,
  previous?: { fullName: string; dateOfBirth: Date | null; parent1Name: string | null; parent2Name: string | null },
): string | null {
  const changedName = (name: string, before: string | null | undefined) => (previous ? name !== (before ?? '') : true);
  const fullName = field(formData, 'fullName');
  if (changedName(fullName, previous?.fullName) && nameTooLong(fullName)) return 'nameLength';
  for (const key of ['parent1Name', 'parent2Name'] as const) {
    const name = field(formData, key);
    if (changedName(name, previous?.[key]) && nameTooLong(name)) return 'parentNameLength';
  }
  const dateOfBirth = dateField(formData, 'dateOfBirth');
  const unchanged = dateOfBirth && previous?.dateOfBirth && dateOfBirth.getTime() === previous.dateOfBirth.getTime();
  if (dateOfBirth && !unchanged && birthDateProblem(dateOfBirth)) return 'age';
  return null;
}

// Date of birth (optional) and age group: picked by hand, or "" for the one
// the date gives, or left to complete when there is neither
async function parseBirthAndGroup(formData: FormData) {
  const dateOfBirth = dateField(formData, 'dateOfBirth');
  const groups = await listAgeGroupEntries();
  return { dateOfBirth, ...chooseAgeGroup(groups, dateOfBirth, field(formData, 'ageGroupSlug')) };
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
  const session = await requireAdmin();

  const fullName = field(formData, 'fullName');
  if (!fullName) redirect('/admin/children/new?error=required');
  const registeredAt = dateField(formData, 'registeredAt');
  // Only the Admin, importing children from the paper records, may leave the
  // registration date empty; the front desk registers new children with one
  if (session.kind === 'secretary' && !registeredAt) redirect('/admin/children/new?error=registeredAt');
  const problem = childFormProblem(formData);
  if (problem) redirect(`/admin/children/new?error=${problem}`);

  const family = parseFamilyFields(formData);
  const childId = await createDbChild({
    parentId: '',
    familyId: familyIsEmpty(family) ? null : await createDbFamily(family),
    fullName,
    ...(await parseBirthAndGroup(formData)),
    institution: field(formData, 'institution') || null,
    specialNeeds: field(formData, 'specialNeeds') || null,
    claimCode: await generateUniqueClaimCode(),
    pastClasses: parsePastClasses(formData),
    registeredAt,
  });

  // Brother or sister of a child already here: joins their family (their
  // parent details win, what was typed fills the blanks) and their parent
  // account if they have one
  const siblingId = field(formData, 'siblingId');
  if (siblingId) await linkDbSiblings(siblingId, childId);

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
  const session = await requireAdmin();
  const child = await getDbChild(childId);
  if (!child) redirect('/admin/children');

  const fullName = field(formData, 'fullName');
  if (!fullName) redirect(`/admin/children/${childId}/edit?error=details`);
  const registeredAt = dateField(formData, 'registeredAt');
  // The front desk can change a registration date but not erase one
  if (session.kind === 'secretary' && child!.registeredAt && !registeredAt) {
    redirect(`/admin/children/${childId}/edit?error=registeredAt`);
  }
  const family = await getDbFamily(child!.familyId);
  const problem = childFormProblem(formData, {
    fullName: child!.fullName,
    dateOfBirth: child!.dateOfBirth,
    parent1Name: family?.parent1Name ?? null,
    parent2Name: family?.parent2Name ?? null,
  });
  if (problem) redirect(`/admin/children/${childId}/edit?error=${problem}`);

  await updateDbChild(childId, {
    fullName,
    ...(await parseBirthAndGroup(formData)),
    institution: field(formData, 'institution') || null,
    specialNeeds: field(formData, 'specialNeeds') || null,
    registeredAt,
  });
  // Shared with the brothers and sisters
  await saveDbChildFamily(childId, parseFamilyFields(formData));

  revalidatePath('/admin/children');
  revalidatePath(`/admin/children/${childId}`);
  redirect(`/admin/children/${childId}?saved=1`);
}

// Brothers and sisters

export async function linkSibling(childId: string, formData: FormData): Promise<void> {
  await requireAdmin();
  const siblingId = field(formData, 'siblingId');
  const result = siblingId ? await linkDbSiblings(childId, siblingId) : 'same';
  revalidatePath('/admin/children');
  revalidatePath(`/admin/children/${childId}`);
  redirect(`/admin/children/${childId}?${result === 'ok' ? 'saved=1' : result === 'accounts' ? 'error=siblingAccounts' : 'error=sibling'}`);
}

export async function unlinkSibling(childId: string, siblingId: string): Promise<void> {
  await requireAdmin();
  await detachDbChildFromFamily(siblingId);
  revalidatePath('/admin/children');
  revalidatePath(`/admin/children/${childId}`);
}

// Possible duplicates of a child being typed in, for the warning on the
// "Add a child" form. Never blocks: staff decide.
export type DuplicateHit = { id: string; fullName: string; dateOfBirth: string | null; reason: DuplicateReason };

export async function checkChildDuplicates(input: { fullName: string; dateOfBirth: string }): Promise<DuplicateHit[]> {
  await requireAdmin();
  const fullName = String(input?.fullName ?? '').trim().slice(0, 200);
  if (fullName.length < 2) return [];
  const rawDate = String(input?.dateOfBirth ?? '');
  const date = new Date(rawDate);
  const dateOfBirth = rawDate && !Number.isNaN(date.getTime()) ? date : null;

  const children = await prisma.child.findMany({ select: { id: true, fullName: true, dateOfBirth: true } });
  return findPossibleDuplicates({ fullName, dateOfBirth }, children).map(({ child, reason }) => ({
    id: child.id,
    fullName: child.fullName,
    dateOfBirth: child.dateOfBirth ? child.dateOfBirth.toISOString().slice(0, 10) : null,
    reason,
  }));
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
