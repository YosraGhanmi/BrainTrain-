import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db/prisma';
import { requireParent } from '@/lib/portal-auth/guard';
import { getCourseEntryOrThrow } from '@/lib/content/lookup';
import { payNow } from '@/lib/payments/actions';
import type { AppLocale } from '@/i18n/routing';

export const dynamic = 'force-dynamic';

const STATUS_STYLES: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700',
  PAID: 'bg-emerald-100 text-emerald-700',
  OVERDUE: 'bg-red-100 text-red-600',
  FAILED: 'bg-slate-200 text-slate-600',
};

export default async function PaymentsPage({
  params,
  searchParams,
}: {
  params: { locale: AppLocale; childId: string };
  searchParams: { paid?: string; cancelled?: string };
}) {
  const parent = await requireParent(params.locale);
  const child = await prisma.child.findUnique({ where: { id: params.childId } });
  if (!child || child.parentId !== parent.parentId) notFound();

  const payments = await prisma.payment.findMany({
    where: { paymentPlan: { enrollment: { childId: child.id } } },
    include: { paymentPlan: { include: { enrollment: { include: { courseSession: true } } } } },
    orderBy: { dueDate: 'desc' },
  });

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-ink">{child.fullName}: Payment history</h1>

      {searchParams.paid ? (
        <p className="mt-4 rounded-xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
          Payment complete. Thank you! It may take a moment to reflect below.
        </p>
      ) : null}
      {searchParams.cancelled ? (
        <p className="mt-4 rounded-xl bg-amber-50 p-4 text-sm font-semibold text-amber-700">Checkout was cancelled.</p>
      ) : null}

      {payments.length === 0 ? (
        <p className="mt-8 rounded-2xl border border-dashed border-ink/15 bg-white p-8 text-center text-stone">No payments yet.</p>
      ) : (
        <div className="mt-8 overflow-x-auto rounded-2xl border border-ink/10 bg-white shadow-soft">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-ink/10 text-xs font-bold uppercase tracking-wide text-stone">
              <tr>
                <th className="px-5 py-3">Course</th>
                <th className="px-5 py-3">Plan</th>
                <th className="px-5 py-3">Amount</th>
                <th className="px-5 py-3">Due</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => {
                const course = getCourseEntryOrThrow(payment.paymentPlan.enrollment.courseSession.courseSlug);
                return (
                  <tr key={payment.id} className="border-b border-ink/5 last:border-0">
                    <td className="px-5 py-4 font-semibold text-ink">{course.title.en}</td>
                    <td className="px-5 py-4 text-stone">{payment.paymentPlan.type}</td>
                    <td className="px-5 py-4 text-stone">
                      {Number(payment.amount)} {payment.currency}
                    </td>
                    <td className="px-5 py-4 text-stone">{payment.dueDate.toDateString()}</td>
                    <td className="px-5 py-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-bold ${STATUS_STYLES[payment.status]}`}>{payment.status}</span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      {payment.status !== 'PAID' ? (
                        <form action={payNow}>
                          <input type="hidden" name="locale" value={params.locale} />
                          <input type="hidden" name="paymentId" value={payment.id} />
                          <input type="hidden" name="childId" value={child.id} />
                          <button type="submit" className="rounded-full bg-ink px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white transition hover:bg-accent">
                            Pay now
                          </button>
                        </form>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
