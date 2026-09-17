'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireAdmin, requireAdminOnly } from '@/lib/admin/guard';
import {
  createFirebasePreinscription,
  createFirebasePreinscriptionNotification,
  getFirebasePreinscriptionSetting,
  setFirebasePreinscriptionSetting,
} from '@/lib/firebase/preinscriptions';
import type { AppLocale } from '@/i18n/routing';

function field(formData: FormData, name: string): string {
  return String(formData.get(name) ?? '').trim();
}

function getLocale(formData: FormData): AppLocale {
  return field(formData, 'locale') === 'fr' ? 'fr' : 'en';
}

export async function getRegisterHref(): Promise<'/courses' | '/preinscription'> {
  return (await getFirebasePreinscriptionSetting()) ? '/preinscription' : '/courses';
}

export async function updatePreinscriptionRouting(formData: FormData): Promise<void> {
  await requireAdminOnly();
  const routeRegisterToForm = field(formData, 'routeRegisterToForm') === 'on';

  await setFirebasePreinscriptionSetting(routeRegisterToForm);

  revalidatePath('/[locale]', 'layout');
  revalidatePath('/admin/preinscriptions');
  redirect('/admin/preinscriptions?saved=1');
}

export async function submitPreinscription(formData: FormData): Promise<void> {
  const locale = getLocale(formData);
  const childFullName = field(formData, 'childFullName');
  const childAge = Math.round(Number(field(formData, 'childAge')));
  const institution = field(formData, 'institution');
  const parentFullName = field(formData, 'parentFullName');
  const parentPhone = field(formData, 'parentPhone');

  if (!childFullName || !Number.isFinite(childAge) || childAge < 1 || childAge > 25 || !institution || !parentFullName || !parentPhone) {
    redirect(`/${locale}/preinscription?error=1`);
  }

  await createFirebasePreinscription({ childFullName, childAge, institution, parentFullName, parentPhone });
  await createFirebasePreinscriptionNotification(childFullName, parentFullName);

  revalidatePath('/admin/preinscriptions');
  revalidatePath('/admin');
  redirect(`/${locale}/preinscription?sent=1`);
}

export async function requirePreinscriptionAccess() {
  return requireAdmin();
}
