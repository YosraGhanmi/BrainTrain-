import { requireAdmin } from '@/lib/admin/guard';
import { setPaymentStatus } from '@/lib/admin/portal-actions';
import { getCourseEntryOrThrow } from '@/lib/content/lookup';
import PendingSubmitButton from '@/components/portal/PendingSubmitButton';
import { listAllFirebasePaymentsWithRelations } from '@/lib/firebase/read-models';

export const dynamic = 'force-dynamic';

const STATUS_STYLES: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700',
  PAID: 'bg-emerald-100 text-emerald-700',
  OVERDUE: 'bg-red-100 text-red-600',
  FAILED: 'bg-slate-200 text-slate-600',
};

export default async function AdminPaymentsPage() {
  await requireAdmin();
  const payments = await listAllFirebasePaymentsWithRelations();

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold text-ink">Payments</h1>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-ink/10 bg-white shadow-soft">
        <table className="w-full min-w-[840px] text-left text-sm">
          <thead className="border-b border-ink/10 text-xs font-bold uppercase tracking-wide text-stone">
            <tr>
              <th className="px-5 py-3">Child</th>
              <th className="px-5 py-3">Parent</th>
              <th className="px-5 py-3">Course</th>
              <th className="px-5 py-3">Plan</th>
              <th className="px-5 py-3">Method</th>
              <th className="px-5 py-3">Amount</th>
              <th className="px-5 py-3">Due</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {payments.map((p) => {
              const enrollment = p.enrollment;
              if (!enrollment || !p.child) return null;
              const course = getCourseEntryOrThrow(enrollment.courseSession.courseSlug);
              return (
                <tr key={p.id} className="border-b border-ink/5 last:border-0">
                  <td className="px-5 py-4 font-semibold text-ink">{p.child.fullName}</td>
                  <td className="px-5 py-4 text-stone">{p.parentName}</td>
                  <td className="px-5 py-4 text-stone">{course.title.en}</td>
                  <td className="px-5 py-4 text-stone">{p.paymentPlan?.type ?? '—'}</td>
                  <td className="px-5 py-4 text-stone">{p.paymentPlan?.method ?? '—'}</td>
                  <td className="px-5 py-4 text-stone">
                    {Number(p.amount)} {p.currency}
                  </td>
                  <td className="px-5 py-4 text-stone">{p.dueDate.toDateString()}</td>
                  <td className="px-5 py-4">
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${STATUS_STYLES[p.status]}`}>{p.status}</span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    {p.status !== 'PAID' ? (
                      <form action={setPaymentStatus.bind(null, p.id, 'PAID')}>
                        <PendingSubmitButton className="rounded-full border border-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50">
                          Mark paid
                        </PendingSubmitButton>
                      </form>
                    ) : (
                      <form action={setPaymentStatus.bind(null, p.id, 'PENDING')}>
                        <PendingSubmitButton className="rounded-full border border-ink/15 px-3 py-1 text-xs font-semibold text-ink transition hover:bg-slate-100">
                          Reopen
                        </PendingSubmitButton>
                      </form>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
