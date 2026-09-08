import { prisma } from '@/lib/db/prisma';

export type PendingParentNotice = {
  id: string;
  fullName: string;
  email: string;
  createdAt: Date;
};

export type ExpenseNotice = {
  id: string;
  title: string;
  body: string | null;
  link: string | null;
  createdAt: Date;
};

export type OverduePaymentNotice = {
  id: string;
  amount: number;
  currency: string;
  dueDate: Date;
  childName: string;
};

export type AdminNotifications = {
  pendingParents: PendingParentNotice[];
  expenseNotices: ExpenseNotice[];
  overduePayments: OverduePaymentNotice[];
  totalCount: number;
};

// Pending-parent and overdue-payment notices are derived live from
// Parent.status / Payment.status (see the schema comment on the Notification
// model) rather than stored, so they vanish on their own once
// approved/rejected or paid — no read-state to manage for those two.
export async function getAdminNotifications(): Promise<AdminNotifications> {
  const [pendingParentUsers, expenseNotices, overduePaymentRows] = await Promise.all([
    prisma.user.findMany({
      where: { role: 'PARENT', parent: { status: 'PENDING' } },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: { id: true, fullName: true, email: true, createdAt: true },
    }),
    prisma.notification.findMany({
      where: { readAt: null },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: { id: true, title: true, body: true, link: true, createdAt: true },
    }),
    prisma.payment.findMany({
      where: { status: 'OVERDUE' },
      orderBy: { dueDate: 'asc' },
      take: 20,
      select: {
        id: true,
        amount: true,
        currency: true,
        dueDate: true,
        enrollment: { select: { child: { select: { fullName: true } } } },
      },
    }),
  ]);

  const overduePayments = overduePaymentRows.map((p) => ({
    id: p.id,
    amount: Number(p.amount),
    currency: p.currency,
    dueDate: p.dueDate,
    childName: p.enrollment.child.fullName,
  }));

  return {
    pendingParents: pendingParentUsers,
    expenseNotices,
    overduePayments,
    totalCount: pendingParentUsers.length + expenseNotices.length + overduePayments.length,
  };
}
