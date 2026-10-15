import { prisma } from '@/lib/db/prisma';
import { listUnreadDbNotifications, type DbNotification } from '@/lib/db/notifications';

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

export type PreinscriptionNotice = ExpenseNotice;

export type PaymentNotice = ExpenseNotice;

export type OverduePaymentNotice = {
  id: string;
  amount: number;
  currency: string;
  dueDate: Date;
  childName: string;
};

export type AdminNotifications = {
  pendingParents: PendingParentNotice[];
  // Earnings and dispenses logged by a secretary
  expenseNotices: ExpenseNotice[];
  // Parents who picked cash/cheque and will pay at the desk
  paymentNotices: PaymentNotice[];
  // Parents who linked a child from the paper records with its code
  childNotices: ExpenseNotice[];
  preinscriptionNotices: PreinscriptionNotice[];
  overduePayments: OverduePaymentNotice[];
  totalCount: number;
};

// Pending-parent and overdue-payment notices are derived live from the
// users and payments tables rather than stored notifications.
export async function getAdminNotifications(): Promise<AdminNotifications> {
  const [pendingParentRows, expenseOnlyNotices, earningNotices, paymentNotices, childNotices, preinscriptionNotices, overdueRows] =
    await Promise.all([
      prisma.user.findMany({
        where: { role: 'PARENT', parentStatus: 'PENDING' },
        select: { id: true, fullName: true, email: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
      listUnreadDbNotifications('EXPENSE_ADDED'),
      listUnreadDbNotifications('EARNING_ADDED'),
      listUnreadDbNotifications('OFFLINE_PAYMENT_DECLARED'),
      listUnreadDbNotifications('CHILD_LINKED'),
      listUnreadDbNotifications('PREINSCRIPTION_SUBMITTED'),
      prisma.payment.findMany({
        where: { status: 'OVERDUE' },
        include: { enrollment: { select: { child: { select: { fullName: true } } } } },
        orderBy: { dueDate: 'asc' },
        take: 20,
      }),
    ]);

  const pendingParents: PendingParentNotice[] = pendingParentRows;

  const overduePayments: OverduePaymentNotice[] = overdueRows.map((row) => ({
    id: row.id,
    amount: Number(row.amount),
    currency: row.currency,
    dueDate: row.dueDate,
    childName: row.enrollment.child?.fullName ?? '',
  }));

  const toNotice = (n: DbNotification) => ({ id: n.id, title: n.title, body: n.body, link: n.link, createdAt: n.createdAt });
  const expenseNotices = [...expenseOnlyNotices, ...earningNotices]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .map(toNotice);

  return {
    pendingParents,
    expenseNotices,
    paymentNotices: paymentNotices.map(toNotice),
    childNotices: childNotices.map(toNotice),
    preinscriptionNotices: preinscriptionNotices.map(toNotice),
    overduePayments,
    totalCount:
      pendingParents.length + expenseNotices.length + paymentNotices.length + childNotices.length + preinscriptionNotices.length + overduePayments.length,
  };
}
