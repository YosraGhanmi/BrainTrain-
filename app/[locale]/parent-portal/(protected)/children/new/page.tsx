import { getTranslations } from 'next-intl/server';
import { addChild } from '@/lib/children/actions';
import { requireParent } from '@/lib/portal-auth/guard';
import { listAgeGroupEntries } from '@/lib/content/lookup';
import { localized } from '@/lib/i18n/format';
import type { AppLocale } from '@/i18n/routing';

export const dynamic = 'force-dynamic';

export default async function AddChildPage({
  params,
  searchParams,
}: {
  params: { locale: AppLocale };
  searchParams: { error?: string };
}) {
  await requireParent(params.locale);
  const t = await getTranslations({ locale: params.locale, namespace: 'parentPortal.addChild' });
  const ageGroups = listAgeGroupEntries();

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="font-display text-3xl font-bold text-ink">{t('title')}</h1>

      <form action={addChild} className="mt-8 space-y-5 rounded-2xl border border-ink/10 bg-white p-5 shadow-soft sm:p-8">
        <input type="hidden" name="locale" value={params.locale} />

        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-stone">{t('fullName')}</label>
          <input name="fullName" required className="w-full rounded-xl border border-ink/10 bg-slate-50 px-5 py-3.5 outline-none focus:border-accent" />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-stone">{t('dateOfBirth')}</label>
          <input name="dateOfBirth" type="date" required className="w-full rounded-xl border border-ink/10 bg-slate-50 px-5 py-3.5 outline-none focus:border-accent" />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-stone">{t('ageGroup')}</label>
          <select name="ageGroupSlug" required className="w-full rounded-xl border border-ink/10 bg-slate-50 px-5 py-3.5 outline-none focus:border-accent">
            <option value="">{t('selectAgeGroup')}</option>
            {ageGroups.map((g) => (
              <option key={g.slug} value={g.slug}>
                {localized(g.label, params.locale)}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-stone">{t('institution')}</label>
          <input name="institution" className="w-full rounded-xl border border-ink/10 bg-slate-50 px-5 py-3.5 outline-none focus:border-accent" />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-stone">{t('specialNeeds')}</label>
          <textarea
            name="specialNeeds"
            rows={3}
            className="w-full rounded-xl border border-ink/10 bg-slate-50 px-5 py-3.5 outline-none focus:border-accent"
            placeholder={t('specialNeedsPlaceholder')}
          />
        </div>

        {searchParams.error ? <p className="text-sm font-semibold text-red-600">{t('error')}</p> : null}

        <button type="submit" className="w-full rounded-full bg-ink px-6 py-3.5 text-base font-semibold uppercase tracking-wide text-white transition hover:bg-accent">
          {t('submit')}
        </button>
      </form>
    </div>
  );
}
