import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db/prisma';
import { requireParent } from '@/lib/portal-auth/guard';
import ChildOverview from '@/components/portal/ChildOverview';
import type { AppLocale } from '@/i18n/routing';

export const dynamic = 'force-dynamic';

export default async function ChildDashboardPage({
  params,
}: {
  params: { locale: AppLocale; childId: string };
}) {
  const parent = await requireParent(params.locale);
  const child = await prisma.child.findUnique({
    where: { id: params.childId },
    include: {
      enrollments: {
        include: {
          courseSession: { include: { teacher: { include: { user: true } } } },
          notes: { orderBy: { createdAt: 'desc' } },
        },
        orderBy: { enrolledAt: 'desc' },
      },
      badges: { orderBy: { awardedAt: 'desc' } },
    },
  });

  if (!child || child.parentId !== parent.parentId) notFound();

  return <ChildOverview child={child} />;
}
