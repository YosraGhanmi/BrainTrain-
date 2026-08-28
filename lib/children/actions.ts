'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db/prisma';
import { requireParent, localizedPath } from '@/lib/portal-auth/guard';
import { getAgeGroupEntryOrThrow } from '@/lib/content/lookup';
import type { AppLocale } from '@/i18n/routing';

function field(formData: FormData, name: string): string {
  return String(formData.get(name) ?? '').trim();
}

function getLocale(formData: FormData): AppLocale {
  return field(formData, 'locale') === 'fr' ? 'fr' : 'en';
}

export async function addChild(formData: FormData): Promise<void> {
  const locale = getLocale(formData);
  const parent = await requireParent(locale);

  const fullName = field(formData, 'fullName');
  const dateOfBirthRaw = field(formData, 'dateOfBirth');
  const ageGroupSlug = field(formData, 'ageGroupSlug');
  const specialNeeds = field(formData, 'specialNeeds');

  const dateOfBirth = new Date(dateOfBirthRaw);
  if (!fullName || Number.isNaN(dateOfBirth.getTime()) || !ageGroupSlug) {
    redirect(localizedPath(locale, '/parent-portal/children/new?error=1'));
  }

  // Validates the age group slug exists in the JSON content store before
  // persisting a dangling reference.
  getAgeGroupEntryOrThrow(ageGroupSlug);

  await prisma.child.create({
    data: {
      parentId: parent.parentId,
      fullName,
      dateOfBirth,
      ageGroupSlug,
      specialNeeds: specialNeeds || null,
    },
  });

  redirect(localizedPath(locale, '/parent-portal?saved=1'));
}

export async function editChild(formData: FormData): Promise<void> {
  const locale = getLocale(formData);
  const parent = await requireParent(locale);

  const childId = field(formData, 'childId');
  const fullName = field(formData, 'fullName');
  const dateOfBirthRaw = field(formData, 'dateOfBirth');
  const ageGroupSlug = field(formData, 'ageGroupSlug');
  const specialNeeds = field(formData, 'specialNeeds');

  const child = await prisma.child.findUnique({ where: { id: childId } });
  if (!child || child.parentId !== parent.parentId) {
    redirect(localizedPath(locale, '/parent-portal?error=1'));
  }

  const dateOfBirth = new Date(dateOfBirthRaw);
  if (!fullName || Number.isNaN(dateOfBirth.getTime()) || !ageGroupSlug) {
    redirect(localizedPath(locale, `/parent-portal/children/${childId}?error=1`));
  }
  getAgeGroupEntryOrThrow(ageGroupSlug);

  await prisma.child.update({
    where: { id: childId },
    data: { fullName, dateOfBirth, ageGroupSlug, specialNeeds: specialNeeds || null },
  });

  revalidatePath(`/${locale === 'fr' ? 'fr/' : ''}parent-portal/children/${childId}`);
  redirect(localizedPath(locale, `/parent-portal/children/${childId}?saved=1`));
}
