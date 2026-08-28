import ParentAuthScreen from '@/components/portal/ParentAuthScreen';
import type { AppLocale } from '@/i18n/routing';

export default function RegisterPage({
  params,
  searchParams,
}: {
  params: { locale: AppLocale };
  searchParams: { error?: string };
}) {
  return <ParentAuthScreen locale={params.locale} initialMode="signup" registerError={searchParams.error} />;
}
