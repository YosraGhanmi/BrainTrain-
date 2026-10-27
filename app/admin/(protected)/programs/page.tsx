import { readContent } from '@/lib/content/store';
import { updatePrograms } from '@/lib/admin/actions';
import { requireAdminOnly } from '@/lib/admin/guard';
import { PROGRAM_KEYS, type ProgramKey } from '@/lib/content/types';
import PendingSubmitButton from '@/components/portal/PendingSubmitButton';

export const dynamic = 'force-dynamic';

const CARDS: Record<ProgramKey, { name: string; button: string }> = {
  yearRound: { name: 'Year-round programme', button: 'Its button opens the courses page.' },
  summer: { name: 'Summer Academy', button: 'Its button opens the preinscription form with only the summer courses (while the summer school is open).' },
  competitions: { name: 'International competitions', button: 'Its button scrolls down to the achievements gallery.' },
};

export default async function AdminProgramsPage(props: { searchParams: Promise<{ saved?: string }> }) {
  const searchParams = await props.searchParams;
  await requireAdminOnly();
  const { programs } = (await readContent());

  return (
    <div>
      <h1 className="text-center font-display text-4xl font-semibold text-ink">Programmes</h1>
      <p className="mx-auto mt-3 max-w-2xl text-center text-sm text-stone">
        The three cards under the hero on the home page.
      </p>

      {searchParams.saved ? <p className="mt-6 text-center text-sm font-semibold text-emerald-600">Saved.</p> : null}

      <form action={updatePrograms} className="mt-8 space-y-6">
        {PROGRAM_KEYS.map((key) => (
          <fieldset key={key} className="space-y-4 rounded-2xl border border-ink/10 bg-white p-6">
            <legend className="sr-only">{CARDS[key].name}</legend>
            <h2 className="font-display text-2xl font-semibold text-ink">{CARDS[key].name}</h2>
            <p className="text-sm text-stone">{CARDS[key].button}</p>
            <div className="grid gap-6 md:grid-cols-2">
              {(['En', 'Fr'] as const).map((lang) => {
                const locale = lang === 'En' ? 'en' : 'fr';
                const language = lang === 'En' ? 'English' : 'French';
                return (
                  <div key={lang} className="space-y-4">
                    <div className="space-y-2">
                      <label htmlFor={`${key}Title${lang}`} className="text-xs font-semibold uppercase tracking-[0.2em] text-stone">
                        Title ({language})
                      </label>
                      <input
                        id={`${key}Title${lang}`}
                        name={`${key}Title${lang}`}
                        defaultValue={programs[key].title[locale]}
                        required
                        className="w-full rounded-xl border border-ink/15 px-4 py-3 text-sm text-ink"
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor={`${key}Body${lang}`} className="text-xs font-semibold uppercase tracking-[0.2em] text-stone">
                        Text ({language})
                      </label>
                      <textarea
                        id={`${key}Body${lang}`}
                        name={`${key}Body${lang}`}
                        defaultValue={programs[key].body[locale]}
                        rows={3}
                        required
                        className="w-full rounded-xl border border-ink/15 px-4 py-3 text-sm text-ink"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </fieldset>
        ))}
        <div className="flex justify-end">
          <PendingSubmitButton className="rounded-full bg-ink px-6 py-2.5 text-sm font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-stone/90">
            Save cards
          </PendingSubmitButton>
        </div>
      </form>
    </div>
  );
}
