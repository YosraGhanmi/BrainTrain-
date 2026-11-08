import { readContent } from '@/lib/content/store';
import { updateFaq } from '@/lib/admin/actions';
import { requireAdminOnly } from '@/lib/admin/guard';
import PendingSubmitButton from '@/components/portal/PendingSubmitButton';
import type { FaqItem } from '@/lib/content/types';

export const dynamic = 'force-dynamic';

const LANGS = [
  { suffix: 'En', locale: 'en', language: 'English' },
  { suffix: 'Fr', locale: 'fr', language: 'French' },
] as const;

const labelClass = 'text-xs font-semibold uppercase tracking-[0.2em] text-stone';
const inputClass = 'w-full rounded-xl border border-ink/15 px-4 py-3 text-sm text-ink';
const cardClass = 'space-y-4 rounded-2xl border border-ink/10 bg-white p-6';

// The fields of one question, saved or new
function QuestionFields({ index, item }: { index: number; item?: FaqItem }) {
  return (
    <>
      <div className="grid gap-6 md:grid-cols-2">
        {LANGS.map(({ suffix, locale, language }) => (
          <div key={suffix} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor={`item${index}Question${suffix}`} className={labelClass}>
                Question ({language})
              </label>
              <input
                id={`item${index}Question${suffix}`}
                name={`item${index}Question${suffix}`}
                defaultValue={item?.question[locale]}
                className={inputClass}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor={`item${index}Answer${suffix}`} className={labelClass}>
                Answer ({language})
              </label>
              <textarea
                id={`item${index}Answer${suffix}`}
                name={`item${index}Answer${suffix}`}
                defaultValue={item?.answer[locale]}
                rows={4}
                className={inputClass}
              />
            </div>
          </div>
        ))}
      </div>
      <label className="flex items-center gap-2 text-sm text-ink">
        <input type="checkbox" name={`item${index}Button`} defaultChecked={item?.showPreinscriptionButton} className="h-4 w-4" />
        Show the pre-registration button under the answer
      </label>
    </>
  );
}

export default async function AdminFaqPage() {
  await requireAdminOnly();
  const { faq } = await readContent();

  return (
    <div>
      <h1 className="text-center font-display text-4xl font-semibold text-ink">FAQ</h1>
      <p className="mx-auto mt-3 max-w-2xl text-center text-sm text-stone">
        The questions under the contact section on the home page. Visitors see the first answer open.
      </p>

      <form action={updateFaq} className="mt-8 space-y-6">
        <fieldset className={cardClass}>
          <legend className="sr-only">Heading</legend>
          <h2 className="font-display text-2xl font-semibold text-ink">Heading</h2>
          <div className="grid gap-6 md:grid-cols-2">
            {LANGS.map(({ suffix, locale, language }) => (
              <div key={suffix} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor={`heading${suffix}`} className={labelClass}>
                    Heading ({language})
                  </label>
                  <input id={`heading${suffix}`} name={`heading${suffix}`} defaultValue={faq.heading[locale]} className={inputClass} />
                </div>
                <div className="space-y-2">
                  <label htmlFor={`headingAccent${suffix}`} className={labelClass}>
                    Heading, coloured line ({language})
                  </label>
                  <input
                    id={`headingAccent${suffix}`}
                    name={`headingAccent${suffix}`}
                    defaultValue={faq.headingAccent[locale]}
                    className={inputClass}
                  />
                </div>
              </div>
            ))}
          </div>
        </fieldset>

        {faq.items.map((item, i) => (
          <fieldset key={i} className={cardClass}>
            <legend className="sr-only">Question {i + 1}</legend>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-display text-2xl font-semibold text-ink">Question {i + 1}</h2>
              <label className="flex items-center gap-2 text-sm font-semibold text-[#c83030]">
                <input type="checkbox" name={`item${i}Remove`} className="h-4 w-4" />
                Remove on save
              </label>
            </div>
            <QuestionFields index={i} item={item} />
          </fieldset>
        ))}

        <fieldset className={`${cardClass} border-dashed`}>
          <legend className="sr-only">New question</legend>
          <h2 className="font-display text-2xl font-semibold text-ink">New question</h2>
          <p className="text-sm text-stone">Fill this in to add a question at the end. Leave it empty to add nothing.</p>
          <QuestionFields index={faq.items.length} />
        </fieldset>

        <div className="flex justify-end">
          <PendingSubmitButton className="rounded-full bg-ink px-6 py-2.5 text-sm font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-stone/90">
            Save FAQ
          </PendingSubmitButton>
        </div>
      </form>
    </div>
  );
}
