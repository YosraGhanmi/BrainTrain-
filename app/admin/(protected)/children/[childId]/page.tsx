import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, KeyRound, Link2 } from 'lucide-react';
import { requireAdmin } from '@/lib/admin/guard';
import {
  addChildEnrollment,
  addPastClass,
  markChildPaymentPaid,
  regenerateChildClaimCode,
  removePastClass,
} from '@/lib/admin/children-actions';
import { getAgeGroupEntryOrThrow, getCourseEntryOrThrow } from '@/lib/content/lookup';
import { formatClaimCode, getFirebaseChild } from '@/lib/firebase/children';
import { firestore } from '@/lib/firebase/admin';
import { listFirebaseEnrollmentsWithSessionsByChild, listFirebasePaymentsWithRelationsByChild } from '@/lib/firebase/read-models';
import StaffEnrollmentFields, { listGroupOptions } from '@/components/admin/StaffEnrollmentFields';
import DeleteIconButton from '@/components/admin/DeleteIconButton';
import RegenerateCodeButton from '@/components/admin/RegenerateCodeButton';
import PendingSubmitButton from '@/components/portal/PendingSubmitButton';

export const dynamic = 'force-dynamic';

const ERRORS: Record<string, string> = {
  enroll: 'Pick a group, plan and payment method.',
  ineligible: "That group's course isn't for this child's age group.",
  capacity: 'That group is full. Pick another one.',
  conflict: 'The child already has another class at that same day and time.',
  duplicate: 'The child is already in that group.',
  pastClass: 'Type the course name.',
};

const PAYMENT_STYLES: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700',
  PAID: 'bg-emerald-100 text-emerald-700',
  OVERDUE: 'bg-red-100 text-red-600',
  FAILED: 'bg-slate-200 text-slate-600',
};

const inputClassName = 'w-full rounded-xl border border-ink/10 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-accent';
const labelClassName = 'mb-1.5 block text-xs font-semibold uppercase tracking-wide text-stone';

export default async function AdminChildPage(props: {
  params: Promise<{ childId: string }>;
  searchParams: Promise<{ created?: string; saved?: string; error?: string }>;
}) {
  const [params, searchParams] = await Promise.all([props.params, props.searchParams]);
  await requireAdmin();

  const child = await getFirebaseChild(params.childId);
  if (!child) notFound();

  const [parentDoc, enrollments, payments, groups] = await Promise.all([
    child.parentId ? firestore.collection('users').doc(child.parentId).get() : null,
    listFirebaseEnrollmentsWithSessionsByChild(child.id, ['PENDING', 'ACTIVE']),
    listFirebasePaymentsWithRelationsByChild(child.id),
    listGroupOptions(),
  ]);
  const eligibleGroups = groups.filter((g) => g.ageGroupSlug === child.ageGroupSlug);

  return (
    <div className="max-w-4xl">
      <Link href="/admin/children" className="inline-flex items-center gap-1.5 text-sm font-semibold text-stone transition hover:text-ink">
        <ArrowLeft className="h-4 w-4" />
        Children
      </Link>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-ink">{child.fullName}</h1>
          <p className="mt-1 text-sm text-stone">
            {getAgeGroupEntryOrThrow(child.ageGroupSlug).label.en} · born {child.dateOfBirth.toLocaleDateString()}
            {child.institution ? ` · ${child.institution}` : ''}
          </p>
        </div>

        {child.parentId ? (
          <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
            <Link2 className="h-5 w-5 text-emerald-600" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Linked to parent</p>
              <p className="text-sm font-bold text-ink">{String(parentDoc?.data()?.fullName ?? '')}</p>
            </div>
          </div>
        ) : child.claimCode ? (
          <div className="flex items-center gap-4 rounded-2xl border border-accent/20 bg-white px-5 py-3 shadow-soft">
            <KeyRound className="h-5 w-5 text-accent" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-stone">Parent code</p>
              <p className="font-mono text-2xl font-black tracking-widest text-ink">{formatClaimCode(child.claimCode)}</p>
            </div>
            <RegenerateCodeButton
              action={regenerateChildClaimCode.bind(null, child.id)}
              confirmMessage="Issue a new code? The current code will stop working."
            />
          </div>
        ) : null}
      </div>

      {searchParams.created ? (
        <p className="mt-4 rounded-xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
          Child created. Give the parent the code above: they enter it in the parent portal under &quot;Add a child&quot;.
        </p>
      ) : null}
      {searchParams.error ? (
        <p className="mt-4 text-sm font-semibold text-red-600">{ERRORS[searchParams.error] ?? 'Something went wrong.'}</p>
      ) : searchParams.saved ? (
        <p className="mt-4 text-sm font-semibold text-emerald-600">Saved.</p>
      ) : null}

      <section className="mt-6 rounded-2xl border border-ink/10 bg-white p-5 shadow-soft sm:p-6">
        <h2 className="font-display text-lg font-bold text-ink">This year</h2>
        {enrollments.length === 0 ? (
          <p className="mt-2 text-sm text-stone">Not enrolled in any group.</p>
        ) : (
          <ul className="mt-3 divide-y divide-ink/5">
            {enrollments.map((e) => {
              const enrollmentPayments = payments.filter((p) => p.enrollmentId === e.id);
              return (
                <li key={e.id} className="py-3">
                  <p className="font-semibold text-ink">
                    {getCourseEntryOrThrow(e.courseSession.courseSlug).title.en}{' '}
                    <span className="font-normal text-stone">
                      · {e.courseSession.startTime}-{e.courseSession.endTime}
                      {e.courseSession.term ? ` (${e.courseSession.term})` : ''}
                    </span>
                  </p>
                  <ul className="mt-2 space-y-2">
                    {enrollmentPayments.map((p) => (
                      <li key={p.id} className="flex flex-wrap items-center gap-3 text-sm">
                        <span className={`rounded-full px-3 py-1 text-xs font-bold ${PAYMENT_STYLES[p.status]}`}>{p.status}</span>
                        <span className="text-ink">
                          {p.amount.toFixed(2)} {p.currency}
                        </span>
                        <span className="text-stone">
                          {p.paymentPlan?.type ?? ''} · {p.paymentPlan?.method ?? ''} · due {p.dueDate.toLocaleDateString()}
                        </span>
                        {p.status !== 'PAID' ? (
                          <form action={markChildPaymentPaid.bind(null, child.id, p.id)}>
                            <PendingSubmitButton className="rounded-full border border-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50">
                              Mark paid
                            </PendingSubmitButton>
                          </form>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </li>
              );
            })}
          </ul>
        )}

        <details className="mt-4 rounded-xl border border-ink/10 p-4">
          <summary className="cursor-pointer text-sm font-semibold text-ink">Add to a group</summary>
          <form action={addChildEnrollment.bind(null, child.id)} className="mt-4 space-y-4">
            <StaffEnrollmentFields groups={eligibleGroups} />
            <PendingSubmitButton className="rounded-full bg-ink px-5 py-2.5 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-accent">
              Enroll
            </PendingSubmitButton>
          </form>
        </details>
      </section>

      <section className="mt-6 rounded-2xl border border-ink/10 bg-white p-5 shadow-soft sm:p-6">
        <h2 className="font-display text-lg font-bold text-ink">Previous years</h2>
        {child.pastClasses.length === 0 ? (
          <p className="mt-2 text-sm text-stone">No previous classes recorded.</p>
        ) : (
          <ul className="mt-3 divide-y divide-ink/5">
            {child.pastClasses.map((c, i) => (
              <li key={`${i}-${c.course}`} className="flex items-center justify-between gap-3 py-2 text-sm">
                <span>
                  {c.schoolYear ? <span className="font-semibold text-stone">{c.schoolYear} · </span> : null}
                  <span className="text-ink">{c.course}</span>
                  {c.note ? <span className="block text-xs text-stone">{c.note}</span> : null}
                </span>
                <DeleteIconButton action={removePastClass.bind(null, child.id, i)} />
              </li>
            ))}
          </ul>
        )}

        <form action={addPastClass.bind(null, child.id)} className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-[10rem_1fr_1fr_auto] sm:items-end">
          <label className="block">
            <span className={labelClassName}>School year</span>
            <input name="schoolYear" placeholder="2024-2025" className={inputClassName} />
          </label>
          <label className="block">
            <span className={labelClassName}>Course</span>
            <input name="course" required placeholder="e.g. Robotics Junior" className={inputClassName} />
          </label>
          <label className="block">
            <span className={labelClassName}>Note (optional)</span>
            <input name="note" placeholder="Any extra detail" className={inputClassName} />
          </label>
          <PendingSubmitButton className="rounded-full bg-ink px-5 py-2.5 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-accent">
            Add
          </PendingSubmitButton>
        </form>
      </section>
    </div>
  );
}
