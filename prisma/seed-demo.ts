// Fills the existing test parent account (test.parent@braintrain.tn) with
// realistic-looking mock data — enrollments, mixed-status payments, badges
// using the public/stickers artwork, and teacher remarks — so the portal UI
// can be reviewed fully populated instead of empty. Safe to re-run: teacher
// and enrollments are found-or-created, and the flavor rows (payments,
// badges, notes) are only added the first time (skipped if the child
// already has any).
import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../lib/portal-auth/password';
import { DEFAULT_TEACHER_PASSWORD } from '../lib/admin/teacher-defaults';
import { BADGE_STICKERS } from '../lib/badges/stickers';

const prisma = new PrismaClient();

const DEMO_TEACHER_EMAIL = 'demo.teacher@braintrain.tn';
const DEMO_TEACHER_PHONE = '20000099';

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function daysFromNow(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
}

async function main() {
  const parentUser = await prisma.user.findUnique({
    where: { email: 'test.parent@braintrain.tn' },
    include: { parent: { include: { children: true } } },
  });
  if (!parentUser?.parent) {
    console.log('Test parent account not found — nothing to seed.');
    return;
  }

  const child = parentUser.parent.children[0];
  if (!child) {
    console.log('Test parent has no child yet — nothing to seed.');
    return;
  }

  // --- Demo teacher (found or created) ---------------------------------
  let teacherUser = await prisma.user.findUnique({ where: { email: DEMO_TEACHER_EMAIL }, include: { teacher: true } });
  if (!teacherUser) {
    const [passwordHash, teacherSecretCodeHash] = await Promise.all([
      hashPassword(DEFAULT_TEACHER_PASSWORD),
      hashPassword('1234'),
    ]);
    teacherUser = await prisma.user.create({
      data: {
        fullName: 'Amina Ben Ali',
        email: DEMO_TEACHER_EMAIL,
        phone: DEMO_TEACHER_PHONE,
        passwordHash,
        role: 'TEACHER',
        teacherSecretCodeHash,
        teacher: { create: { courseSlugs: ['robotique-14-18', 'python-14-18'] } },
      },
      include: { teacher: true },
    });
    console.log('Created demo teacher account.');
  }
  const teacherId = teacherUser.teacher!.id;

  // --- Two course sessions in the child's age group, taught by the demo
  // teacher --------------------------------------------------------------
  const [roboticsSession, pythonSession] = await Promise.all([
    prisma.courseSession.findFirst({ where: { courseSlug: 'robotique-14-18', dayOfWeek: 3, startTime: '14:00' } }),
    prisma.courseSession.findFirst({ where: { courseSlug: 'python-14-18', dayOfWeek: 3, startTime: '14:00' } }),
  ]);
  if (!roboticsSession || !pythonSession) {
    console.log('Expected course sessions not found — run prisma/seed.ts first.');
    return;
  }
  await Promise.all([
    prisma.courseSession.update({ where: { id: roboticsSession.id }, data: { teacherId } }),
    prisma.courseSession.update({ where: { id: pythonSession.id }, data: { teacherId } }),
  ]);

  // --- Enrollments (found or created) -----------------------------------
  const roboticsEnrollment = await prisma.enrollment.upsert({
    where: { childId_courseSessionId: { childId: child.id, courseSessionId: roboticsSession.id } },
    update: { status: 'ACTIVE' },
    create: { childId: child.id, courseSessionId: roboticsSession.id, status: 'ACTIVE' },
  });
  const pythonEnrollment = await prisma.enrollment.upsert({
    where: { childId_courseSessionId: { childId: child.id, courseSessionId: pythonSession.id } },
    update: { status: 'ACTIVE' },
    create: { childId: child.id, courseSessionId: pythonSession.id, status: 'ACTIVE' },
  });

  const existingBadges = await prisma.badge.count({ where: { childId: child.id } });
  if (existingBadges > 0) {
    console.log('Child already has mock flavor data (badges present) — skipping payments/badges/notes.');
    return;
  }

  // --- Payment plans + payments ------------------------------------------
  // Robotics: paid in full for the year.
  const roboticsPlan = await prisma.paymentPlan.create({
    data: { enrollmentId: roboticsEnrollment.id, type: 'YEARLY', method: 'CASH', amount: 1200, currency: 'TND', startDate: daysAgo(20) },
  });
  await prisma.payment.create({
    data: {
      paymentPlanId: roboticsPlan.id,
      enrollmentId: roboticsEnrollment.id,
      amount: 1200,
      currency: 'TND',
      dueDate: daysAgo(20),
      status: 'PAID',
      paidAt: daysAgo(19),
    },
  });

  // Python: monthly plan with a paid history, one overdue, one upcoming.
  const pythonPlan = await prisma.paymentPlan.create({
    data: { enrollmentId: pythonEnrollment.id, type: 'MONTHLY', method: 'CARD', amount: 150, currency: 'TND', startDate: daysAgo(60) },
  });
  await prisma.payment.createMany({
    data: [
      { paymentPlanId: pythonPlan.id, enrollmentId: pythonEnrollment.id, amount: 150, currency: 'TND', dueDate: daysAgo(60), status: 'PAID', paidAt: daysAgo(59) },
      { paymentPlanId: pythonPlan.id, enrollmentId: pythonEnrollment.id, amount: 150, currency: 'TND', dueDate: daysAgo(30), status: 'PAID', paidAt: daysAgo(28) },
      { paymentPlanId: pythonPlan.id, enrollmentId: pythonEnrollment.id, amount: 150, currency: 'TND', dueDate: daysAgo(3), status: 'OVERDUE' },
      { paymentPlanId: pythonPlan.id, enrollmentId: pythonEnrollment.id, amount: 150, currency: 'TND', dueDate: daysFromNow(27), status: 'PENDING' },
    ],
  });

  // --- Badges, using the real sticker artwork -----------------------------
  await prisma.badge.createMany({
    data: [
      {
        childId: child.id,
        teacherId,
        title: 'Star Student',
        note: 'Consistently prepared and engaged in every robotics session.',
        imageUrl: BADGE_STICKERS[0].url,
        awardedAt: daysAgo(14),
      },
      {
        childId: child.id,
        teacherId,
        title: 'Brilliant Idea',
        note: 'Came up with a clever fix for the line-following sensor.',
        imageUrl: BADGE_STICKERS[1].url,
        awardedAt: daysAgo(7),
      },
      {
        childId: child.id,
        teacherId,
        title: 'Good Job',
        note: 'Finished the Python loops exercise ahead of the class.',
        imageUrl: BADGE_STICKERS[2].url,
        awardedAt: daysAgo(2),
      },
    ],
  });

  // --- Teacher remarks -----------------------------------------------------
  await prisma.teacherNote.createMany({
    data: [
      {
        teacherId,
        childId: child.id,
        courseSessionId: roboticsSession.id,
        enrollmentId: roboticsEnrollment.id,
        content: 'Off to a strong start — already comfortable wiring the sensor board unassisted.',
        createdAt: daysAgo(18),
      },
      {
        teacherId,
        childId: child.id,
        courseSessionId: pythonSession.id,
        enrollmentId: pythonEnrollment.id,
        content: 'Struggled a bit with loops today, recommend 10 minutes of extra practice at home.',
        createdAt: daysAgo(12),
      },
      {
        teacherId,
        childId: child.id,
        courseSessionId: pythonSession.id,
        enrollmentId: pythonEnrollment.id,
        content: 'Great progress on functions this week — ready to move on to classes.',
        createdAt: daysAgo(5),
      },
      {
        teacherId,
        childId: child.id,
        courseSessionId: roboticsSession.id,
        enrollmentId: roboticsEnrollment.id,
        content: 'Please bring the spare motor next session, we ran out of spares in class.',
        createdAt: daysAgo(1),
      },
    ],
  });

  console.log('Seeded mock data for the test parent account.');
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
