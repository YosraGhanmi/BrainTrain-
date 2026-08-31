import { prisma } from '@/lib/db/prisma';
import { requireParent } from '@/lib/portal-auth/guard';
import { resolveSelectedChild } from '@/lib/portal-auth/selected-child';
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

export default async function ParentPaymentsPage({ params }: { params: { locale: AppLocale } }) {
  const parent = await requireParent(params.locale);
  const children = await prisma.child.findMany({
    where: { parentId: parent.parentId },
    orderBy: { createdAt: 'asc' },
  });
  const selected = resolveSelectedChild(children);

  if (!selected) {
    return (
      <p className="rounded-2xl border border-dashed border-ink/15 bg-white p-10 text-center text-stone">
        No children yet — add a child to start enrolling in courses.
      </p>
    );
  }

  const child = await prisma.child.findUnique({
    where: { id: selected.id },
    include: {
      enrollments: {
        include: {
          courseSession: true,
          payments: { orderBy: { dueDate: 'desc' } },
        },
      },
    },
  });
  if (!child) return null;

  const payments = child.enrollments.flatMap((enrollment) =>
    enrollment.payments.map((payment) => ({ enrollment, payment }))
  );

  return (
    <div>
      {payments.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-ink/15 bg-white p-8 text-center text-stone">
          No payments yet.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-ink/10 bg-white shadow-soft">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-ink/10 text-xs font-bold uppercase tracking-wide text-stone">
              <tr>
                <th className="px-5 py-3">Course</th>
                <th className="px-5 py-3">Amount</th>
                <th className="px-5 py-3">Due</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {payments
                .sort((a, b) => b.payment.dueDate.getTime() - a.payment.dueDate.getTime())
                .map(({ enrollment, payment }) => {
                  const course = getCourseEntryOrThrow(enrollment.courseSession.courseSlug);
                  return (
                    <tr key={payment.id} className="border-b border-ink/5 last:border-0">
                      <td className="px-5 py-4 font-semibold text-ink">{course.title.en}</td>
                      <td className="px-5 py-4 text-stone">
                        {Number(payment.amount)} {payment.currency}
                      </td>
                      <td className="px-5 py-4 text-stone">{payment.dueDate.toDateString()}</td>
                      <td className="px-5 py-4">
                        <span className={`rounded-full px-3 py-1 text-xs font-bold ${STATUS_STYLES[payment.status]}`}>
                          {payment.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        {payment.status !== 'PAID' ? (
                          <form action={payNow}>
                            <input type="hidden" name="locale" value={params.locale} />
                            <input type="hidden" name="paymentId" value={payment.id} />
                            <input type="hidden" name="childId" value={child.id} />
                            <button
                              type="submit"
                              className="rounded-full bg-ink px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white transition hover:bg-accent"
                            >
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
