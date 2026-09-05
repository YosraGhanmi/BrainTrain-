'use server';

import { z } from 'zod';
import crypto from 'crypto';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db/prisma';
import { hashPassword, verifyPassword } from '@/lib/portal-auth/password';
import {
  createPortalSession,
  destroyPortalSession,
  getPortalSessionUser,
  revokeAllSessions,
  createPendingTeacherToken,
  verifyPendingTeacherToken,
  PENDING_TEACHER_COOKIE_NAME,
} from '@/lib/portal-auth/session';
import { localizedPath } from '@/lib/portal-auth/guard';
import { SELECTED_CHILD_COOKIE } from '@/lib/portal-auth/selected-child';
import { sendSms } from '@/lib/sms/send';
import { sendEmail } from '@/lib/email/send';
import type { AppLocale } from '@/i18n/routing';

function field(formData: FormData, name: string): string {
  return String(formData.get(name) ?? '').trim();
}

function getLocale(formData: FormData): AppLocale {
  const raw = field(formData, 'locale');
  return raw === 'fr' ? 'fr' : 'en';
}

const registerSchema = z.object({
  fullName: z.string().min(2).max(120),
  email: z.string().email(),
  phone: z.string().min(8).max(20),
  password: z.string().min(8).max(200),
});

// ---------------------------------------------------------------------------
// Registration / login / logout
// ---------------------------------------------------------------------------

export async function registerParent(formData: FormData): Promise<void> {
  const locale = getLocale(formData);
  const parsed = registerSchema.safeParse({
    fullName: field(formData, 'fullName'),
    email: field(formData, 'email').toLowerCase(),
    phone: field(formData, 'phone'),
    password: field(formData, 'password'),
  });
  const confirmPassword = field(formData, 'confirmPassword');

  if (!parsed.success || parsed.data.password !== confirmPassword) {
    redirect(localizedPath(locale, '/parent-portal/register?error=1'));
  }

  const { fullName, email, phone, password } = parsed.data;
  const existing = await prisma.user.findFirst({ where: { OR: [{ email }, { phone }] } });
  if (existing) {
    redirect(localizedPath(locale, '/parent-portal/register?error=exists'));
  }

  const passwordHash = await hashPassword(password);
  // Starts as Parent.status PENDING (schema default) — no session is created
  // here; an admin has to approve the account before it can log in.
  await prisma.user.create({
    data: { fullName, email, phone, passwordHash, role: 'PARENT', parent: { create: {} } },
  });

  redirect(localizedPath(locale, '/parent-portal/login?registered=pending'));
}

export async function loginParent(formData: FormData): Promise<void> {
  const locale = getLocale(formData);
  const email = field(formData, 'email').toLowerCase();
  const password = field(formData, 'password');

  const user = await prisma.user.findUnique({ where: { email }, include: { parent: true } });
  const ok = user && user.role === 'PARENT' && (await verifyPassword(password, user.passwordHash));
  if (!ok || !user) {
    redirect(localizedPath(locale, '/parent-portal/login?error=1'));
  }
  if (user!.isFrozen) {
    redirect(localizedPath(locale, '/parent-portal/login?error=frozen'));
  }
  if (user!.parent?.status === 'PENDING') {
    redirect(localizedPath(locale, '/parent-portal/login?error=pending'));
  }
  if (user!.parent?.status === 'REJECTED') {
    redirect(localizedPath(locale, '/parent-portal/login?error=rejected'));
  }

  await createPortalSession(user!.id);
  redirect(localizedPath(locale, '/parent-portal'));
}

export async function loginTeacher(formData: FormData): Promise<void> {
  const locale = getLocale(formData);
  const email = field(formData, 'email').toLowerCase();
  const password = field(formData, 'password');

  const user = await prisma.user.findUnique({ where: { email } });
  const ok = user && user.role === 'TEACHER' && (await verifyPassword(password, user.passwordHash));
  if (!ok || !user) {
    redirect(localizedPath(locale, '/teacher/login?error=1'));
  }
  if (user!.isFrozen) {
    redirect(localizedPath(locale, '/teacher/login?error=frozen'));
  }

  // Accounts predating the secret-code step (none yet, but a safety net for
  // manually-created rows) skip straight to a real session.
  if (!user!.teacherSecretCodeHash) {
    await createPortalSession(user!.id);
    redirect(localizedPath(locale, '/teacher'));
  }

  // Password verified — hold the userId in a short-lived signed cookie and
  // send them to enter their 4-digit code before a real session is created.
  cookies().set(PENDING_TEACHER_COOKIE_NAME, createPendingTeacherToken(user!.id), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 10 * 60,
  });
  redirect(localizedPath(locale, '/teacher/verify'));
}

export async function verifyTeacherSecretCode(formData: FormData): Promise<void> {
  const locale = getLocale(formData);
  const code = field(formData, 'code');

  const userId = verifyPendingTeacherToken(cookies().get(PENDING_TEACHER_COOKIE_NAME)?.value);
  if (!userId) {
    redirect(localizedPath(locale, '/teacher/login?error=1'));
  }

  const user = await prisma.user.findUnique({ where: { id: userId! } });
  const ok =
    user &&
    user.role === 'TEACHER' &&
    !user.isFrozen &&
    user.teacherSecretCodeHash &&
    (await verifyPassword(code, user.teacherSecretCodeHash));
  if (!ok) {
    redirect(localizedPath(locale, '/teacher/verify?error=1'));
  }

  cookies().delete(PENDING_TEACHER_COOKIE_NAME);
  await createPortalSession(user!.id);
  redirect(localizedPath(locale, '/teacher'));
}

export async function loginSecretary(formData: FormData): Promise<void> {
  const email = field(formData, 'email').toLowerCase();
  const password = field(formData, 'password');

  const user = await prisma.user.findUnique({ where: { email } });
  const ok = user && user.role === 'SECRETARY' && (await verifyPassword(password, user.passwordHash));
  if (!ok || !user) {
    redirect('/admin/login?role=secretary&error=1');
  }
  if (user!.isFrozen) {
    redirect('/admin/login?role=secretary&error=frozen');
  }

  await createPortalSession(user!.id);
  redirect('/admin');
}

export async function logoutPortal(redirectTo: string): Promise<void> {
  await destroyPortalSession();
  redirect(redirectTo);
}

// ---------------------------------------------------------------------------
// Parent-portal child switcher (topbar) — persisted via cookie so every tab
// filters to the same child without threading a childId through routes.
// ---------------------------------------------------------------------------

export async function selectChild(formData: FormData): Promise<void> {
  const locale = getLocale(formData);
  const user = await getPortalSessionUser();
  if (!user || user.role !== 'PARENT' || !user.parentId) {
    redirect(localizedPath(locale, '/parent-portal/login'));
  }

  const childId = field(formData, 'childId');
  const pathname = field(formData, 'pathname') || '/parent-portal';
  const redirectTo = localizedPath(locale, pathname);

  const child = await prisma.child.findUnique({ where: { id: childId } });
  if (!child || child.parentId !== user!.parentId) redirect(redirectTo);

  cookies().set(SELECTED_CHILD_COOKIE, childId, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
  });
  redirect(redirectTo);
}

// ---------------------------------------------------------------------------
// Account management (either role)
// ---------------------------------------------------------------------------

export async function changePhone(formData: FormData): Promise<void> {
  const locale = getLocale(formData);
  const user = await getPortalSessionUser();
  if (!user) redirect(localizedPath(locale, '/parent-portal/login'));

  const newPhone = field(formData, 'phone');
  if (newPhone.length < 8) redirect(localizedPath(locale, '/parent-portal/account?error=1'));

  const taken = await prisma.user.findUnique({ where: { phone: newPhone } });
  if (taken && taken.id !== user!.id) {
    redirect(localizedPath(locale, '/parent-portal/account?error=phone-taken'));
  }

  await prisma.user.update({ where: { id: user!.id }, data: { phone: newPhone } });
  redirect(localizedPath(locale, '/parent-portal/account?saved=1'));
}

// A secondary phone can be added freely; the primary phone can only be
// deleted once a secondary is on file, at which point it's promoted to
// primary (the schema keeps `phone` required/unique).
export async function addSecondaryPhone(formData: FormData): Promise<void> {
  const locale = getLocale(formData);
  const user = await getPortalSessionUser();
  if (!user) redirect(localizedPath(locale, '/parent-portal/login'));

  const phone = field(formData, 'secondaryPhone');
  if (phone.length < 8) redirect(localizedPath(locale, '/parent-portal/account?tab=personal&error=1'));

  const taken = await prisma.user.findFirst({ where: { OR: [{ phone }, { secondaryPhone: phone }] } });
  if (taken && taken.id !== user!.id) {
    redirect(localizedPath(locale, '/parent-portal/account?tab=personal&error=phone-taken'));
  }

  await prisma.user.update({ where: { id: user!.id }, data: { secondaryPhone: phone } });
  redirect(localizedPath(locale, '/parent-portal/account?tab=personal&saved=1'));
}

export async function deleteSecondaryPhone(formData: FormData): Promise<void> {
  const locale = getLocale(formData);
  const user = await getPortalSessionUser();
  if (!user) redirect(localizedPath(locale, '/parent-portal/login'));

  await prisma.user.update({ where: { id: user!.id }, data: { secondaryPhone: null } });
  redirect(localizedPath(locale, '/parent-portal/account?tab=personal&saved=1'));
}

export async function deletePrimaryPhone(formData: FormData): Promise<void> {
  const locale = getLocale(formData);
  const user = await getPortalSessionUser();
  if (!user) redirect(localizedPath(locale, '/parent-portal/login'));

  const dbUser = await prisma.user.findUnique({ where: { id: user!.id } });
  if (!dbUser?.secondaryPhone) {
    // Nothing to promote — the primary phone must always stay set.
    redirect(localizedPath(locale, '/parent-portal/account?tab=personal&error=no-secondary'));
  }

  await prisma.user.update({
    where: { id: user!.id },
    data: { phone: dbUser!.secondaryPhone!, secondaryPhone: null },
  });
  redirect(localizedPath(locale, '/parent-portal/account?tab=personal&saved=1'));
}

export async function updateBackupEmail(formData: FormData): Promise<void> {
  const locale = getLocale(formData);
  const user = await getPortalSessionUser();
  if (!user) redirect(localizedPath(locale, '/parent-portal/login'));

  const backupEmail = field(formData, 'backupEmail').toLowerCase();
  if (!backupEmail || !backupEmail.includes('@')) {
    redirect(localizedPath(locale, '/parent-portal/account?tab=personal&error=1'));
  }

  await prisma.user.update({ where: { id: user!.id }, data: { backupEmail } });
  redirect(localizedPath(locale, '/parent-portal/account?tab=personal&saved=1'));
}

export async function deleteBackupEmail(formData: FormData): Promise<void> {
  const locale = getLocale(formData);
  const user = await getPortalSessionUser();
  if (!user) redirect(localizedPath(locale, '/parent-portal/login'));

  await prisma.user.update({ where: { id: user!.id }, data: { backupEmail: null } });
  redirect(localizedPath(locale, '/parent-portal/account?tab=personal&saved=1'));
}

export async function changePassword(formData: FormData): Promise<void> {
  const locale = getLocale(formData);
  const user = await getPortalSessionUser();
  if (!user) redirect(localizedPath(locale, '/parent-portal/login'));

  const currentPassword = field(formData, 'currentPassword');
  const newPassword = field(formData, 'newPassword');
  const confirmPassword = field(formData, 'confirmPassword');

  const dbUser = await prisma.user.findUnique({ where: { id: user!.id } });
  const currentOk = dbUser && (await verifyPassword(currentPassword, dbUser.passwordHash));
  if (!currentOk || newPassword.length < 8 || newPassword !== confirmPassword) {
    redirect(localizedPath(locale, '/parent-portal/account?error=1'));
  }

  const passwordHash = await hashPassword(newPassword);
  await prisma.user.update({ where: { id: user!.id }, data: { passwordHash } });
  // Revoking every session (including the current one) forces a fresh login
  // with the new password, closing out any stolen/old session cookie.
  await revokeAllSessions(user!.id);
  await destroyPortalSession();
  redirect(localizedPath(locale, '/parent-portal/login?saved=password-changed'));
}

// ---------------------------------------------------------------------------
// Two-factor auth (email OTP). Enforcement at login is not wired up yet —
// see lib/email/send.ts — this wires the enable/verify/disable flow end to
// end against a placeholder mailer.
// ---------------------------------------------------------------------------

const TWO_FACTOR_CODE_TTL_MS = 10 * 60 * 1000;

export async function requestTwoFactorEnable(formData: FormData): Promise<void> {
  const locale = getLocale(formData);
  const user = await getPortalSessionUser();
  if (!user) redirect(localizedPath(locale, '/parent-portal/login'));

  const dbUser = await prisma.user.findUnique({ where: { id: user!.id } });
  const destination = dbUser?.backupEmail || dbUser?.email;
  if (!dbUser || !destination) {
    redirect(localizedPath(locale, '/parent-portal/account?tab=security&error=1'));
  }

  const code = crypto.randomInt(100000, 999999).toString();
  await prisma.user.update({
    where: { id: user!.id },
    data: { twoFactorCodeHash: hashCode(code), twoFactorCodeExpiresAt: new Date(Date.now() + TWO_FACTOR_CODE_TTL_MS) },
  });
  await sendEmail({
    to: destination!,
    subject: 'Your BrainTrain verification code',
    text: `Your two-factor authentication code is ${code}. It expires in 10 minutes.`,
  }).catch(() => undefined);

  redirect(localizedPath(locale, '/parent-portal/account?tab=security&verify2fa=1'));
}

export async function confirmTwoFactorEnable(formData: FormData): Promise<void> {
  const locale = getLocale(formData);
  const user = await getPortalSessionUser();
  if (!user) redirect(localizedPath(locale, '/parent-portal/login'));

  const code = field(formData, 'code');
  const dbUser = await prisma.user.findUnique({ where: { id: user!.id } });

  const ok =
    dbUser?.twoFactorCodeHash &&
    dbUser.twoFactorCodeExpiresAt &&
    dbUser.twoFactorCodeExpiresAt > new Date() &&
    dbUser.twoFactorCodeHash === hashCode(code);

  if (!ok) {
    redirect(localizedPath(locale, '/parent-portal/account?tab=security&verify2fa=1&error=1'));
  }

  await prisma.user.update({
    where: { id: user!.id },
    data: { twoFactorEnabled: true, twoFactorCodeHash: null, twoFactorCodeExpiresAt: null },
  });
  redirect(localizedPath(locale, '/parent-portal/account?tab=security&saved=1'));
}

export async function disableTwoFactor(formData: FormData): Promise<void> {
  const locale = getLocale(formData);
  const user = await getPortalSessionUser();
  if (!user) redirect(localizedPath(locale, '/parent-portal/login'));

  const currentPassword = field(formData, 'currentPassword');
  const dbUser = await prisma.user.findUnique({ where: { id: user!.id } });
  const ok = dbUser && (await verifyPassword(currentPassword, dbUser.passwordHash));
  if (!ok) {
    redirect(localizedPath(locale, '/parent-portal/account?tab=security&error=1'));
  }

  await prisma.user.update({
    where: { id: user!.id },
    data: { twoFactorEnabled: false, twoFactorCodeHash: null, twoFactorCodeExpiresAt: null },
  });
  redirect(localizedPath(locale, '/parent-portal/account?tab=security&saved=1'));
}

// ---------------------------------------------------------------------------
// Forgot / reset password — parents only, via SMS OTP (see plan: no email
// provider was introduced since the system already collects a phone number).
// ---------------------------------------------------------------------------

const OTP_TTL_MS = 10 * 60 * 1000;

function hashCode(code: string): string {
  return crypto.createHash('sha256').update(code).digest('hex');
}

export async function requestPasswordResetOtp(formData: FormData): Promise<void> {
  const locale = getLocale(formData);
  const phone = field(formData, 'phone');

  const user = await prisma.user.findUnique({ where: { phone }, include: { parent: true } });
  // Always redirect to the same "check your phone" step, whether or not the
  // phone number matched a real account — avoids leaking which phone numbers
  // are registered.
  if (user && user.role === 'PARENT' && user.parent) {
    const code = crypto.randomInt(100000, 999999).toString();
    await prisma.passwordResetToken.create({
      data: { userId: user.id, codeHash: hashCode(code), expiresAt: new Date(Date.now() + OTP_TTL_MS) },
    });
    await sendSms({
      parentId: user.parent.id,
      phone: user.phone,
      message: `Your BrainTrain password reset code is ${code}. It expires in 10 minutes.`,
      purpose: 'PASSWORD_RESET',
    }).catch(() => undefined);
  }

  redirect(localizedPath(locale, `/parent-portal/reset-password?phone=${encodeURIComponent(phone)}`));
}

export async function confirmPasswordReset(formData: FormData): Promise<void> {
  const locale = getLocale(formData);
  const phone = field(formData, 'phone');
  const code = field(formData, 'code');
  const newPassword = field(formData, 'newPassword');
  const confirmPassword = field(formData, 'confirmPassword');

  const fail = () =>
    redirect(localizedPath(locale, `/parent-portal/reset-password?phone=${encodeURIComponent(phone)}&error=1`));

  if (newPassword.length < 8 || newPassword !== confirmPassword) fail();

  const user = await prisma.user.findUnique({ where: { phone } });
  if (!user) fail();

  const token = await prisma.passwordResetToken.findFirst({
    where: { userId: user!.id, consumedAt: null, expiresAt: { gt: new Date() }, codeHash: hashCode(code) },
    orderBy: { createdAt: 'desc' },
  });
  if (!token) fail();

  const passwordHash = await hashPassword(newPassword);
  await prisma.$transaction([
    prisma.user.update({ where: { id: user!.id }, data: { passwordHash } }),
    prisma.passwordResetToken.update({ where: { id: token!.id }, data: { consumedAt: new Date() } }),
  ]);
  await revokeAllSessions(user!.id);

  redirect(localizedPath(locale, '/parent-portal/login?saved=reset'));
}
