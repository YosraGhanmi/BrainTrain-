import { firestore } from '@/lib/firebase/admin';
import { listUnreadFirebaseNotifications, type FirebaseNotification } from '@/lib/firebase/notifications';
import { isFirebaseConfigured } from '@/lib/firebase/portal-auth';

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

// Pending-parent and overdue-payment notices are derived live from
// Firestore user/payment documents rather than stored notifications.
export async function getAdminNotifications(): Promise<AdminNotifications> {
  if (isFirebaseConfigured()) {
    const [pendingParentSnap, expenseOnlyNotices, earningNotices, paymentNotices, childNotices, preinscriptionNotices, overduePaymentSnap] = await Promise.all([
      firestore
        .collection('users')
        .where('role', '==', 'PARENT')
        .where('parentStatus', '==', 'PENDING')
        .get()
        .catch(() => ({ docs: [] })),
      listUnreadFirebaseNotifications('EXPENSE_ADDED').catch(() => []),
      listUnreadFirebaseNotifications('EARNING_ADDED').catch(() => []),
      listUnreadFirebaseNotifications('OFFLINE_PAYMENT_DECLARED').catch(() => []),
      listUnreadFirebaseNotifications('CHILD_LINKED').catch(() => []),
      listUnreadFirebaseNotifications('PREINSCRIPTION_SUBMITTED').catch(() => []),
      firestore
        .collection('payments')
        .where('status', '==', 'OVERDUE')
        .get()
        .catch(() => ({ docs: [] })),
    ]);

    const pendingParents: PendingParentNotice[] = pendingParentSnap.docs
      .map((doc) => ({
        id: doc.id,
        fullName: String(doc.data().fullName ?? ''),
        email: String(doc.data().email ?? ''),
        createdAt: doc.data().createdAt?.toDate?.() ?? new Date(),
      }))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 20);

    const sortedOverdueDocs = overduePaymentSnap.docs
      .sort((a, b) => {
        const tA = a.data().dueDate?.toDate?.()?.getTime() ?? 0;
        const tB = b.data().dueDate?.toDate?.()?.getTime() ?? 0;
        return tA - tB;
      })
      .slice(0, 20);

    // Enrich overdue payments with child name
    const overduePayments: OverduePaymentNotice[] = await Promise.all(
      sortedOverdueDocs.map(async (doc) => {
        const data = doc.data();
        const enrollmentDoc = await firestore.collection('enrollments').doc(String(data.enrollmentId)).get();
        const childId = enrollmentDoc.data()?.childId as string | undefined;
        const childDoc = childId ? await firestore.collection('children').doc(childId).get() : null;
        return {
          id: doc.id,
          amount: Number(data.amount ?? 0),
          currency: String(data.currency ?? 'TND'),
          dueDate: data.dueDate?.toDate?.() ?? new Date(),
          childName: String(childDoc?.data()?.fullName ?? ''),
        };
      }),
    );

    const toNotice = (n: FirebaseNotification) => ({ id: n.id, title: n.title, body: n.body, link: n.link, createdAt: n.createdAt });
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

  // Firebase not configured — return empty
  return { pendingParents: [], expenseNotices: [], paymentNotices: [], childNotices: [], preinscriptionNotices: [], overduePayments: [], totalCount: 0 };
}
