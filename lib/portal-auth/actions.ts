'use server';

import { z } from 'zod';
import crypto from 'crypto';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db/prisma';
import { hashPassword, verifyPassword } from '@/lib/portal-auth/password';
import { createPortalSession, destroyPortalSession, getPortalSessionUser, revokeAllSessions } from '@/lib/portal-auth/session';
import { localizedPath } from '@/lib/portal-auth/guard';
import { sendSms } from '@/lib/sms/send';
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
  const user = await prisma.user.create({
    data: { fullName, email, phone, passwordHash, role: 'PARENT', parent: { create: {} } },
  });

  await createPortalSession(user.id);
  redirect(localizedPath(locale, '/parent-portal'));
}

export async function loginParent(formData: FormData): Promise<void> {
  const locale = getLocale(formData);
  const email = field(formData, 'email').toLowerCase();
  const password = field(formData, 'password');

  const user = await prisma.user.findUnique({ where: { email } });
  const ok = user && user.role === 'PARENT' && (await verifyPassword(password, user.passwordHash));
  if (!ok || !user) {
    redirect(localizedPath(locale, '/parent-portal/login?error=1'));
  }

  await createPortalSession(user.id);
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

  await createPortalSession(user.id);
  redirect(localizedPath(locale, '/teacher'));
}

export async function logoutPortal(redirectTo: string): Promise<void> {
  await destroyPortalSession();
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
