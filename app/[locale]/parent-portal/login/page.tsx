import ParentAuthScreen from '@/components/portal/ParentAuthScreen';
import { safeReturnPath } from '@/lib/portal-auth/return-path';
import type { AppLocale } from '@/i18n/routing';

// Reads the session cookie / URL parameters on every request
export const dynamic = 'force-dynamic';

export default async function ParentLoginPage(
  props: {
    params: Promise<{ locale: AppLocale }>;
    searchParams: Promise<{ error?: string; saved?: string; from?: string }>;
  }
) {
  const searchParams = await props.searchParams;
  const params = await props.params;
  return (
    <ParentAuthScreen
      locale={params.locale}
      initialMode="login"
      loginError={searchParams.error}
      loginSaved={searchParams.saved}
      returnTo={safeReturnPath(searchParams.from)}
    />
  );
}
