import { redirect } from 'next/navigation';
import { getPortalSessionUser, type PortalSessionUser } from '@/lib/portal-auth/session';
import { routing, type AppLocale } from '@/i18n/routing';

// localePrefix is 'as-needed' (see i18n/routing.ts): the default locale has
// no URL prefix, every other locale does. Server Actions' redirect() can't
// use the next-intl navigation wrapper (that's for rendering, not actions),
// so routes needing a locale-aware redirect build the path by hand.
export function localizedPath(locale: AppLocale, path: string): string {
  return locale === routing.defaultLocale ? path : `/${locale}${path}`;
}

export async function requireParent(locale: AppLocale): Promise<PortalSessionUser & { parentId: string }> {
  const user = await getPortalSessionUser();
  if (!user || user.role !== 'PARENT' || !user.parentId) {
    redirect(localizedPath(locale, '/parent-portal/login'));
  }
  return user as PortalSessionUser & { parentId: string };
}

export async function requireTeacher(locale: AppLocale): Promise<PortalSessionUser & { teacherId: string }> {
  const user = await getPortalSessionUser();
  if (!user || user.role !== 'TEACHER' || !user.teacherId) {
    redirect(localizedPath(locale, '/teacher/login'));
  }
  return user as PortalSessionUser & { teacherId: string };
}
