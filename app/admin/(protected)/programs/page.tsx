import { readContent } from '@/lib/content/store';
import { updatePrograms } from '@/lib/admin/actions';
import { requireAdminOnly } from '@/lib/admin/guard';
import { PROGRAM_KEYS, type ProgramCard, type ProgramKey } from '@/lib/content/types';
import PendingSubmitButton from '@/components/portal/PendingSubmitButton';

export const dynamic = 'force-dynamic';

const CARDS: Record<ProgramKey, { name: string; button: string }> = {
  yearRound: { name: 'Year-round programme', button: 'Its link opens the courses page.' },
  summer: { name: 'Summer Academy', button: 'Its link opens the preinscription form with only the summer courses (while the summer school is open).' },
  competitions: { name: 'International competitions', button: 'Its link scrolls down to the achievements gallery.' },
};

// In the order they appear on the card. Optional ones are hidden on the site
// when left empty.
const FIELDS: { field: keyof Omit<ProgramCard, 'image'>; name: string; label: string; rows?: number; optional?: boolean }[] = [
  { field: 'badge', name: 'Badge', label: 'Badge on the photo', optional: true },
  { field: 'title', name: 'Title', label: 'Title' },
  { field: 'subtitle', name: 'Subtitle', label: 'Subtitle', optional: true },
  { field: 'body', name: 'Body', label: 'Text', rows: 3 },
  { field: 'detailsLabel', name: 'DetailsLabel', label: 'Details heading', optional: true },
  { field: 'details', name: 'Details', label: 'Details', optional: true },
];

export default async function AdminProgramsPage(props: { searchParams: Promise<{ saved?: string }> }) {
  const searchParams = await props.searchParams;
  await requireAdminOnly();
  const { programs } = (await readContent());

  return (
    <div>
      <h1 className="text-center font-display text-4xl font-semibold text-ink">Programmes</h1>
      <p className="mx-auto mt-3 max-w-2xl text-center text-sm text-stone">
        The three cards under the hero on the home page. Fields marked optional are hidden on the site when left empty.      </p>

      {searchParams.saved ? <p className="mt-6 text-center text-sm font-semibold text-emerald-600">Saved.</p> : null}

      <form action={updatePrograms} className="mt-8 space-y-6">
        {PROGRAM_KEYS.map((key) => (
          <fieldset key={key} className="space-y-4 rounded-2xl border border-ink/10 bg-white p-6">
            <legend className="sr-only">{CARDS[key].name}</legend>
            <h2 className="font-display text-2xl font-semibold text-ink">{CARDS[key].name}</h2>
            <p className="text-sm text-stone">{CARDS[key].button}</p>

            <div className="flex flex-wrap items-center gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={programs[key].image} alt="" className="h-20 w-28 rounded-xl border border-ink/10 object-cover" />
              <div className="space-y-2">
                <label htmlFor={`${key}Image`} className="text-xs font-semibold uppercase tracking-[0.2em] text-stone">
                  New photo
                </label>
                <input id={`${key}Image`} name={`${key}Image`} type="file" accept="image/*" className="block text-sm text-ink" />
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {(['En', 'Fr'] as const).map((lang) => {
                const locale = lang === 'En' ? 'en' : 'fr';
                const language = lang === 'En' ? 'English' : 'French';
                return (
                  <div key={lang} className="space-y-4">
                    {FIELDS.map(({ field, name, label, rows, optional }) => {
                      const id = `${key}${name}${lang}`;
                      const className = 'w-full rounded-xl border border-ink/15 px-4 py-3 text-sm text-ink';
                      return (
                        <div key={field} className="space-y-2">
                          <label htmlFor={id} className="text-xs font-semibold uppercase tracking-[0.2em] text-stone">
                            {label} ({language}){optional ? ', optional' : ''}
                          </label>
                          {rows ? (
                            <textarea id={id} name={id} defaultValue={programs[key][field][locale]} rows={rows} required={!optional} className={className} />
                          ) : (
                            <input id={id} name={id} defaultValue={programs[key][field][locale]} required={!optional} className={className} />
                          )}
                        </div>
                      );
                    })}
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
