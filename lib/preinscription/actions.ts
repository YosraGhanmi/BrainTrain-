'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db/prisma';
import { requireAdmin, requireAdminOnly } from '@/lib/admin/guard';
import type { AppLocale } from '@/i18n/routing';

const SETTING_ID = 1;

function field(formData: FormData, name: string): string {
  return String(formData.get(name) ?? '').trim();
}

function getLocale(formData: FormData): AppLocale {
  return field(formData, 'locale') === 'fr' ? 'fr' : 'en';
}

export async function getRegisterHref(): Promise<'/courses' | '/preinscription'> {
  const setting = await prisma.preinscriptionSetting.findUnique({ where: { id: SETTING_ID } });
  return setting?.routeRegisterToForm ? '/preinscription' : '/courses';
}

export async function updatePreinscriptionRouting(formData: FormData): Promise<void> {
  await requireAdminOnly();
  const routeRegisterToForm = field(formData, 'routeRegisterToForm') === 'on';

  await prisma.preinscriptionSetting.upsert({
    where: { id: SETTING_ID },
    update: { routeRegisterToForm },
    create: { id: SETTING_ID, routeRegisterToForm },
  });

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

  await prisma.preinscription.create({
    data: { childFullName, childAge, institution, parentFullName, parentPhone },
  });

  await prisma.notification.create({
    data: {
      type: 'PREINSCRIPTION_SUBMITTED',
      title: 'New preinscription received',
      body: `${childFullName} — ${parentFullName}`,
      link: '/admin/preinscriptions',
    },
  });

  revalidatePath('/admin/preinscriptions');
  revalidatePath('/admin');
  redirect(`/${locale}/preinscription?sent=1`);
}

export async function requirePreinscriptionAccess() {
  return requireAdmin();
}
