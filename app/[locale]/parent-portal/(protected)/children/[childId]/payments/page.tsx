import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { requireParent } from '@/lib/portal-auth/guard';
import { courseLookup } from '@/lib/content/lookup';
import { localized } from '@/lib/i18n/format';
import MonthlyPaymentsTable from '@/components/portal/MonthlyPaymentsTable';
import { getDbChild } from '@/lib/db/children';
import { listDbPaymentsWithRelationsByChild } from '@/lib/db/read-models';
import type { AppLocale } from '@/i18n/routing';

export const dynamic = 'force-dynamic';

export default async function PaymentsPage(
  props: {
    params: Promise<{ locale: AppLocale; childId: string }>;
    searchParams: Promise<{ paid?: string; cancelled?: string }>;
  }
) {
  const courseOf = await courseLookup();
  const searchParams = await props.searchParams;
  const params = await props.params;
  const parent = await requireParent(params.locale);
  const t = await getTranslations({ locale: params.locale, namespace: 'parentPortal.paymentsPage' });
  const child = await getDbChild(params.childId);
  if (!child || child.parentId !== parent.parentId) notFound();

  const payments = (await listDbPaymentsWithRelationsByChild(child.id)).filter((payment) => payment.enrollment).map((payment) => {
    const course = courseOf(payment.enrollment!.courseSession.courseSlug);
    return {
      id: payment.id,
      courseTitle: localized(course.title, params.locale),
      plan: payment.paymentPlan?.type,
      amount: payment.amount,
      currency: payment.currency,
      dueDate: payment.dueDate.toISOString(),
      status: payment.status,
    };
  });

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-ink">{t('title', { name: child.fullName })}</h1>

      {searchParams.paid ? (
        <p className="mt-4 rounded-xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">{t('paidNotice')}</p>
      ) : null}
      {searchParams.cancelled ? (
        <p className="mt-4 rounded-xl bg-amber-50 p-4 text-sm font-semibold text-amber-700">{t('cancelledNotice')}</p>
      ) : null}

      <div className="mt-8">
        <MonthlyPaymentsTable payments={payments} childId={child.id} locale={params.locale} showPlan />
      </div>
    </div>
  );
}
