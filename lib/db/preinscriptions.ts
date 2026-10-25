import { prisma } from '@/lib/db/prisma';
import { createDbNotification } from '@/lib/db/notifications';

export type DbPreinscription = {
  id: string;
  childFullName: string;
  childAge: number;
  institution: string;
  schoolSystem: string | null;
  parentFullName: string;
  parentPhone: string;
  parentEmail: string | null;
  parentPhone2: string | null;
  courseSlug: string | null;
  courseTitle: string | null;
  createdAt: Date;
};

const PREINSCRIPTION_SETTING = 'preinscription';

export async function createDbPreinscription(
  data: Omit<DbPreinscription, 'id' | 'createdAt' | 'courseSlug' | 'courseTitle'> & {
    courseSlug?: string | null;
    courseTitle?: string | null;
  }
): Promise<void> {
  await prisma.preinscription.create({ data });
}

export async function listDbPreinscriptions(): Promise<DbPreinscription[]> {
  return prisma.preinscription.findMany({ orderBy: { createdAt: 'desc' } });
}

export async function getDbPreinscriptionSetting(): Promise<boolean> {
  const row = await prisma.setting.findUnique({ where: { key: PREINSCRIPTION_SETTING } });
  const value = row?.value as { routeRegisterToForm?: unknown } | null | undefined;
  return value?.routeRegisterToForm === true;
}

export async function setDbPreinscriptionSetting(routeRegisterToForm: boolean): Promise<void> {
  await prisma.setting.upsert({
    where: { key: PREINSCRIPTION_SETTING },
    create: { key: PREINSCRIPTION_SETTING, value: { routeRegisterToForm } },
    update: { value: { routeRegisterToForm } },
  });
}

export async function createDbPreinscriptionNotification(
  childFullName: string,
  parentFullName: string,
  courseTitle?: string | null
): Promise<void> {
  await createDbNotification({
    type: 'PREINSCRIPTION_SUBMITTED',
    title: 'New preinscription received',
    body: [childFullName, parentFullName, courseTitle].filter(Boolean).join(' - '),
    link: '/admin/preinscriptions',
  });
}
