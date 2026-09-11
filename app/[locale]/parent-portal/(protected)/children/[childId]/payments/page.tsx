import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { prisma } from '@/lib/db/prisma';
import { requireParent } from '@/lib/portal-auth/guard';
import { getCourseEntryOrThrow } from '@/lib/content/lookup';
import { localized } from '@/lib/i18n/format';
import MonthlyPaymentsTable from '@/components/portal/MonthlyPaymentsTable';
import type { AppLocale } from '@/i18n/routing';

export const dynamic = 'force-dynamic';

export default async function PaymentsPage({
  params,
  searchParams,
}: {
  params: { locale: AppLocale; childId: string };
  searchParams: { paid?: string; cancelled?: string };
}) {
  const parent = await requireParent(params.locale);
  const t = await getTranslations({ locale: params.locale, namespace: 'parentPortal.paymentsPage' });
  const child = await prisma.child.findUnique({ where: { id: params.childId } });
  if (!child || child.parentId !== parent.parentId) notFound();

  const rawPayments = await prisma.payment.findMany({
    where: { paymentPlan: { enrollment: { childId: child.id } } },
    include: { paymentPlan: { include: { enrollment: { include: { courseSession: true } } } } },
    orderBy: { dueDate: 'desc' },
  });

  const payments = rawPayments.map((payment) => {
    const course = getCourseEntryOrThrow(payment.paymentPlan.enrollment.courseSession.courseSlug);
    return {
      id: payment.id,
      courseTitle: localized(course.title, params.locale),
      plan: payment.paymentPlan.type,
      amount: Number(payment.amount),
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
