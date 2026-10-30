import { readContent } from '@/lib/content/store';
import { updateMethod } from '@/lib/admin/actions';
import { requireAdminOnly } from '@/lib/admin/guard';
import PendingSubmitButton from '@/components/portal/PendingSubmitButton';

export const dynamic = 'force-dynamic';

const LANGS = [
  { suffix: 'En', locale: 'en', language: 'English' },
  { suffix: 'Fr', locale: 'fr', language: 'French' },
] as const;

const labelClass = 'text-xs font-semibold uppercase tracking-[0.2em] text-stone';
const inputClass = 'w-full rounded-xl border border-ink/15 px-4 py-3 text-sm text-ink';

export default async function AdminMethodPage(props: { searchParams: Promise<{ saved?: string }> }) {
  const searchParams = await props.searchParams;
  await requireAdminOnly();
  const { method } = (await readContent());

  return (
    <div>
      <h1 className="text-center font-display text-4xl font-semibold text-ink">Our method</h1>
      <p className="mx-auto mt-3 max-w-2xl text-center text-sm text-stone">
        The section with four numbered cards near the bottom of the home page.
      </p>

      {searchParams.saved ? <p className="mt-6 text-center text-sm font-semibold text-emerald-600">Saved.</p> : null}

      <form action={updateMethod} className="mt-8 space-y-6">
        <fieldset className="space-y-4 rounded-2xl border border-ink/10 bg-white p-6">
          <legend className="sr-only">Heading</legend>
          <h2 className="font-display text-2xl font-semibold text-ink">Heading</h2>
          <div className="grid gap-6 md:grid-cols-2">
            {LANGS.map(({ suffix, locale, language }) => (
              <div key={suffix} className="space-y-2">
                <label htmlFor={`heading${suffix}`} className={labelClass}>
                  Heading ({language})
                </label>
                <input id={`heading${suffix}`} name={`heading${suffix}`} defaultValue={method.heading[locale]} required className={inputClass} />
              </div>
            ))}
          </div>
        </fieldset>

        {method.steps.map((step, i) => (
          <fieldset key={i} className="space-y-4 rounded-2xl border border-ink/10 bg-white p-6">
            <legend className="sr-only">Card {i + 1}</legend>
            <h2 className="font-display text-2xl font-semibold text-ink">Card {i + 1}</h2>
            <div className="grid gap-6 md:grid-cols-2">
              {LANGS.map(({ suffix, locale, language }) => (
                <div key={suffix} className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor={`step${i}Title${suffix}`} className={labelClass}>
                      Title ({language})
                    </label>
                    <input id={`step${i}Title${suffix}`} name={`step${i}Title${suffix}`} defaultValue={step.title[locale]} required className={inputClass} />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor={`step${i}Body${suffix}`} className={labelClass}>
                      Text ({language})
                    </label>
                    <textarea id={`step${i}Body${suffix}`} name={`step${i}Body${suffix}`} defaultValue={step.body[locale]} rows={3} required className={inputClass} />
                  </div>
                </div>
              ))}
            </div>
          </fieldset>
        ))}

        <div className="flex justify-end">
          <PendingSubmitButton className="rounded-full bg-ink px-6 py-2.5 text-sm font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-stone/90">
            Save method
          </PendingSubmitButton>
        </div>
      </form>
    </div>
  );
}
