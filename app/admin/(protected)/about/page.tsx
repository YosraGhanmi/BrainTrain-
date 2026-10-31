import { readContent } from '@/lib/content/store';
import { updateAbout } from '@/lib/admin/actions';
import { requireAdminOnly } from '@/lib/admin/guard';
import PendingSubmitButton from '@/components/portal/PendingSubmitButton';

export const dynamic = 'force-dynamic';

const LANGS = [
  { suffix: 'En', locale: 'en', language: 'English' },
  { suffix: 'Fr', locale: 'fr', language: 'French' },
] as const;

const labelClass = 'text-xs font-semibold uppercase tracking-[0.2em] text-stone';
const inputClass = 'w-full rounded-xl border border-ink/15 px-4 py-3 text-sm text-ink';
const fieldsetClass = 'space-y-4 rounded-2xl border border-ink/10 bg-white p-6';

export default async function AdminAboutPage(props: { searchParams: Promise<{ saved?: string }> }) {
  const searchParams = await props.searchParams;
  await requireAdminOnly();
  const { about } = (await readContent());

  return (
    <div>
      <h1 className="text-center font-display text-4xl font-semibold text-ink">About</h1>
      <p className="mx-auto mt-3 max-w-2xl text-center text-sm text-stone">
        The &quot;À propos&quot; page: a flip gallery of photos beside the academy&apos;s story. In the heading and the story, words
        wrapped in *stars* are highlighted.
      </p>

      {searchParams.saved ? <p className="mt-6 text-center text-sm font-semibold text-emerald-600">Saved.</p> : null}

      <form action={updateAbout} className="mt-8 space-y-6">
        <fieldset className={fieldsetClass}>
          <legend className="sr-only">Photos</legend>
          <h2 className="font-display text-2xl font-semibold text-ink">Photos</h2>
          <p className="text-sm text-stone">
            Visitors flip through them in this order by clicking the photo. They are shown in landscape (3:2), so landscape photos or centred
            subjects work best. At least one photo always stays.
          </p>
          <div className="flex flex-wrap gap-4">
            {about.images.map((src, i) => (
              <label key={src} className="flex w-24 cursor-pointer flex-col items-center gap-2 text-xs text-stone">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt={`Photo ${i + 1}`} className="h-28 w-24 rounded-xl border border-ink/10 object-cover" />
                <span className="flex items-center gap-1.5">
                  <input type="checkbox" name="removeImage" value={src} />
                  Remove
                </span>
              </label>
            ))}
          </div>
          <div className="space-y-2">
            <label htmlFor="newImages" className={labelClass}>
              Add photos
            </label>
            <input id="newImages" name="newImages" type="file" accept="image/*" multiple className="block text-sm text-ink" />
          </div>
        </fieldset>

        <fieldset className={fieldsetClass}>
          <legend className="sr-only">Text</legend>
          <h2 className="font-display text-2xl font-semibold text-ink">Text</h2>
          <div className="grid gap-6 md:grid-cols-2">
            {LANGS.map(({ suffix, locale, language }) => (
              <div key={suffix} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor={`eyebrow${suffix}`} className={labelClass}>
                    Line above the heading ({language})
                  </label>
                  <input id={`eyebrow${suffix}`} name={`eyebrow${suffix}`} defaultValue={about.eyebrow[locale]} className={inputClass} />
                </div>
                <div className="space-y-2">
                  <label htmlFor={`heading${suffix}`} className={labelClass}>
                    Heading ({language})
                  </label>
                  <input id={`heading${suffix}`} name={`heading${suffix}`} defaultValue={about.heading[locale]} required className={inputClass} />
                </div>
                <div className="space-y-2">
                  <label htmlFor={`story${suffix}`} className={labelClass}>
                    Story ({language}, a blank line starts a new paragraph)
                  </label>
                  <textarea id={`story${suffix}`} name={`story${suffix}`} defaultValue={about.story[locale]} rows={14} required className={inputClass} />
                </div>
                <div className="space-y-2">
                  <label htmlFor={`closing${suffix}`} className={labelClass}>
                    Closing line ({language}, optional)
                  </label>
                  <input id={`closing${suffix}`} name={`closing${suffix}`} defaultValue={about.closing[locale]} className={inputClass} />
                </div>
              </div>
            ))}
          </div>
        </fieldset>

        <fieldset className={fieldsetClass}>
          <legend className="sr-only">Key facts</legend>
          <h2 className="font-display text-2xl font-semibold text-ink">Key facts</h2>
          <p className="text-sm text-stone">
            The two figures under the story, e.g. &quot;Sousse&quot; above &quot;Tunisie&quot;.
          </p>
          {about.facts.map((fact, i) => (
            <div key={i} className="grid gap-4 border-t border-ink/10 pt-4 md:grid-cols-4">
              {LANGS.flatMap(({ suffix, locale, language }) => [
                <div key={`v${suffix}`} className="space-y-2">
                  <label htmlFor={`fact${i}Value${suffix}`} className={labelClass}>
                    Fact {i + 1} figure ({language})
                  </label>
                  <input id={`fact${i}Value${suffix}`} name={`fact${i}Value${suffix}`} defaultValue={fact.value[locale]} required className={inputClass} />
                </div>,
                <div key={`l${suffix}`} className="space-y-2">
                  <label htmlFor={`fact${i}Label${suffix}`} className={labelClass}>
                    Fact {i + 1} label ({language})
                  </label>
                  <input id={`fact${i}Label${suffix}`} name={`fact${i}Label${suffix}`} defaultValue={fact.label[locale]} required className={inputClass} />
                </div>,
              ])}
            </div>
          ))}
        </fieldset>

        <div className="flex justify-end">
          <PendingSubmitButton className="rounded-full bg-ink px-6 py-2.5 text-sm font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-stone/90">
            Save about
          </PendingSubmitButton>
        </div>
      </form>
    </div>
  );
}
