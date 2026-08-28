import PortalShell from '@/components/portal/PortalShell';
import { requireParent, localizedPath } from '@/lib/portal-auth/guard';
import type { AppLocale } from '@/i18n/routing';

export default async function ParentPortalLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: AppLocale };
}) {
  const parent = await requireParent(params.locale);

  return (
    <PortalShell
      homeHref="/parent-portal"
      brandLabel="Parent Portal"
      fullName={parent.fullName}
      loginHref={localizedPath(params.locale, '/parent-portal/login')}
      navLinks={[
        { label: 'My children', href: '/parent-portal' },
        { label: 'Account', href: '/parent-portal/account' },
      ]}
    >
      {children}
    </PortalShell>
  );
}
