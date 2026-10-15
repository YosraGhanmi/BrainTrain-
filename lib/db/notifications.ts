import { prisma } from '@/lib/db/prisma';

export type NotificationType =
  | 'EXPENSE_ADDED'
  | 'EARNING_ADDED'
  | 'PREINSCRIPTION_SUBMITTED'
  | 'OFFLINE_PAYMENT_DECLARED'
  | 'CHILD_LINKED';

export type DbNotification = {
  id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  link: string | null;
  readAt: Date | null;
  createdAt: Date;
};

export async function createDbNotification(input: Omit<DbNotification, 'id' | 'readAt' | 'createdAt'>): Promise<void> {
  await prisma.notification.create({ data: input });
}

export async function markDbNotificationRead(id: string): Promise<void> {
  await prisma.notification.update({ where: { id }, data: { readAt: new Date() } });
}

export async function markAllDbNotificationsRead(): Promise<void> {
  await prisma.notification.updateMany({ where: { readAt: null }, data: { readAt: new Date() } });
}

export async function listUnreadDbNotifications(type?: NotificationType): Promise<DbNotification[]> {
  return prisma.notification.findMany({
    where: { readAt: null, ...(type ? { type } : {}) },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });
}
