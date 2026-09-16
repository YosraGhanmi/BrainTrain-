/**
 * BrainTrain — MySQL → Firebase one-time migration script
 *
 * Run ONCE in maintenance mode (while the app is down) to copy all
 * existing Prisma/MySQL data to Firestore.
 *
 * Usage:
 *   npx tsx scripts/migrate-mysql-to-firebase.ts
 *
 * Prerequisites:
 *   - MySQL must be running and DATABASE_URL must be set
 *   - Firebase Admin SDK credentials must be set (FIREBASE_PROJECT_ID etc.)
 *   - Run from the project root
 */

import { PrismaClient } from '@prisma/client';
import { cert, initializeApp, getApps, getApp } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';

// Parse .env.local manually if present without requiring external dotenv package
try {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    for (const line of envConfig.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx > 0) {
        const key = trimmed.slice(0, eqIdx).trim();
        const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
        if (!process.env[key]) process.env[key] = val;
      }
    }
  }
} catch {
  // best effort env loading
}

const prisma = new PrismaClient();

function initFirebase() {
  if (getApps().length > 0) return getApp();
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  return initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID!,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
      privateKey: privateKey!,
    }),
  });
}

const app = initFirebase();
const db = getFirestore(app);

async function migrate() {
  console.log('🚀 Starting MySQL → Firestore migration...\n');

  // -------------------------------------------------------------------------
  // 1. Users (parents, teachers, secretaries)
  // -------------------------------------------------------------------------
  console.log('📦 Migrating users...');
  const users = await prisma.user.findMany({ include: { parent: true, teacher: true } });
  let userCount = 0;
  for (const user of users) {
    const doc: Record<string, unknown> = {
      email: user.email,
      phone: user.phone,
      secondaryPhone: user.secondaryPhone ?? null,
      backupEmail: user.backupEmail ?? null,
      fullName: user.fullName,
      role: user.role,
      isFrozen: user.isFrozen,
      twoFactorEnabled: user.twoFactorEnabled,
      createdAt: user.createdAt,
    };

    if (user.role === 'PARENT' && user.parent) {
      doc.parentId = user.id;
      doc.parentStatus = user.parent.status;
    }
    if (user.role === 'TEACHER' && user.teacher) {
      doc.teacherId = user.id;
      doc.courseSlugs = user.teacher.courseSlugs;
      doc.teacherSecretCodeHash = user.teacherSecretCodeHash ?? null;
      doc.teacherSecretCode = user.teacherSecretCode ?? null;
    }
    if (user.role === 'SECRETARY') {
      doc.passwordHash = user.passwordHash;
    }

    await db.collection('users').doc(user.id).set(doc);
    userCount++;
    process.stdout.write(`\r  ${userCount}/${users.length} users`);
  }
  console.log(`\n  ✅ ${userCount} users migrated`);

  // -------------------------------------------------------------------------
  // 2. Children
  // -------------------------------------------------------------------------
  console.log('📦 Migrating children...');
  const children = await prisma.child.findMany();
  let childCount = 0;
  for (const child of children) {
    await db.collection('children').doc(child.id).set({
      parentId: child.parentId,
      fullName: child.fullName,
      dateOfBirth: child.dateOfBirth,
      ageGroupSlug: child.ageGroupSlug,
      institution: child.institution ?? null,
      specialNeeds: child.specialNeeds ?? null,
      photoUrl: child.photoUrl ?? null,
      photoColor: child.photoColor ?? null,
      createdAt: child.createdAt,
    });
    childCount++;
  }
  console.log(`  ✅ ${childCount} children migrated`);

  // -------------------------------------------------------------------------
  // 3. Time slots
  // -------------------------------------------------------------------------
  console.log('📦 Migrating time slots...');
  const slots = await prisma.timeSlot.findMany();
  for (const slot of slots) {
    await db.collection('time_slots').doc(slot.id).set({
      label: slot.label,
      dayOfWeek: slot.dayOfWeek,
      startTime: slot.startTime,
      endTime: slot.endTime,
      createdAt: slot.createdAt,
      updatedAt: slot.updatedAt,
    });
  }
  console.log(`  ✅ ${slots.length} time slots migrated`);

  // -------------------------------------------------------------------------
  // 4. Course sessions
  // -------------------------------------------------------------------------
  console.log('📦 Migrating course sessions...');
  const sessions = await prisma.courseSession.findMany();
  for (const session of sessions) {
    await db.collection('course_sessions').doc(session.id).set({
      courseSlug: session.courseSlug,
      teacherId: session.teacherId ?? null,
      dayOfWeek: session.dayOfWeek,
      startTime: session.startTime,
      endTime: session.endTime,
      location: session.location,
      capacity: session.capacity,
      term: session.term,
      createdAt: session.createdAt,
    });
  }
  console.log(`  ✅ ${sessions.length} course sessions migrated`);

  // -------------------------------------------------------------------------
  // 5. Enrollments
  // -------------------------------------------------------------------------
  console.log('📦 Migrating enrollments...');
  const enrollments = await prisma.enrollment.findMany();
  for (const e of enrollments) {
    await db.collection('enrollments').doc(e.id).set({
      childId: e.childId,
      courseSessionId: e.courseSessionId,
      status: e.status,
      enrolledAt: e.enrolledAt,
    });
  }
  console.log(`  ✅ ${enrollments.length} enrollments migrated`);

  // -------------------------------------------------------------------------
  // 6. Payment plans
  // -------------------------------------------------------------------------
  console.log('📦 Migrating payment plans...');
  const plans = await prisma.paymentPlan.findMany();
  for (const plan of plans) {
    await db.collection('payment_plans').doc(plan.id).set({
      enrollmentId: plan.enrollmentId,
      type: plan.type,
      method: plan.method,
      amount: Number(plan.amount),
      currency: plan.currency,
      startDate: plan.startDate,
      createdAt: plan.createdAt,
    });
  }
  console.log(`  ✅ ${plans.length} payment plans migrated`);

  // -------------------------------------------------------------------------
  // 7. Payments
  // -------------------------------------------------------------------------
  console.log('📦 Migrating payments...');
  const payments = await prisma.payment.findMany();
  for (const p of payments) {
    await db.collection('payments').doc(p.id).set({
      paymentPlanId: p.paymentPlanId,
      enrollmentId: p.enrollmentId,
      amount: Number(p.amount),
      currency: p.currency,
      dueDate: p.dueDate,
      status: p.status,
      paidAt: p.paidAt ?? null,
      parentNotifiedAt: p.parentNotifiedAt ?? null,
      stripeSessionId: p.stripeSessionId ?? null,
      stripePaymentIntentId: p.stripePaymentIntentId ?? null,
      createdAt: p.createdAt,
    });
  }
  console.log(`  ✅ ${payments.length} payments migrated`);

  // -------------------------------------------------------------------------
  // 8. Pricing rules
  // -------------------------------------------------------------------------
  console.log('📦 Migrating pricing rules...');
  const rules = await prisma.pricingRule.findMany();
  for (const rule of rules) {
    await db.collection('pricing_rules').add({
      planType: rule.planType,
      ageGroupSlug: rule.ageGroupSlug ?? null,
      courseSlug: rule.courseSlug ?? null,
      amount: Number(rule.amount),
      currency: rule.currency,
      updatedAt: rule.updatedAt,
    });
  }
  console.log(`  ✅ ${rules.length} pricing rules migrated`);

  // -------------------------------------------------------------------------
  // 9. Expenses
  // -------------------------------------------------------------------------
  console.log('📦 Migrating expenses...');
  const expenses = await prisma.expense.findMany();
  for (const expense of expenses) {
    await db.collection('expenses').doc(expense.id).set({
      label: expense.label,
      amount: Number(expense.amount),
      currency: expense.currency,
      category: expense.category ?? null,
      note: expense.note ?? null,
      date: expense.date,
      createdByName: expense.createdByName,
      createdByRole: expense.createdByRole,
      createdAt: expense.createdAt,
    });
  }
  console.log(`  ✅ ${expenses.length} expenses migrated`);

  // -------------------------------------------------------------------------
  // 10. Notifications
  // -------------------------------------------------------------------------
  console.log('📦 Migrating notifications...');
  const notifications = await prisma.notification.findMany();
  for (const n of notifications) {
    await db.collection('notifications').doc(n.id).set({
      type: n.type,
      title: n.title,
      body: n.body ?? null,
      link: n.link ?? null,
      readAt: n.readAt ?? null,
      createdAt: n.createdAt,
    });
  }
  console.log(`  ✅ ${notifications.length} notifications migrated`);

  // -------------------------------------------------------------------------
  // 11. SMS notifications
  // -------------------------------------------------------------------------
  console.log('📦 Migrating SMS notifications...');
  const smsLogs = await prisma.sMSNotification.findMany();
  for (const sms of smsLogs) {
    await db.collection('sms_notifications').doc(sms.id).set({
      parentId: sms.parentId,
      phone: sms.phone,
      message: sms.message,
      purpose: sms.purpose,
      status: sms.status,
      provider: sms.provider,
      providerMessageId: sms.providerMessageId ?? null,
      relatedPaymentId: sms.relatedPaymentId ?? null,
      createdAt: sms.createdAt,
    });
  }
  console.log(`  ✅ ${smsLogs.length} SMS logs migrated`);

  // -------------------------------------------------------------------------
  // 12. Teacher notes
  // -------------------------------------------------------------------------
  console.log('📦 Migrating teacher notes...');
  const notes = await prisma.teacherNote.findMany();
  for (const note of notes) {
    await db.collection('teacher_notes').doc(note.id).set({
      teacherId: note.teacherId,
      childId: note.childId,
      courseSessionId: note.courseSessionId,
      enrollmentId: note.enrollmentId ?? null,
      content: note.content,
      createdAt: note.createdAt,
    });
  }
  console.log(`  ✅ ${notes.length} teacher notes migrated`);

  // -------------------------------------------------------------------------
  // 13. Badges
  // -------------------------------------------------------------------------
  console.log('📦 Migrating badges...');
  const badges = await prisma.badge.findMany();
  for (const badge of badges) {
    await db.collection('badges').doc(badge.id).set({
      childId: badge.childId,
      teacherId: badge.teacherId,
      courseSessionId: badge.courseSessionId ?? null,
      title: badge.title,
      note: badge.note ?? null,
      emoji: badge.emoji,
      imageUrl: badge.imageUrl ?? null,
      awardedAt: badge.awardedAt,
    });
  }
  console.log(`  ✅ ${badges.length} badges migrated`);

  // -------------------------------------------------------------------------
  // 14. Preinscriptions
  // -------------------------------------------------------------------------
  console.log('📦 Migrating preinscriptions...');
  const preinscriptions = await prisma.preinscription.findMany();
  for (const p of preinscriptions) {
    await db.collection('preinscriptions').doc(p.id).set({
      childFullName: p.childFullName,
      childAge: p.childAge,
      institution: p.institution,
      parentFullName: p.parentFullName,
      parentPhone: p.parentPhone,
      createdAt: p.createdAt,
    });
  }
  console.log(`  ✅ ${preinscriptions.length} preinscriptions migrated`);

  // -------------------------------------------------------------------------
  // Summary
  // -------------------------------------------------------------------------
  console.log('\n✅ Migration complete!\n');
  console.log('Summary:');
  console.log(`  Users:          ${userCount}`);
  console.log(`  Children:       ${children.length}`);
  console.log(`  Time slots:     ${slots.length}`);
  console.log(`  Course sessions:${sessions.length}`);
  console.log(`  Enrollments:    ${enrollments.length}`);
  console.log(`  Payment plans:  ${plans.length}`);
  console.log(`  Payments:       ${payments.length}`);
  console.log(`  Pricing rules:  ${rules.length}`);
  console.log(`  Expenses:       ${expenses.length}`);
  console.log(`  Notifications:  ${notifications.length}`);
  console.log(`  SMS logs:       ${smsLogs.length}`);
  console.log(`  Teacher notes:  ${notes.length}`);
  console.log(`  Badges:         ${badges.length}`);
  console.log(`  Preinscriptions:${preinscriptions.length}`);

  await prisma.$disconnect();
}

migrate().catch((err) => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
