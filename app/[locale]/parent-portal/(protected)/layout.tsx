import PortalShell from '@/components/portal/PortalShell';
import { requireParent, localizedPath } from '@/lib/portal-auth/guard';
import { resolveSelectedChild } from '@/lib/portal-auth/selected-child';
import { prisma } from '@/lib/db/prisma';
import type { AppLocale } from '@/i18n/routing';
import { LayoutDashboard, BookOpen, CalendarDays, CreditCard, Settings } from 'lucide-react';

export default async function ParentPortalLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: AppLocale };
}) {
  const parent = await requireParent(params.locale);
  const kids = await prisma.child.findMany({
    where: { parentId: parent.parentId },
    orderBy: { createdAt: 'asc' },
    select: { id: true, fullName: true },
  });
  const selectedKid = resolveSelectedChild(kids);

  return (
    <PortalShell
      homeHref="/parent-portal"
      brandLabel="Parent Portal"
      fullName={parent.fullName}
      email={parent.email}
      settingsHref="/parent-portal/account"
      loginHref={localizedPath(params.locale, '/parent-portal/login')}
      navLinks={[
        { label: 'Dashboard', href: '/parent-portal', icon: LayoutDashboard },
        { label: 'Courses', href: '/parent-portal/courses', icon: BookOpen },
        { label: 'Emploi du temps', href: '/parent-portal/schedule', icon: CalendarDays },
        { label: 'Payments', href: '/parent-portal/payments', icon: CreditCard },
        { label: 'Settings', href: '/parent-portal/account', icon: Settings },
      ]}
      childSwitcher={{ children: kids, selectedChildId: selectedKid?.id ?? '' }}
    >
      {children}
    </PortalShell>
  );
}
