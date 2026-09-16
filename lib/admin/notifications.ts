import { firestore } from '@/lib/firebase/admin';
import { listUnreadFirebaseNotifications } from '@/lib/firebase/notifications';
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

export type PreinscriptionNotice = {
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
  preinscriptionNotices: PreinscriptionNotice[];
  overduePayments: OverduePaymentNotice[];
  totalCount: number;
};

// Pending-parent and overdue-payment notices are derived live from
// Firestore user/payment documents rather than stored notifications.
export async function getAdminNotifications(): Promise<AdminNotifications> {
  if (isFirebaseConfigured()) {
    const [pendingParentSnap, expenseNotices, preinscriptionNotices, overduePaymentSnap] = await Promise.all([
      firestore.collection('users').where('role', '==', 'PARENT').where('parentStatus', '==', 'PENDING').orderBy('createdAt', 'desc').limit(20).get(),
      listUnreadFirebaseNotifications('EXPENSE_ADDED'),
      listUnreadFirebaseNotifications('PREINSCRIPTION_SUBMITTED'),
      firestore.collection('payments').where('status', '==', 'OVERDUE').orderBy('dueDate', 'asc').limit(20).get(),
    ]);

    const pendingParents: PendingParentNotice[] = pendingParentSnap.docs.map((doc) => ({
      id: doc.id,
      fullName: String(doc.data().fullName ?? ''),
      email: String(doc.data().email ?? ''),
      createdAt: doc.data().createdAt?.toDate?.() ?? new Date(),
    }));

    // Enrich overdue payments with child name
    const overduePayments: OverduePaymentNotice[] = await Promise.all(
      overduePaymentSnap.docs.map(async (doc) => {
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

    return {
      pendingParents,
      expenseNotices: expenseNotices.map((n) => ({ id: n.id, title: n.title, body: n.body, link: n.link, createdAt: n.createdAt })),
      preinscriptionNotices: preinscriptionNotices.map((n) => ({ id: n.id, title: n.title, body: n.body, link: n.link, createdAt: n.createdAt })),
      overduePayments,
      totalCount: pendingParents.length + expenseNotices.length + preinscriptionNotices.length + overduePayments.length,
    };
  }

  // Firebase not configured — return empty
  return { pendingParents: [], expenseNotices: [], preinscriptionNotices: [], overduePayments: [], totalCount: 0 };
}
