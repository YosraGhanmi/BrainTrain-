import { getTranslations } from 'next-intl/server';
import PortalShell from '@/components/portal/PortalShell';
import { requireParent, localizedPath } from '@/lib/portal-auth/guard';
import { resolveSelectedChild } from '@/lib/portal-auth/selected-child';
import type { AppLocale } from '@/i18n/routing';
import { LayoutDashboard, BookOpen, CalendarDays, CreditCard, Settings } from 'lucide-react';
import { listFirebaseChildren } from '@/lib/firebase/children';

export default async function ParentPortalLayout(
  props: {
    children: React.ReactNode;
    params: Promise<{ locale: string }>;
  }
) {
  const params = await props.params;
  const locale = params.locale as AppLocale;

  const {
    children
  } = props;

  const parent = await requireParent(locale);
  const t = await getTranslations({ locale, namespace: 'parentPortal.nav' });
  const kids = (await listFirebaseChildren(parent.parentId)).map(({ id, fullName }) => ({ id, fullName }));
  const selectedKid = await resolveSelectedChild(kids);

  return (
    <PortalShell
      homeHref="/parent-portal"
      brandLabel={t('brand')}
      fullName={parent.fullName}
      email={parent.email}
      settingsHref="/parent-portal/account"
      loginHref={localizedPath(locale, '/parent-portal/login')}
      theme="light"
      navLinks={[
        { label: t('dashboard'), href: '/parent-portal', icon: LayoutDashboard },
        { label: t('courses'), href: '/parent-portal/courses', icon: BookOpen },
        { label: t('schedule'), href: '/parent-portal/schedule', icon: CalendarDays },
        { label: t('payments'), href: '/parent-portal/payments', icon: CreditCard },
        { label: t('settings'), href: '/parent-portal/account', icon: Settings },
      ]}
      childSwitcher={{ children: kids, selectedChildId: selectedKid?.id ?? '' }}
    >
      {children}
    </PortalShell>
  );
}
