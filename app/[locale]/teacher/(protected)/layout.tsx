import { getTranslations } from 'next-intl/server';
import PortalShell from '@/components/portal/PortalShell';
import { requireTeacher, localizedPath } from '@/lib/portal-auth/guard';
import type { AppLocale } from '@/i18n/routing';
import { Users, CalendarDays } from 'lucide-react';

export default async function TeacherPortalLayout(
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

  const teacher = await requireTeacher(locale);
  const t = await getTranslations({ locale, namespace: 'teacherPortal.nav' });

  return (
    <PortalShell
      homeHref="/teacher"
      brandLabel={t('brand')}
      fullName={teacher.fullName}
      email={teacher.email}
      loginHref={localizedPath(locale, '/teacher/login')}
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
