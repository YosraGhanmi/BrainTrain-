import { getTranslations } from 'next-intl/server';
import PortalShell from '@/components/portal/PortalShell';
import { requireTeacher, localizedPath } from '@/lib/portal-auth/guard';
import type { AppLocale } from '@/i18n/routing';
import { Users, CalendarDays } from 'lucide-react';

export default async function TeacherPortalLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: AppLocale };
}) {
  const teacher = await requireTeacher(params.locale);
  const t = await getTranslations({ locale: params.locale, namespace: 'teacherPortal.nav' });

  return (
    <PortalShell
      homeHref="/teacher"
      brandLabel={t('brand')}
      fullName={teacher.fullName}
      email={teacher.email}
      loginHref={localizedPath(params.locale, '/teacher/login')}
      theme="light"
      navLinks={[
        { label: t('myGroups'), href: '/teacher', icon: Users },
        { label: t('calendar'), href: '/teacher/calendar', icon: CalendarDays },
      ]}
    >
      {children}
    </PortalShell>
  );
}
