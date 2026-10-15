/*
 * One-time copy of everything in Firestore into PostgreSQL, plus the old
 * data/content.json and data/messages.json files.
 *
 * Passwords are not copied: they lived in Firebase Authentication. Reception
 * accounts already kept their own copy and keep working; parents and teachers
 * set a new one with "Forgot password", or the admin sets one for them
 * (Teachers / Parents pages, key icon).
 *
 * Run it after `npx prisma migrate deploy`, with both the Firebase service
 * account (FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY)
 * and DATABASE_URL set:
 *
 *   npm run db:import-firebase
 *
 * Ids are kept, so it is safe to run again: rows that already exist are
 * skipped. Nothing in Firebase is changed.
 */
import fs from 'fs';
import path from 'path';
import { loadEnvConfig } from '@next/env';
import { cert, initializeApp } from 'firebase-admin/app';
import { getFirestore, type DocumentData } from 'firebase-admin/firestore';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, type Prisma } from '../lib/generated/prisma/client';

loadEnvConfig(process.cwd());

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
if (!projectId || !clientEmail || !privateKey) throw new Error('Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY.');
if (!process.env.DATABASE_URL) throw new Error('Set DATABASE_URL.');

const firebase = initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
const firestore = getFirestore(firebase);
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

const warnings: string[] = [];
// Accounts that need a new password before they can sign in
const noPassword: string[] = [];
const warn = (message: string) => warnings.push(message);

// ---------------------------------------------------------------------------
// Value helpers: Firestore stored dates as Timestamps, ISO strings or nothing
// ---------------------------------------------------------------------------

function toDate(value: unknown): Date | null {
  if (!value) return null;
  if (typeof value === 'object' && value !== null && 'toDate' in value && typeof value.toDate === 'function') {
    return value.toDate() as Date;
  }
  if (value instanceof Date) return value;
  if (typeof value === 'string' || typeof value === 'number') {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  return null;
}

const str = (value: unknown): string | null => (value === null || value === undefined || value === '' ? null : String(value));
const num = (value: unknown, fallback = 0): number => (Number.isFinite(Number(value)) ? Number(value) : fallback);
function oneOf<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

async function readCollection(name: string): Promise<Array<{ id: string; data: DocumentData }>> {
  const snapshot = await firestore.collection(name).get();
  return snapshot.docs.map((doc) => ({ id: doc.id, data: doc.data() }));
}

async function insert<T>(label: string, rows: T[], write: (rows: T[]) => Promise<{ count: number }>): Promise<void> {
  let inserted = 0;
  for (let i = 0; i < rows.length; i += 500) inserted += (await write(rows.slice(i, i + 500))).count;
  console.log(`${label.padEnd(22)} ${String(rows.length).padStart(5)} read, ${String(inserted).padStart(5)} added`);
}

// ---------------------------------------------------------------------------
// Accounts
// ---------------------------------------------------------------------------

async function migrateUsers(): Promise<Set<string>> {
  const docs = await readCollection('users');
  const seenEmails = new Set<string>();
  const rows: Prisma.UserCreateManyInput[] = [];

  for (const { id, data } of docs) {
    const role = oneOf(data.role, ['PARENT', 'TEACHER', 'SECRETARY'] as const, 'PARENT');
    const email = String(data.email ?? '').trim().toLowerCase();
    if (!email) {
      warn(`users/${id}: no email, skipped`);
      continue;
    }
    if (seenEmails.has(email)) {
      warn(`users/${id}: email ${email} already used by another account, skipped`);
      continue;
    }
    seenEmails.add(email);

    // Reception accounts already had a bcrypt hash next to their Firebase login
    const passwordHash = role === 'SECRETARY' ? str(data.passwordHash) : null;
    if (!passwordHash) noPassword.push(`${email} (${role.toLowerCase()})`);

    let courseSlugs: string[] = [];
    try {
      const parsed = JSON.parse(String(data.courseSlugs ?? '[]'));
      if (Array.isArray(parsed)) courseSlugs = parsed.map(String);
    } catch {
      courseSlugs = [];
    }

    rows.push({
      id,
      email,
      fullName: String(data.fullName ?? ''),
      phone: String(data.phone ?? ''),
      secondaryPhone: str(data.secondaryPhone),
      backupEmail: str(data.backupEmail),
      role,
      parentStatus: role === 'PARENT' ? oneOf(data.parentStatus, ['PENDING', 'APPROVED', 'REJECTED'] as const, 'APPROVED') : null,
      isFrozen: data.isFrozen === true,
      passwordHash,
      twoFactorEnabled: data.twoFactorEnabled === true,
      teacherCourseSlugs: courseSlugs,
      teacherSecretCodeHash: str(data.teacherSecretCodeHash),
      teacherSecretCode: str(data.teacherSecretCode),
      createdAt: toDate(data.createdAt) ?? new Date(),
    });
  }

  await insert('users', rows, (batch) => prisma.user.createMany({ data: batch, skipDuplicates: true }));
  return new Set((await prisma.user.findMany({ select: { id: true } })).map((u) => u.id));
}

// ---------------------------------------------------------------------------
// Everything else, parents before children so references can be checked
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  console.log(`Copying Firebase project "${projectId}" into PostgreSQL\n`);

  const userIds = await migrateUsers();
  const known = (ids: Set<string>, value: unknown) => {
    const id = str(value);
    return id && ids.has(id) ? id : null;
  };

  // Children
  const childDocs = await readCollection('children');
  await insert(
    'children',
    childDocs.map(({ id, data }) => {
      const parentId = known(userIds, data.parentId);
      if (data.parentId && !parentId) warn(`children/${id}: parent ${data.parentId} not found, left unlinked`);
      return {
        id,
        parentId,
        fullName: String(data.fullName ?? ''),
        dateOfBirth: toDate(data.dateOfBirth) ?? new Date(0),
        ageGroupSlug: String(data.ageGroupSlug ?? ''),
        institution: str(data.institution),
        specialNeeds: str(data.specialNeeds),
        photoUrl: str(data.photoUrl),
        photoColor: str(data.photoColor),
        claimCode: str(data.claimCode),
        claimedAt: toDate(data.claimedAt),
        pastClasses: Array.isArray(data.pastClasses) ? data.pastClasses : [],
        contactName: str(data.contactName),
        contactPhone: str(data.contactPhone),
        contactEmail: str(data.contactEmail),
        registeredAt: toDate(data.registeredAt),
        createdAt: toDate(data.createdAt) ?? new Date(),
      };
    }),
    (batch) => prisma.child.createMany({ data: batch, skipDuplicates: true }),
  );
  const childIds = new Set((await prisma.child.findMany({ select: { id: true } })).map((c) => c.id));

  // Weekly timetable and groups
  await insert(
    'time_slots',
    (await readCollection('time_slots')).map(({ id, data }) => ({
      id,
      label: String(data.label ?? id),
      dayOfWeek: num(data.dayOfWeek),
      startTime: String(data.startTime ?? ''),
      endTime: String(data.endTime ?? ''),
      createdAt: toDate(data.createdAt) ?? new Date(),
    })),
    (batch) => prisma.timeSlot.createMany({ data: batch, skipDuplicates: true }),
  );

  await insert(
    'course_sessions',
    (await readCollection('course_sessions')).map(({ id, data }) => ({
      id,
      courseSlug: String(data.courseSlug ?? ''),
      teacherId: known(userIds, data.teacherId),
      dayOfWeek: num(data.dayOfWeek),
      extraDays: Array.isArray(data.extraDays) ? data.extraDays.map(Number).filter((d: number) => d >= 0 && d <= 6) : [],
      label: String(data.label ?? ''),
      summer: data.summer === true,
      startTime: String(data.startTime ?? ''),
      endTime: String(data.endTime ?? ''),
      location: String(data.location ?? ''),
      capacity: num(data.capacity, 12),
      term: String(data.term ?? ''),
      createdAt: toDate(data.createdAt) ?? new Date(),
    })),
    (batch) => prisma.courseSession.createMany({ data: batch, skipDuplicates: true }),
  );
  const sessionIds = new Set((await prisma.courseSession.findMany({ select: { id: true } })).map((s) => s.id));

  // Enrollments, plans and payments
  await insert(
    'enrollments',
    (await readCollection('enrollments')).map(({ id, data }) => ({
      id,
      childId: known(childIds, data.childId),
      courseSessionId: known(sessionIds, data.courseSessionId),
      status: oneOf(data.status, ['PENDING', 'ACTIVE', 'CANCELLED'] as const, 'PENDING'),
      enrolledAt: toDate(data.enrolledAt) ?? new Date(),
    })),
    (batch) => prisma.enrollment.createMany({ data: batch, skipDuplicates: true }),
  );
  const enrollmentIds = new Set((await prisma.enrollment.findMany({ select: { id: true } })).map((e) => e.id));

  const planDocs = (await readCollection('payment_plans')).filter(({ id, data }) => {
    if (enrollmentIds.has(String(data.enrollmentId))) return true;
    warn(`payment_plans/${id}: enrollment ${data.enrollmentId} not found, skipped`);
    return false;
  });
  await insert(
    'payment_plans',
    planDocs.map(({ id, data }) => ({
      id,
      enrollmentId: String(data.enrollmentId),
      type: oneOf(data.type, ['MONTHLY', 'QUARTERLY', 'YEARLY', 'SEASON'] as const, 'MONTHLY'),
      method: oneOf(data.method, ['CASH', 'CARD', 'CHEQUE'] as const, 'CASH'),
      amount: num(data.amount),
      currency: String(data.currency ?? 'TND'),
      discountPercent: num(data.discountPercent),
      startDate: toDate(data.startDate) ?? new Date(),
      createdAt: toDate(data.createdAt) ?? new Date(),
    })),
    (batch) => prisma.paymentPlan.createMany({ data: batch, skipDuplicates: true }),
  );
  const planIds = new Set((await prisma.paymentPlan.findMany({ select: { id: true } })).map((p) => p.id));

  const paymentDocs = (await readCollection('payments')).filter(({ id, data }) => {
    if (planIds.has(String(data.paymentPlanId)) && enrollmentIds.has(String(data.enrollmentId))) return true;
    warn(`payments/${id}: plan or enrollment not found, skipped (${data.amount} ${data.currency}, ${data.status})`);
    return false;
  });
  await insert(
    'payments',
    paymentDocs.map(({ id, data }) => ({
      id,
      paymentPlanId: String(data.paymentPlanId),
      enrollmentId: String(data.enrollmentId),
      amount: num(data.amount),
      currency: String(data.currency ?? 'TND'),
      dueDate: toDate(data.dueDate) ?? new Date(),
      status: oneOf(data.status, ['PENDING', 'PAID', 'OVERDUE', 'FAILED'] as const, 'PENDING'),
      paidAt: toDate(data.paidAt),
      parentNotifiedAt: toDate(data.parentNotifiedAt),
      stripeSessionId: str(data.stripeSessionId),
      stripePaymentIntentId: str(data.stripePaymentIntentId),
      createdAt: toDate(data.createdAt) ?? new Date(),
    })),
    (batch) => prisma.payment.createMany({ data: batch, skipDuplicates: true }),
  );
  const paymentIds = new Set((await prisma.payment.findMany({ select: { id: true } })).map((p) => p.id));

  await insert(
    'pricing_rules',
    (await readCollection('pricing_rules')).map(({ id, data }) => ({
      id,
      planType: oneOf(data.planType, ['MONTHLY', 'QUARTERLY', 'YEARLY', 'SEASON'] as const, 'MONTHLY'),
      ageGroupSlug: str(data.ageGroupSlug),
      courseSlug: str(data.courseSlug),
      amount: num(data.amount),
      currency: String(data.currency ?? 'TND'),
    })),
    (batch) => prisma.pricingRule.createMany({ data: batch, skipDuplicates: true }),
  );

  // Teacher feedback
  const forKnownChild = (collection: string) => ({ id, data }: { id: string; data: DocumentData }) => {
    if (childIds.has(String(data.childId))) return true;
    warn(`${collection}/${id}: child ${data.childId} not found, skipped`);
    return false;
  };
  await insert(
    'teacher_notes',
    (await readCollection('teacher_notes')).filter(forKnownChild('teacher_notes')).map(({ id, data }) => ({
      id,
      teacherId: known(userIds, data.teacherId),
      childId: String(data.childId),
      courseSessionId: known(sessionIds, data.courseSessionId),
      enrollmentId: known(enrollmentIds, data.enrollmentId),
      content: String(data.content ?? ''),
      createdAt: toDate(data.createdAt) ?? new Date(),
    })),
    (batch) => prisma.teacherNote.createMany({ data: batch, skipDuplicates: true }),
  );
  await insert(
    'badges',
    (await readCollection('badges')).filter(forKnownChild('badges')).map(({ id, data }) => ({
      id,
      childId: String(data.childId),
      teacherId: known(userIds, data.teacherId),
      courseSessionId: known(sessionIds, data.courseSessionId),
      title: String(data.title ?? ''),
      note: str(data.note),
      emoji: String(data.emoji ?? '🏅'),
      imageUrl: str(data.imageUrl),
      awardedAt: toDate(data.awardedAt) ?? new Date(),
    })),
    (batch) => prisma.badge.createMany({ data: batch, skipDuplicates: true }),
  );

  // Money logged by hand
  await insert(
    'expenses',
    (await readCollection('expenses')).map(({ id, data }) => ({
      id,
      label: String(data.label ?? ''),
      amount: num(data.amount),
      currency: String(data.currency ?? 'TND'),
      note: str(data.note),
      date: toDate(data.date) ?? new Date(),
      chargeType: data.chargeType === 'FIXED' ? ('FIXED' as const) : ('VARIABLE' as const),
      createdByName: String(data.createdByName ?? ''),
      createdByRole: String(data.createdByRole ?? ''),
      createdAt: toDate(data.createdAt) ?? new Date(),
    })),
    (batch) => prisma.expense.createMany({ data: batch, skipDuplicates: true }),
  );
  await insert(
    'earnings',
    (await readCollection('earnings')).map(({ id, data }) => ({
      id,
      label: String(data.label ?? ''),
      amount: num(data.amount),
      currency: String(data.currency ?? 'TND'),
      note: str(data.note),
      date: toDate(data.date) ?? new Date(),
      createdByName: String(data.createdByName ?? ''),
      createdByRole: String(data.createdByRole ?? ''),
      createdAt: toDate(data.createdAt) ?? new Date(),
    })),
    (batch) => prisma.earning.createMany({ data: batch, skipDuplicates: true }),
  );

  // Admin feed, logs and forms
  await insert(
    'notifications',
    (await readCollection('notifications')).map(({ id, data }) => ({
      id,
      type: oneOf(
        data.type,
        ['EXPENSE_ADDED', 'EARNING_ADDED', 'PREINSCRIPTION_SUBMITTED', 'OFFLINE_PAYMENT_DECLARED', 'CHILD_LINKED'] as const,
        'EXPENSE_ADDED',
      ),
      title: String(data.title ?? ''),
      body: str(data.body),
      link: str(data.link),
      readAt: toDate(data.readAt),
      createdAt: toDate(data.createdAt) ?? new Date(),
    })),
    (batch) => prisma.notification.createMany({ data: batch, skipDuplicates: true }),
  );
  await insert(
    'sms_notifications',
    (await readCollection('sms_notifications')).map(({ id, data }) => ({
      id,
      parentId: known(userIds, data.parentId),
      phone: String(data.phone ?? ''),
      message: String(data.message ?? ''),
      purpose: oneOf(data.purpose, ['PAYMENT_REMINDER', 'PASSWORD_RESET', 'ENROLLMENT_APPROVED'] as const, 'PAYMENT_REMINDER'),
      status: oneOf(data.status, ['QUEUED', 'SENT', 'FAILED'] as const, 'SENT'),
      provider: String(data.provider ?? ''),
      providerMessageId: str(data.providerMessageId),
      relatedPaymentId: known(paymentIds, data.relatedPaymentId),
      createdAt: toDate(data.createdAt) ?? new Date(),
    })),
    (batch) => prisma.smsNotification.createMany({ data: batch, skipDuplicates: true }),
  );
  await insert(
    'preinscriptions',
    (await readCollection('preinscriptions')).map(({ id, data }) => ({
      id,
      childFullName: String(data.childFullName ?? ''),
      childAge: num(data.childAge),
      institution: String(data.institution ?? ''),
      parentFullName: String(data.parentFullName ?? ''),
      parentPhone: String(data.parentPhone ?? ''),
      createdAt: toDate(data.createdAt) ?? new Date(),
    })),
    (batch) => prisma.preinscription.createMany({ data: batch, skipDuplicates: true }),
  );
  await insert(
    'settings',
    (await readCollection('settings')).map(({ id, data }) => ({ key: id, value: data })),
    (batch) => prisma.setting.createMany({ data: batch, skipDuplicates: true }),
  );

  // The JSON files the site used to keep on disk
  const contentPath = path.join(process.cwd(), 'data', 'content.json');
  if (fs.existsSync(contentPath)) {
    const existing = await prisma.siteContent.findUnique({ where: { id: 'main' } });
    if (existing) {
      console.log('site content            already in the database, data/content.json not imported');
    } else {
      // Imported here, after the env is loaded: the store opens its own
      // database connection when its module loads
      const { normalizeContent } = await import('../lib/content/store');
      const data = JSON.parse(JSON.stringify(normalizeContent(JSON.parse(fs.readFileSync(contentPath, 'utf-8')))));
      await prisma.siteContent.create({ data: { id: 'main', data } });
      console.log('site content            imported from data/content.json');
    }
  } else {
    warn('data/content.json not found: the site starts from the default content');
  }

  const messagesPath = path.join(process.cwd(), 'data', 'messages.json');
  if (fs.existsSync(messagesPath)) {
    const messages = JSON.parse(fs.readFileSync(messagesPath, 'utf-8')) as Array<Record<string, unknown>>;
    await insert(
      'contact_messages',
      messages.map((m) => ({
        id: String(m.id),
        name: String(m.name ?? ''),
        email: String(m.email ?? ''),
        message: String(m.message ?? ''),
        read: m.read === true,
        createdAt: toDate(m.createdAt) ?? new Date(),
      })),
      (batch) => prisma.contactMessage.createMany({ data: batch, skipDuplicates: true }),
    );
  }

  if (noPassword.length > 0) {
    console.log(`
${noPassword.length} account(s) need a new password (Forgot password, or the admin's key icon):`);
    for (const account of noPassword) console.log(`  - ${account}`);
  }
  if (warnings.length > 0) {
    console.log(`\n${warnings.length} warning(s):`);
    for (const message of warnings) console.log(`  - ${message}`);
  }
  console.log('\nDone.');
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
