'use server';

import { z } from 'zod';
import crypto from 'crypto';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
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
import { SESSION_COOKIE_NAME } from '@/lib/auth/session';
import { SELECTED_CHILD_COOKIE } from '@/lib/portal-auth/selected-child';
import { sendSms } from '@/lib/sms/send';
import { sendEmail } from '@/lib/email/send';
import {
  createFirebaseParentProfile,
  isFirebaseConfigured,
  signInWithFirebasePassword,
  getFirebasePortalProfile,
  updateFirebasePortalProfile,
} from '@/lib/firebase/portal-auth';
import { getFirebaseChild } from '@/lib/firebase/children';
import { getFirebaseTeacherByEmail, getFirebaseTeacherProfile, updateFirebaseTeacherProfile } from '@/lib/firebase/teachers';
import { getFirebaseSecretaryByEmail, getFirebaseSecretaryProfile } from '@/lib/firebase/secretaries';
import { firebaseAdminAuth } from '@/lib/firebase/admin';
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
  if (isFirebaseConfigured()) {
    try {
      await createFirebaseParentProfile({ fullName, email, phone, password });
    } catch {
      redirect(localizedPath(locale, '/parent-portal/register?error=exists'));
    }
    redirect(localizedPath(locale, '/parent-portal/pending'));
  }

  // Fallback — should not be reached once Firebase is fully configured
  redirect(localizedPath(locale, '/parent-portal/register?error=1'));
}

export async function loginParent(formData: FormData): Promise<void> {
  const locale = getLocale(formData);
  const email = field(formData, 'email').toLowerCase();
  const password = field(formData, 'password');

  if (isFirebaseConfigured()) {
    const credentials = await signInWithFirebasePassword(email, password);
    const profile = credentials ? await getFirebasePortalProfile(credentials.uid) : null;
    if (!credentials || !profile || profile.role !== 'PARENT') {
      redirect(localizedPath(locale, '/parent-portal/login?error=1'));
    }
    if (profile.isFrozen) redirect(localizedPath(locale, '/parent-portal/login?error=frozen'));
    if (profile.parentStatus === 'PENDING') redirect(localizedPath(locale, '/parent-portal/login?error=pending'));
    if (profile.parentStatus === 'REJECTED') redirect(localizedPath(locale, '/parent-portal/login?error=rejected'));
    await createPortalSession(profile.id, credentials.idToken);
    redirect(localizedPath(locale, '/parent-portal'));
  }

  redirect(localizedPath(locale, '/parent-portal/login?error=1'));
}

export async function loginTeacher(formData: FormData): Promise<void> {
  const locale = getLocale(formData);
  const email = field(formData, 'email').toLowerCase();
  const password = field(formData, 'password');

  if (isFirebaseConfigured()) {
    // Step 1: verify email+password via Firebase Auth REST API
    const credentials = await signInWithFirebasePassword(email, password);
    if (!credentials) redirect(localizedPath(locale, '/teacher/login?error=1'));

    const profile = await getFirebaseTeacherProfile(credentials!.uid);
    if (!profile || profile.role !== 'TEACHER') redirect(localizedPath(locale, '/teacher/login?error=1'));
    if (profile!.isFrozen) redirect(localizedPath(locale, '/teacher/login?error=frozen'));

    // Step 2: if a PIN hash exists, require the PIN step
    if (profile!.teacherSecretCodeHash) {
      cookies().set(PENDING_TEACHER_COOKIE_NAME, createPendingTeacherToken(credentials!.uid), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 10 * 60,
      });
      redirect(localizedPath(locale, '/teacher/verify'));
    }

    // No PIN set — create session immediately
    await createPortalSession(profile!.id, credentials!.idToken);
    redirect(localizedPath(locale, '/teacher'));
  }

  redirect(localizedPath(locale, '/teacher/login?error=1'));
}

export async function verifyTeacherSecretCode(formData: FormData): Promise<void> {
  const locale = getLocale(formData);
  const code = field(formData, 'code');

  const uid = verifyPendingTeacherToken(cookies().get(PENDING_TEACHER_COOKIE_NAME)?.value);
  if (!uid) redirect(localizedPath(locale, '/teacher/login?error=1'));

  if (isFirebaseConfigured()) {
    const profile = await getFirebaseTeacherProfile(uid!);
    const ok =
      profile &&
      profile.role === 'TEACHER' &&
      !profile.isFrozen &&
      profile.teacherSecretCodeHash &&
      (await verifyPassword(code, profile.teacherSecretCodeHash));
    if (!ok) redirect(localizedPath(locale, '/teacher/verify?error=1'));

    cookies().delete(PENDING_TEACHER_COOKIE_NAME);
    // Re-sign-in is not needed here — we already have the uid; create Firebase
    // session cookie using a freshly minted custom token.
    const customToken = await firebaseAdminAuth.createCustomToken(uid!);
    // Exchange custom token for id token via REST (same pattern as signInWithPassword)
    const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    if (apiKey) {
      const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: customToken, returnSecureToken: true }),
        cache: 'no-store',
      });
      if (res.ok) {
        const data = (await res.json()) as { idToken?: string };
        if (data.idToken) {
          await createPortalSession(uid!, data.idToken);
          redirect(localizedPath(locale, '/teacher'));
        }
      }
    }
    // Fallback: if custom token exchange fails, redirect with error
    redirect(localizedPath(locale, '/teacher/verify?error=1'));
  }

  redirect(localizedPath(locale, '/teacher/login?error=1'));
}

export async function loginSecretary(formData: FormData): Promise<void> {
  const email = field(formData, 'email').toLowerCase();
  const password = field(formData, 'password');

  if (isFirebaseConfigured()) {
    const credentials = await signInWithFirebasePassword(email, password);
    if (!credentials) redirect('/admin/login?role=secretary&error=1');

    const profile = await getFirebaseSecretaryProfile(credentials!.uid);
    if (!profile || profile.role !== 'SECRETARY') redirect('/admin/login?role=secretary&error=1');
    if (profile!.isFrozen) redirect('/admin/login?role=secretary&error=frozen');

    // Clear any leftover admin env-cookie so it doesn't take priority
    cookies().delete(SESSION_COOKIE_NAME);
    await createPortalSession(profile!.id, credentials!.idToken);
    redirect('/admin');
  }

  redirect('/admin/login?role=secretary&error=1');
}

export async function logoutPortal(redirectTo: string): Promise<void> {
  await destroyPortalSession();
  redirect(redirectTo);
}

// ---------------------------------------------------------------------------
// Parent-portal child switcher
// ---------------------------------------------------------------------------

export async function selectChild(formData: FormData): Promise<void> {
  const user = await getPortalSessionUser();
  if (!user || user.role !== 'PARENT' || !user.parentId) return;

  const childId = field(formData, 'childId');

  if (isFirebaseConfigured()) {
    const child = await getFirebaseChild(childId);
    if (!child || child.parentId !== user.parentId) return;
  }

  cookies().set(SELECTED_CHILD_COOKIE, childId, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
  });

  revalidatePath('/', 'layout');
}

// ---------------------------------------------------------------------------
// Account management (Firebase path for all write operations)
// ---------------------------------------------------------------------------

export async function changePhone(formData: FormData): Promise<void> {
  const locale = getLocale(formData);
  const user = await getPortalSessionUser();
  if (!user) redirect(localizedPath(locale, '/parent-portal/login'));

  const newPhone = field(formData, 'phone');
  if (newPhone.length < 8) redirect(localizedPath(locale, '/parent-portal/account?error=1'));

  if (isFirebaseConfigured()) {
    await updateFirebasePortalProfile(user!.id, { phone: newPhone });
    redirect(localizedPath(locale, '/parent-portal/account?saved=1'));
  }

  redirect(localizedPath(locale, '/parent-portal/account?error=1'));
}

export async function addSecondaryPhone(formData: FormData): Promise<void> {
  const locale = getLocale(formData);
  const user = await getPortalSessionUser();
  if (!user) redirect(localizedPath(locale, '/parent-portal/login'));

  const phone = field(formData, 'secondaryPhone');
  if (phone.length < 8) redirect(localizedPath(locale, '/parent-portal/account?tab=personal&error=1'));

  if (isFirebaseConfigured()) {
    await updateFirebasePortalProfile(user!.id, { secondaryPhone: phone });
    redirect(localizedPath(locale, '/parent-portal/account?tab=personal&saved=1'));
  }

  redirect(localizedPath(locale, '/parent-portal/account?tab=personal&error=1'));
}

export async function deleteSecondaryPhone(formData: FormData): Promise<void> {
  const locale = getLocale(formData);
  const user = await getPortalSessionUser();
  if (!user) redirect(localizedPath(locale, '/parent-portal/login'));

  if (isFirebaseConfigured()) {
    await updateFirebasePortalProfile(user!.id, { secondaryPhone: null });
    redirect(localizedPath(locale, '/parent-portal/account?tab=personal&saved=1'));
  }

  redirect(localizedPath(locale, '/parent-portal/account?tab=personal&error=1'));
}

export async function deletePrimaryPhone(formData: FormData): Promise<void> {
  const locale = getLocale(formData);
  const user = await getPortalSessionUser();
  if (!user) redirect(localizedPath(locale, '/parent-portal/login'));

  if (isFirebaseConfigured()) {
    const profile = await getFirebasePortalProfile(user!.id);
    if (!profile?.secondaryPhone) {
      redirect(localizedPath(locale, '/parent-portal/account?tab=personal&error=no-secondary'));
    }
    await updateFirebasePortalProfile(user!.id, { phone: profile!.secondaryPhone!, secondaryPhone: null });
    redirect(localizedPath(locale, '/parent-portal/account?tab=personal&saved=1'));
  }

  redirect(localizedPath(locale, '/parent-portal/account?tab=personal&error=1'));
}

export async function updateBackupEmail(formData: FormData): Promise<void> {
  const locale = getLocale(formData);
  const user = await getPortalSessionUser();
  if (!user) redirect(localizedPath(locale, '/parent-portal/login'));

  const backupEmail = field(formData, 'backupEmail').toLowerCase();
  if (!backupEmail || !backupEmail.includes('@')) {
    redirect(localizedPath(locale, '/parent-portal/account?tab=personal&error=1'));
  }

  if (isFirebaseConfigured()) {
    await updateFirebasePortalProfile(user!.id, { backupEmail });
    redirect(localizedPath(locale, '/parent-portal/account?tab=personal&saved=1'));
  }

  redirect(localizedPath(locale, '/parent-portal/account?tab=personal&error=1'));
}

export async function deleteBackupEmail(formData: FormData): Promise<void> {
  const locale = getLocale(formData);
  const user = await getPortalSessionUser();
  if (!user) redirect(localizedPath(locale, '/parent-portal/login'));

  if (isFirebaseConfigured()) {
    await updateFirebasePortalProfile(user!.id, { backupEmail: null });
    redirect(localizedPath(locale, '/parent-portal/account?tab=personal&saved=1'));
  }

  redirect(localizedPath(locale, '/parent-portal/account?tab=personal&error=1'));
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

  if (isFirebaseConfigured()) {
    // Verify current password first via Firebase REST API
    const profile = await getFirebasePortalProfile(user!.id);
    if (!profile) redirect(localizedPath(locale, '/parent-portal/account?error=1'));

    const creds = await signInWithFirebasePassword(profile!.email, currentPassword);
    if (!creds) redirect(localizedPath(locale, '/parent-portal/account?error=1'));

    // Update password in Firebase Auth
    await firebaseAdminAuth.updateUser(user!.id, { password: newPassword });
    // Revoke all sessions — forces fresh login everywhere
    await revokeAllSessions(user!.id);
    await destroyPortalSession();
    redirect(localizedPath(locale, '/parent-portal/login?saved=password-changed'));
  }

  redirect(localizedPath(locale, '/parent-portal/account?error=1'));
}

// ---------------------------------------------------------------------------
// Two-factor auth (email OTP)
// ---------------------------------------------------------------------------

const TWO_FACTOR_CODE_TTL_MS = 10 * 60 * 1000;

function hashCode(code: string): string {
  return crypto.createHash('sha256').update(code).digest('hex');
}

export async function requestTwoFactorEnable(formData: FormData): Promise<void> {
  const locale = getLocale(formData);
  const user = await getPortalSessionUser();
  if (!user) redirect(localizedPath(locale, '/parent-portal/login'));

  if (isFirebaseConfigured()) {
    const profile = await getFirebasePortalProfile(user!.id);
    const destination = profile?.backupEmail || profile?.email;
    if (!destination) redirect(localizedPath(locale, '/parent-portal/account?tab=security&error=1'));

    const code = crypto.randomInt(100000, 999999).toString();
    await updateFirebasePortalProfile(user!.id, {
      twoFactorCodeHash: hashCode(code),
      twoFactorCodeExpiresAt: new Date(Date.now() + TWO_FACTOR_CODE_TTL_MS).toISOString(),
    });
    await sendEmail({
      to: destination!,
      subject: 'Your BrainTrain verification code',
      text: `Your two-factor authentication code is ${code}. It expires in 10 minutes.`,
    }).catch(() => undefined);
    redirect(localizedPath(locale, '/parent-portal/account?tab=security&verify2fa=1'));
  }

  redirect(localizedPath(locale, '/parent-portal/account?tab=security&error=1'));
}

export async function confirmTwoFactorEnable(formData: FormData): Promise<void> {
  const locale = getLocale(formData);
  const user = await getPortalSessionUser();
  if (!user) redirect(localizedPath(locale, '/parent-portal/login'));

  const code = field(formData, 'code');

  if (isFirebaseConfigured()) {
    const profile = await getFirebasePortalProfile(user!.id);
    const expiry = profile?.twoFactorCodeExpiresAt ? new Date(profile.twoFactorCodeExpiresAt as unknown as string) : null;
    const ok =
      profile?.twoFactorCodeHash &&
      expiry &&
      expiry > new Date() &&
      profile.twoFactorCodeHash === hashCode(code);

    if (!ok) redirect(localizedPath(locale, '/parent-portal/account?tab=security&verify2fa=1&error=1'));

    await updateFirebasePortalProfile(user!.id, {
      twoFactorEnabled: true,
      twoFactorCodeHash: null,
      twoFactorCodeExpiresAt: null,
    });
    redirect(localizedPath(locale, '/parent-portal/account?tab=security&saved=1'));
  }

  redirect(localizedPath(locale, '/parent-portal/account?tab=security&error=1'));
}

export async function disableTwoFactor(formData: FormData): Promise<void> {
  const locale = getLocale(formData);
  const user = await getPortalSessionUser();
  if (!user) redirect(localizedPath(locale, '/parent-portal/login'));

  const currentPassword = field(formData, 'currentPassword');

  if (isFirebaseConfigured()) {
    const profile = await getFirebasePortalProfile(user!.id);
    if (!profile) redirect(localizedPath(locale, '/parent-portal/account?tab=security&error=1'));
    const creds = await signInWithFirebasePassword(profile!.email, currentPassword);
    if (!creds) redirect(localizedPath(locale, '/parent-portal/account?tab=security&error=1'));

    await updateFirebasePortalProfile(user!.id, {
      twoFactorEnabled: false,
      twoFactorCodeHash: null,
      twoFactorCodeExpiresAt: null,
    });
    redirect(localizedPath(locale, '/parent-portal/account?tab=security&saved=1'));
  }

  redirect(localizedPath(locale, '/parent-portal/account?tab=security&error=1'));
}

// ---------------------------------------------------------------------------
// Forgot / reset password (SMS OTP)
// ---------------------------------------------------------------------------

const OTP_TTL_MS = 10 * 60 * 1000;

export async function requestPasswordResetOtp(formData: FormData): Promise<void> {
  const locale = getLocale(formData);
  const phone = field(formData, 'phone');

  if (isFirebaseConfigured()) {
    // Look up user by phone in Firestore
    const snapshot = await (await import('@/lib/firebase/admin')).firestore
      .collection('users')
      .where('phone', '==', phone)
      .where('role', '==', 'PARENT')
      .limit(1)
      .get();

    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      const code = crypto.randomInt(100000, 999999).toString();
      await (await import('@/lib/firebase/admin')).firestore
        .collection('users')
        .doc(doc.id)
        .update({
          passwordResetCodeHash: hashCode(code),
          passwordResetCodeExpiresAt: new Date(Date.now() + OTP_TTL_MS).toISOString(),
        });
      await sendSms({
        parentId: doc.id,
        phone,
        message: `Your BrainTrain password reset code is ${code}. It expires in 10 minutes.`,
        purpose: 'PASSWORD_RESET',
      }).catch(() => undefined);
    }
    redirect(localizedPath(locale, `/parent-portal/reset-password?phone=${encodeURIComponent(phone)}`));
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

  if (isFirebaseConfigured()) {
    const { firestore: fs } = await import('@/lib/firebase/admin');
    const snapshot = await fs.collection('users').where('phone', '==', phone).where('role', '==', 'PARENT').limit(1).get();
    if (snapshot.empty) fail();

    const doc = snapshot.docs[0];
    const data = doc.data();
    const expiry = data.passwordResetCodeExpiresAt ? new Date(String(data.passwordResetCodeExpiresAt)) : null;
    const ok = data.passwordResetCodeHash && expiry && expiry > new Date() && data.passwordResetCodeHash === hashCode(code);
    if (!ok) fail();

    // Reset the password in Firebase Auth
    await firebaseAdminAuth.updateUser(doc.id, { password: newPassword });
    // Clear the OTP fields
    await fs.collection('users').doc(doc.id).update({
      passwordResetCodeHash: null,
      passwordResetCodeExpiresAt: null,
    });
    // Revoke all sessions
    await revokeAllSessions(doc.id);
    redirect(localizedPath(locale, '/parent-portal/login?saved=reset'));
  }

  fail();
}
