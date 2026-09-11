import { getTranslations } from 'next-intl/server';
import {
  changePhone,
  addSecondaryPhone,
  deleteSecondaryPhone,
  deletePrimaryPhone,
  updateBackupEmail,
  deleteBackupEmail,
} from '@/lib/portal-auth/actions';
import type { AppLocale } from '@/i18n/routing';

function Row({
  title,
  value,
  placeholder,
  children,
}: {
  title: string;
  value: string | null;
  placeholder: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="border-b border-ink/10 py-5 last:border-0">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-ink">{title}</p>
          <p className="text-sm text-stone">{value || placeholder}</p>
        </div>
        {children}
      </div>
    </div>
  );
}

function EditToggle({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <details className="group w-full sm:w-auto">
      <summary className="inline-flex cursor-pointer list-none items-center rounded-full border border-ink/15 px-4 py-2 text-sm font-semibold text-ink transition hover:bg-slate-50">
        {label}
      </summary>
      <div className="mt-4 w-full max-w-sm rounded-xl bg-slate-50 p-4">{children}</div>
    </details>
  );
}

export default async function PersonalInfoSection({
  locale,
  phone,
  secondaryPhone,
  backupEmail,
}: {
  locale: AppLocale;
  phone: string;
  secondaryPhone: string | null;
  backupEmail: string | null;
}) {
  const t = await getTranslations({ locale, namespace: 'parentPortal.personalInfo' });
  return (
    <div className="rounded-2xl border border-ink/10 bg-white p-5 shadow-soft sm:p-8">
      <h2 className="font-display text-lg font-bold text-ink">{t('heading')}</h2>
      <p className="mt-1 text-sm text-stone">{t('subheading')}</p>

      <div className="mt-6">
        <Row title={t('primaryPhone')} value={phone} placeholder={t('notSet')}>
          <div className="flex flex-wrap gap-2">
            <EditToggle label={t('edit')}>
              <form action={changePhone} className="space-y-3">
                <input type="hidden" name="locale" value={locale} />
                <input
                  name="phone"
                  type="tel"
                  required
                  defaultValue={phone}
                  className="w-full rounded-lg border border-ink/10 bg-white px-4 py-2.5 text-sm outline-none focus:border-accent"
                />
                <button type="submit" className="w-full rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent">
                  {t('save')}
                </button>
              </form>
            </EditToggle>
            <form action={deletePrimaryPhone}>
              <input type="hidden" name="locale" value={locale} />
              <button
                type="submit"
                disabled={!secondaryPhone}
                title={secondaryPhone ? undefined : t('addSecondaryFirst')}
                className="rounded-full border border-ink/15 px-4 py-2 text-sm font-semibold text-stone transition enabled:hover:border-red-300 enabled:hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {t('delete')}
              </button>
            </form>
          </div>
        </Row>

        <Row title={t('secondaryPhone')} value={secondaryPhone} placeholder={t('notSet')}>
          {secondaryPhone ? (
            <form action={deleteSecondaryPhone}>
              <input type="hidden" name="locale" value={locale} />
              <button type="submit" className="rounded-full border border-ink/15 px-4 py-2 text-sm font-semibold text-stone transition hover:border-red-300 hover:text-red-600">
                {t('delete')}
              </button>
            </form>
          ) : (
            <EditToggle label={t('addPhoneNumber')}>
              <form action={addSecondaryPhone} className="space-y-3">
                <input type="hidden" name="locale" value={locale} />
                <input
                  name="secondaryPhone"
                  type="tel"
                  required
                  placeholder={t('phonePlaceholder')}
                  className="w-full rounded-lg border border-ink/10 bg-white px-4 py-2.5 text-sm outline-none focus:border-accent"
                />
                <button type="submit" className="w-full rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent">
                  {t('save')}
                </button>
              </form>
            </EditToggle>
          )}
        </Row>

        <Row title={t('backupEmail')} value={backupEmail} placeholder={t('notSet')}>
          <div className="flex flex-wrap gap-2">
            <EditToggle label={backupEmail ? t('edit') : t('addBackupEmail')}>
              <form action={updateBackupEmail} className="space-y-3">
                <input type="hidden" name="locale" value={locale} />
                <input
                  name="backupEmail"
                  type="email"
                  required
                  defaultValue={backupEmail ?? ''}
                  placeholder="you@example.com"
                  className="w-full rounded-lg border border-ink/10 bg-white px-4 py-2.5 text-sm outline-none focus:border-accent"
                />
                <button type="submit" className="w-full rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent">
                  {t('save')}
                </button>
              </form>
            </EditToggle>
            {backupEmail ? (
              <form action={deleteBackupEmail}>
                <input type="hidden" name="locale" value={locale} />
                <button type="submit" className="rounded-full border border-ink/15 px-4 py-2 text-sm font-semibold text-stone transition hover:border-red-300 hover:text-red-600">
                  {t('delete')}
                </button>
              </form>
            ) : null}
          </div>
        </Row>
      </div>
    </div>
  );
}
