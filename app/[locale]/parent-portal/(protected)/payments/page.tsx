import { getTranslations } from 'next-intl/server';
import { requireParent } from '@/lib/portal-auth/guard';
import { resolveSelectedChild } from '@/lib/portal-auth/selected-child';
import { getCourseEntryOrThrow } from '@/lib/content/lookup';
import { localized } from '@/lib/i18n/format';
import MonthlyPaymentsTable from '@/components/portal/MonthlyPaymentsTable';
import { listFirebaseChildren } from '@/lib/firebase/children';
import { listFirebasePaymentsWithRelationsByChild } from '@/lib/firebase/read-models';
import type { AppLocale } from '@/i18n/routing';

export const dynamic = 'force-dynamic';

export default async function ParentPaymentsPage(props: { params: Promise<{ locale: AppLocale }> }) {
  const params = await props.params;
  const parent = await requireParent(params.locale);
  const t = await getTranslations({ locale: params.locale, namespace: 'parentPortal' });
  const children = await listFirebaseChildren(parent.parentId);
  const selected = await resolveSelectedChild(children);

  if (!selected) {
    return (
      <p className="rounded-2xl border border-dashed border-ink/15 bg-white p-10 text-center text-stone">
        {t('noChildren')}
      </p>
    );
  }

  const child = children.find((entry) => entry.id === selected.id) ?? null;
  if (!child) return null;

  const payments = (await listFirebasePaymentsWithRelationsByChild(child.id))
    .filter((payment) => payment.enrollment)
    .map((payment) => {
      const course = getCourseEntryOrThrow(payment.enrollment!.courseSession.courseSlug);
      return {
        id: payment.id,
        courseTitle: localized(course.title, params.locale),
        amount: payment.amount,
        currency: payment.currency,
        dueDate: payment.dueDate.toISOString(),
        status: payment.status,
      };
    });

  return (
    <div>
      <MonthlyPaymentsTable payments={payments} childId={child.id} locale={params.locale} />
    </div>
  );
}
