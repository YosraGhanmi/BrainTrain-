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

  return (
    <PortalShell
      homeHref="/teacher"
      brandLabel="Teacher Portal"
      fullName={teacher.fullName}
      email={teacher.email}
      loginHref={localizedPath(params.locale, '/teacher/login')}
      theme="light"
      navLinks={[
        { label: 'My groups', href: '/teacher', icon: Users },
        { label: 'Calendar', href: '/teacher/calendar', icon: CalendarDays },
      ]}
    >
      {children}
    </PortalShell>
  );
}
