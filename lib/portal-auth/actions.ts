'use server';

import { z } from 'zod';
import crypto from 'crypto';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { verifyPassword } from '@/lib/portal-auth/password';
import {
  createPortalSession,
  destroyPortalSession,
  getPortalSessionUser,
  revokeAllSessions,
  createPendingTeacherToken,
  verifyPendingTeacherToken,
  PENDING_TEACHER_COOKIE_NAME,
  createPendingParentToken,
  verifyPendingParentToken,
  PENDING_PARENT_COOKIE_NAME,
  PENDING_PARENT_TTL_MS,
} from '@/lib/portal-auth/session';
import { clearAttempts, clientIp, takeAttempt, takeAttempts, WINDOW } from '@/lib/auth/rate-limit';
import { localizedPath } from '@/lib/portal-auth/guard';
import { safeReturnPath, withReturnPath } from '@/lib/portal-auth/return-path';
import { SESSION_COOKIE_NAME } from '@/lib/auth/session';
import { SELECTED_CHILD_COOKIE } from '@/lib/portal-auth/selected-child';
import { sendSms } from '@/lib/sms/send';
import { sendEmail } from '@/lib/email/send';
import {
  createDbParentProfile,
  getDbParentByPhone,
  getDbPasswordReset,
  getDbPortalProfile,
  setDbUserPassword,
  updateDbPortalProfile,
  verifyDbUserPassword,
} from '@/lib/db/portal-auth';
import { getDbChild } from '@/lib/db/children';
import { getDbTeacherProfile } from '@/lib/db/teachers';
import { getDbSecretaryProfile } from '@/lib/db/secretaries';
import type { AppLocale } from '@/i18n/routing';

function field(formData: FormData, name: string): string {
  return String(formData.get(name) ?? '').trim();
}

function getLocale(formData: FormData): AppLocale {
  const raw = field(formData, 'locale');
  return raw === 'fr' ? 'fr' : 'en';
}

// Sign-in attempts: per account and per address, so neither one account from
// many addresses nor many accounts from one address can be hammered
async function loginAllowed(email: string): Promise<boolean> {
  return takeAttempts([
    [`login:${email}`, 10, WINDOW.fifteenMinutes],
    [`login-ip:${await clientIp()}`, 30, WINDOW.fifteenMinutes],
  ]);
}

// One-time codes: a handful of tries, then the code is thrown away
const CODE_ATTEMPTS = 5;
const TWO_FACTOR_CODE_TTL_MS = 10 * 60 * 1000;

function hashCode(code: string): string {
  return crypto.createHash('sha256').update(code).digest('hex');
}

function newSixDigitCode(): string {
  return crypto.randomInt(0, 1_000_000).toString().padStart(6, '0');
}

function codeMatches(storedHash: string, code: string): boolean {
  const a = Buffer.from(storedHash);
  const b = Buffer.from(hashCode(code));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

const registerSchema = z.object({
  fullName: z.string().min(2).max(120),
  email: z.string().email().max(254),
  phone: z.string().min(8).max(20),
  password: z.string().min(8).max(200),
});

// ---------------------------------------------------------------------------
// Registration / login / logout
// ---------------------------------------------------------------------------

export async function registerParent(formData: FormData): Promise<void> {
  const locale = getLocale(formData);
  const from = safeReturnPath(field(formData, 'from'));
  const parsed = registerSchema.safeParse({
    fullName: field(formData, 'fullName'),
    email: field(formData, 'email').toLowerCase(),
    phone: field(formData, 'phone'),
    password: field(formData, 'password'),
  });
  const confirmPassword = field(formData, 'confirmPassword');

  if (!parsed.success || parsed.data.password !== confirmPassword) {
    redirect(localizedPath(locale, withReturnPath('/parent-portal/register?error=1', from)));
  }
  if (!(await takeAttempt(`register-ip:${await clientIp()}`, 5, WINDOW.hour))) {
    redirect(localizedPath(locale, withReturnPath('/parent-portal/register?error=throttled', from)));
  }

  const { fullName, email, phone, password } = parsed.data;
  try {
    await createDbParentProfile({ fullName, email, phone, password });
  } catch {
    redirect(localizedPath(locale, withReturnPath('/parent-portal/register?error=exists', from)));
  }
  redirect(localizedPath(locale, '/parent-portal/pending'));
}

export async function loginParent(formData: FormData): Promise<void> {
  const locale = getLocale(formData);
  const from = safeReturnPath(field(formData, 'from'));
  const email = field(formData, 'email').toLowerCase();
  const password = field(formData, 'password');

  if (!(await loginAllowed(email))) {
    redirect(localizedPath(locale, withReturnPath('/parent-portal/login?error=throttled', from)));
  }

  const userId = await verifyDbUserPassword(email, password);
  const profile = userId ? await getDbPortalProfile(userId) : null;
  if (!profile || profile.role !== 'PARENT') {
    redirect(localizedPath(locale, withReturnPath('/parent-portal/login?error=1', from)));
  }
  if (profile.isFrozen) redirect(localizedPath(locale, withReturnPath('/parent-portal/login?error=frozen', from)));
  if (profile.parentStatus === 'PENDING') redirect(localizedPath(locale, withReturnPath('/parent-portal/login?error=pending', from)));
  if (profile.parentStatus === 'REJECTED') redirect(localizedPath(locale, withReturnPath('/parent-portal/login?error=rejected', from)));
  await clearAttempts(`login:${email}`);

  // Two-factor sign-in: the password alone doesn't open a session. A code
  // goes to the backup email (or the account email) and is asked next.
  if (profile.twoFactorEnabled) {
    const code = newSixDigitCode();
    await updateDbPortalProfile(profile.id, {
      twoFactorCodeHash: hashCode(code),
      twoFactorCodeExpiresAt: new Date(Date.now() + TWO_FACTOR_CODE_TTL_MS),
    });
    await clearAttempts(`2fa:${profile.id}`);
    await sendEmail({
      to: profile.backupEmail || profile.email,
      subject: 'Your BrainTrain sign-in code',
      text: `Your sign-in code is ${code}. It expires in 10 minutes. If you did not try to sign in, change your password.`,
    }).catch(() => undefined);
    (await cookies()).set(PENDING_PARENT_COOKIE_NAME, createPendingParentToken(profile.id), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: PENDING_PARENT_TTL_MS / 1000,
    });
    redirect(localizedPath(locale, '/parent-portal/verify'));
  }

  await createPortalSession(profile.id);
  redirect(localizedPath(locale, '/parent-portal'));
}

// Second step of a two-factor parent sign-in (see loginParent)
export async function verifyParentTwoFactor(formData: FormData): Promise<void> {
  const locale = getLocale(formData);
  const code = field(formData, 'code');
  const store = await cookies();

  const uid = verifyPendingParentToken(store.get(PENDING_PARENT_COOKIE_NAME)?.value);
  if (!uid) redirect(localizedPath(locale, '/parent-portal/login?error=1'));

  if (!(await takeAttempt(`2fa:${uid}`, CODE_ATTEMPTS, WINDOW.tenMinutes))) {
    await updateDbPortalProfile(uid!, { twoFactorCodeHash: null, twoFactorCodeExpiresAt: null });
    store.delete(PENDING_PARENT_COOKIE_NAME);
    redirect(localizedPath(locale, '/parent-portal/login?error=throttled'));
  }

  const profile = await getDbPortalProfile(uid!);
  const ok =
    profile &&
    profile.role === 'PARENT' &&
    !profile.isFrozen &&
    profile.parentStatus === 'APPROVED' &&
    profile.twoFactorCodeHash &&
    profile.twoFactorCodeExpiresAt &&
    profile.twoFactorCodeExpiresAt > new Date() &&
    codeMatches(profile.twoFactorCodeHash, code);
  if (!ok) redirect(localizedPath(locale, '/parent-portal/verify?error=1'));

  await updateDbPortalProfile(uid!, { twoFactorCodeHash: null, twoFactorCodeExpiresAt: null });
  await clearAttempts(`2fa:${uid}`);
  store.delete(PENDING_PARENT_COOKIE_NAME);
  await createPortalSession(uid!);
  redirect(localizedPath(locale, '/parent-portal'));
}

export async function loginTeacher(formData: FormData): Promise<void> {
  const locale = getLocale(formData);
  const email = field(formData, 'email').toLowerCase();
  const password = field(formData, 'password');

  if (!(await loginAllowed(email))) redirect(localizedPath(locale, '/teacher/login?error=throttled'));

  // Step 1: email + password
  const userId = await verifyDbUserPassword(email, password);
  if (!userId) redirect(localizedPath(locale, '/teacher/login?error=1'));

  const profile = await getDbTeacherProfile(userId!);
  if (!profile) redirect(localizedPath(locale, '/teacher/login?error=1'));
  if (profile!.isFrozen) redirect(localizedPath(locale, '/teacher/login?error=frozen'));
  await clearAttempts(`login:${email}`);

  // Step 2: if a PIN hash exists, require the PIN step
  if (profile!.teacherSecretCodeHash) {
    (await cookies()).set(PENDING_TEACHER_COOKIE_NAME, createPendingTeacherToken(profile!.id), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 10 * 60,
    });
    redirect(localizedPath(locale, '/teacher/verify'));
  }

  // No PIN set — create session immediately
  await createPortalSession(profile!.id);
  redirect(localizedPath(locale, '/teacher'));
}

export async function verifyTeacherSecretCode(formData: FormData): Promise<void> {
  const locale = getLocale(formData);
  const code = field(formData, 'code');

  const uid = verifyPendingTeacherToken((await cookies()).get(PENDING_TEACHER_COOKIE_NAME)?.value);
  if (!uid) redirect(localizedPath(locale, '/teacher/login?error=1'));

  // A few tries per teacher, however many times the password step is redone
  if (!(await takeAttempt(`pin:${uid}`, CODE_ATTEMPTS, WINDOW.fifteenMinutes))) {
    (await cookies()).delete(PENDING_TEACHER_COOKIE_NAME);
    redirect(localizedPath(locale, '/teacher/login?error=throttled'));
  }

  const profile = await getDbTeacherProfile(uid!);
  const ok =
    profile &&
    !profile.isFrozen &&
    profile.teacherSecretCodeHash &&
    (await verifyPassword(code, profile.teacherSecretCodeHash));
  if (!ok) redirect(localizedPath(locale, '/teacher/verify?error=1'));

  await clearAttempts(`pin:${uid}`);
  (await cookies()).delete(PENDING_TEACHER_COOKIE_NAME);
  await createPortalSession(uid!);
  redirect(localizedPath(locale, '/teacher'));
}

export async function loginSecretary(formData: FormData): Promise<void> {
  const email = field(formData, 'email').toLowerCase();
  const password = field(formData, 'password');

  if (!(await loginAllowed(email))) redirect('/admin/login?role=secretary&error=throttled');

  const userId = await verifyDbUserPassword(email, password);
  if (!userId) redirect('/admin/login?role=secretary&error=1');

  const profile = await getDbSecretaryProfile(userId!);
  if (!profile) redirect('/admin/login?role=secretary&error=1');
  if (profile!.isFrozen) redirect('/admin/login?role=secretary&error=frozen');
  await clearAttempts(`login:${email}`);

  // Clear any leftover admin env-cookie so it doesn't take priority
  (await cookies()).delete(SESSION_COOKIE_NAME);
  await createPortalSession(profile!.id);
  redirect('/admin');
}

export async function logoutPortal(redirectTo: string): Promise<void> {
  await destroyPortalSession();
  // Only ever back to a page of this site
  redirect(safeReturnPath(redirectTo) ?? '/');
}

// ---------------------------------------------------------------------------
// Parent-portal child switcher
// ---------------------------------------------------------------------------

export async function selectChild(formData: FormData): Promise<void> {
  const user = await getPortalSessionUser();
  if (!user || user.role !== 'PARENT' || !user.parentId) return;

  const childId = field(formData, 'childId');

  const child = await getDbChild(childId);
  if (!child || child.parentId !== user.parentId) return;

  (await cookies()).set(SELECTED_CHILD_COOKIE, childId, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
  });

  revalidatePath('/', 'layout');
}

// ---------------------------------------------------------------------------
// Account management
// ---------------------------------------------------------------------------

export async function changePhone(formData: FormData): Promise<void> {
  const locale = getLocale(formData);
  const user = await getPortalSessionUser();
  if (!user) redirect(localizedPath(locale, '/parent-portal/login'));

  const newPhone = field(formData, 'phone');
  if (newPhone.length < 8) redirect(localizedPath(locale, '/parent-portal/account?error=1'));

  await updateDbPortalProfile(user!.id, { phone: newPhone });
  redirect(localizedPath(locale, '/parent-portal/account?saved=1'));
}

export async function addSecondaryPhone(formData: FormData): Promise<void> {
  const locale = getLocale(formData);
  const user = await getPortalSessionUser();
  if (!user) redirect(localizedPath(locale, '/parent-portal/login'));

  const phone = field(formData, 'secondaryPhone');
  if (phone.length < 8) redirect(localizedPath(locale, '/parent-portal/account?tab=personal&error=1'));

  await updateDbPortalProfile(user!.id, { secondaryPhone: phone });
  redirect(localizedPath(locale, '/parent-portal/account?tab=personal&saved=1'));
}

export async function deleteSecondaryPhone(formData: FormData): Promise<void> {
  const locale = getLocale(formData);
  const user = await getPortalSessionUser();
  if (!user) redirect(localizedPath(locale, '/parent-portal/login'));

  await updateDbPortalProfile(user!.id, { secondaryPhone: null });
  redirect(localizedPath(locale, '/parent-portal/account?tab=personal&saved=1'));
}

export async function deletePrimaryPhone(formData: FormData): Promise<void> {
  const locale = getLocale(formData);
  const user = await getPortalSessionUser();
  if (!user) redirect(localizedPath(locale, '/parent-portal/login'));

  const profile = await getDbPortalProfile(user!.id);
  if (!profile?.secondaryPhone) {
    redirect(localizedPath(locale, '/parent-portal/account?tab=personal&error=no-secondary'));
  }
  await updateDbPortalProfile(user!.id, { phone: profile!.secondaryPhone!, secondaryPhone: null });
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

  await updateDbPortalProfile(user!.id, { backupEmail });
  redirect(localizedPath(locale, '/parent-portal/account?tab=personal&saved=1'));
}

export async function deleteBackupEmail(formData: FormData): Promise<void> {
  const locale = getLocale(formData);
  const user = await getPortalSessionUser();
  if (!user) redirect(localizedPath(locale, '/parent-portal/login'));

  await updateDbPortalProfile(user!.id, { backupEmail: null });
  redirect(localizedPath(locale, '/parent-portal/account?tab=personal&saved=1'));
}

export async function changePassword(formData: FormData): Promise<void> {
  const locale = getLocale(formData);
  const user = await getPortalSessionUser();
  if (!user) redirect(localizedPath(locale, '/parent-portal/login'));

  const currentPassword = field(formData, 'currentPassword');
  const newPassword = field(formData, 'newPassword');
  const confirmPassword = field(formData, 'confirmPassword');

  if (newPassword.length < 8 || newPassword !== confirmPassword) {
    redirect(localizedPath(locale, '/parent-portal/account?error=1'));
  }

  // Current password first
  if (
    !(await takeAttempt(`pw:${user!.id}`, 10, WINDOW.fifteenMinutes)) ||
    (await verifyDbUserPassword(user!.email, currentPassword)) !== user!.id
  ) {
    redirect(localizedPath(locale, '/parent-portal/account?error=1'));
  }

  await setDbUserPassword(user!.id, newPassword);
  // Revoke all sessions — forces fresh login everywhere
  await revokeAllSessions(user!.id);
  await destroyPortalSession();
  redirect(localizedPath(locale, '/parent-portal/login?saved=password-changed'));
}

// ---------------------------------------------------------------------------
// Two-factor auth (email OTP)
// ---------------------------------------------------------------------------

export async function requestTwoFactorEnable(formData: FormData): Promise<void> {
  const locale = getLocale(formData);
  const user = await getPortalSessionUser();
  if (!user) redirect(localizedPath(locale, '/parent-portal/login'));

  const profile = await getDbPortalProfile(user!.id);
  const destination = profile?.backupEmail || profile?.email;
  if (!destination) redirect(localizedPath(locale, '/parent-portal/account?tab=security&error=1'));

  const code = newSixDigitCode();
  await clearAttempts(`2fa:${user!.id}`);
  await updateDbPortalProfile(user!.id, {
    twoFactorCodeHash: hashCode(code),
    twoFactorCodeExpiresAt: new Date(Date.now() + TWO_FACTOR_CODE_TTL_MS),
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

  if (!(await takeAttempt(`2fa:${user!.id}`, CODE_ATTEMPTS, WINDOW.tenMinutes))) {
    await updateDbPortalProfile(user!.id, { twoFactorCodeHash: null, twoFactorCodeExpiresAt: null });
    redirect(localizedPath(locale, '/parent-portal/account?tab=security&error=1'));
  }

  const profile = await getDbPortalProfile(user!.id);
  const expiry = profile?.twoFactorCodeExpiresAt ?? null;
  const ok =
    profile?.twoFactorCodeHash &&
    expiry &&
    expiry > new Date() &&
    codeMatches(profile.twoFactorCodeHash, code);

  if (!ok) redirect(localizedPath(locale, '/parent-portal/account?tab=security&verify2fa=1&error=1'));

  await updateDbPortalProfile(user!.id, {
    twoFactorEnabled: true,
    twoFactorCodeHash: null,
    twoFactorCodeExpiresAt: null,
  });
  redirect(localizedPath(locale, '/parent-portal/account?tab=security&saved=1'));
}

export async function disableTwoFactor(formData: FormData): Promise<void> {
  const locale = getLocale(formData);
  const user = await getPortalSessionUser();
  if (!user) redirect(localizedPath(locale, '/parent-portal/login'));

  const currentPassword = field(formData, 'currentPassword');

  if (
    !(await takeAttempt(`pw:${user!.id}`, 10, WINDOW.fifteenMinutes)) ||
    (await verifyDbUserPassword(user!.email, currentPassword)) !== user!.id
  ) {
    redirect(localizedPath(locale, '/parent-portal/account?tab=security&error=1'));
  }

  await updateDbPortalProfile(user!.id, {
    twoFactorEnabled: false,
    twoFactorCodeHash: null,
    twoFactorCodeExpiresAt: null,
  });
  redirect(localizedPath(locale, '/parent-portal/account?tab=security&saved=1'));
}

// ---------------------------------------------------------------------------
// Forgot / reset password (SMS OTP)
// ---------------------------------------------------------------------------

const OTP_TTL_MS = 10 * 60 * 1000;

export async function requestPasswordResetOtp(formData: FormData): Promise<void> {
  const locale = getLocale(formData);
  const phone = field(formData, 'phone');

  // A few codes per phone and per address; past that the request is dropped
  // without saying so (the answer is the same whether the phone is known)
  const allowed = await takeAttempts([
    [`reset-request:${phone}`, 3, WINDOW.hour],
    [`reset-request-ip:${await clientIp()}`, 10, WINDOW.hour],
  ]);

  const parent = allowed ? await getDbParentByPhone(phone) : null;
  if (parent) {
    const code = newSixDigitCode();
    await clearAttempts(`reset:${phone}`);
    await updateDbPortalProfile(parent.id, {
      passwordResetCodeHash: hashCode(code),
      passwordResetCodeExpiresAt: new Date(Date.now() + OTP_TTL_MS),
    });
    await sendSms({
      parentId: parent.id,
      phone,
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

  const parent = await getDbParentByPhone(phone);

  // A few tries per code; past that the code is thrown away and a new one
  // has to be requested. Counted per phone, known or not.
  if (!(await takeAttempt(`reset:${phone}`, CODE_ATTEMPTS, WINDOW.tenMinutes))) {
    if (parent) await updateDbPortalProfile(parent.id, { passwordResetCodeHash: null, passwordResetCodeExpiresAt: null });
    fail();
  }
  if (!parent) fail();

  const reset = await getDbPasswordReset(parent!.id);
  const ok = reset.codeHash && reset.expiresAt && reset.expiresAt > new Date() && codeMatches(reset.codeHash, code);
  if (!ok) fail();

  await setDbUserPassword(parent!.id, newPassword);
  await updateDbPortalProfile(parent!.id, { passwordResetCodeHash: null, passwordResetCodeExpiresAt: null });
  // Sign out everywhere
  await revokeAllSessions(parent!.id);
  await clearAttempts(`reset:${phone}`);
  redirect(localizedPath(locale, '/parent-portal/login?saved=reset'));
}

// ---------------------------------------------------------------------------
// Teacher: choosing a password of their own
// ---------------------------------------------------------------------------

// Teacher accounts start with a password picked by staff. The portal stays
// closed (see requireTeacher) until the teacher replaces it here.
export async function changeTeacherPassword(formData: FormData): Promise<void> {
  const locale = getLocale(formData);
  const user = await getPortalSessionUser();
  if (!user || user.role !== 'TEACHER') redirect(localizedPath(locale, '/teacher/login'));

  const newPassword = field(formData, 'newPassword');
  const confirmPassword = field(formData, 'confirmPassword');
  const fail = () => redirect(localizedPath(locale, '/teacher/change-password?error=1'));

  if (newPassword.length < 10 || newPassword.length > 200 || newPassword !== confirmPassword) fail();
  // Not the one they were given
  if ((await verifyDbUserPassword(user!.email, newPassword)) === user!.id) fail();

  await setDbUserPassword(user!.id, newPassword);
  await revokeAllSessions(user!.id);
  await createPortalSession(user!.id);
  redirect(localizedPath(locale, '/teacher'));
}
