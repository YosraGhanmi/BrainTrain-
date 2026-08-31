import PortalShell from '@/components/portal/PortalShell';
import { requireTeacher, localizedPath } from '@/lib/portal-auth/guard';
import type { AppLocale } from '@/i18n/routing';
import { CalendarDays } from 'lucide-react';

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
      navLinks={[{ label: 'My sessions', href: '/teacher', icon: CalendarDays }]}
    >
      {children}
    </PortalShell>
  );
}
