import { getTranslations } from 'next-intl/server';
import { prisma } from '@/lib/db/prisma';
import { requireParent } from '@/lib/portal-auth/guard';
import { resolveSelectedChild } from '@/lib/portal-auth/selected-child';
import { getCourseEntryOrThrow } from '@/lib/content/lookup';
import { localized } from '@/lib/i18n/format';
import MonthlyPaymentsTable from '@/components/portal/MonthlyPaymentsTable';
import type { AppLocale } from '@/i18n/routing';

export const dynamic = 'force-dynamic';

export default async function ParentPaymentsPage({ params }: { params: { locale: AppLocale } }) {
  const parent = await requireParent(params.locale);
  const t = await getTranslations({ locale: params.locale, namespace: 'parentPortal' });
  const children = await prisma.child.findMany({
    where: { parentId: parent.parentId },
    orderBy: { createdAt: 'asc' },
  });
  const selected = resolveSelectedChild(children);

  if (!selected) {
    return (
      <p className="rounded-2xl border border-dashed border-ink/15 bg-white p-10 text-center text-stone">
        {t('noChildren')}
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
    enrollment.payments.map((payment) => {
      const course = getCourseEntryOrThrow(enrollment.courseSession.courseSlug);
      return {
        id: payment.id,
        courseTitle: localized(course.title, params.locale),
        amount: Number(payment.amount),
        currency: payment.currency,
        dueDate: payment.dueDate.toISOString(),
        status: payment.status,
      };
    })
  );

  return (
    <div>
      <MonthlyPaymentsTable payments={payments} childId={child.id} locale={params.locale} />
    </div>
  );
}
