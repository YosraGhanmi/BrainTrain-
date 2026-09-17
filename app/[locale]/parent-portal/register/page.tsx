import ParentAuthScreen from '@/components/portal/ParentAuthScreen';
import type { AppLocale } from '@/i18n/routing';

export default async function RegisterPage(
  props: {
    params: Promise<{ locale: AppLocale }>;
    searchParams: Promise<{ error?: string }>;
  }
) {
  const searchParams = await props.searchParams;
  const params = await props.params;
  return <ParentAuthScreen locale={params.locale} initialMode="signup" registerError={searchParams.error} />;
}
