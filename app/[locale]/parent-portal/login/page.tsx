import ParentAuthScreen from '@/components/portal/ParentAuthScreen';
import type { AppLocale } from '@/i18n/routing';

export default function ParentLoginPage({
  params,
  searchParams,
}: {
  params: { locale: AppLocale };
  searchParams: { error?: string; saved?: string };
}) {
  return (
    <ParentAuthScreen
      locale={params.locale}
      initialMode="login"
      loginError={searchParams.error}
      loginSaved={searchParams.saved}
    />
  );
}
