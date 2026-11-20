import Link from 'next/link';
import { readContent } from '@/lib/content/store';
import { updateCoursesStory } from '@/lib/admin/actions';
import { requireAdminOnly } from '@/lib/admin/guard';
import PendingSubmitButton from '@/components/portal/PendingSubmitButton';
import type { CoursesStoryContent, CoursesStoryPoint, CoursesStoryTextKey, LocalizedString } from '@/lib/content/types';

export const dynamic = 'force-dynamic';

const LANGS = [
  { suffix: 'En', locale: 'en', language: 'English' },
  { suffix: 'Fr', locale: 'fr', language: 'French' },
] as const;

const labelClass = 'text-xs font-semibold uppercase tracking-[0.2em] text-stone';
const inputClass = 'w-full rounded-xl border border-ink/15 px-4 py-3 text-sm text-ink';

// One field in English and French, side by side
function LangField({ name, label, value, rows }: { name: string; label: string; value: LocalizedString; rows?: number }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {LANGS.map(({ suffix, locale, language }) => (
        <div key={suffix} className="space-y-2">
          <label htmlFor={`${name}${suffix}`} className={labelClass}>
            {label} ({language})
          </label>
          {rows ? (
            <textarea id={`${name}${suffix}`} name={`${name}${suffix}`} defaultValue={value[locale]} rows={rows} className={inputClass} />
          ) : (
            <input id={`${name}${suffix}`} name={`${name}${suffix}`} defaultValue={value[locale]} className={inputClass} />
          )}
        </div>
      ))}
    </div>
  );
}

function Section({ step, title, hint, children }: { step: number; title: string; hint: string; children: React.ReactNode }) {
  return (
    <fieldset className="space-y-5 rounded-2xl border border-ink/10 bg-white p-6">
      <legend className="sr-only">{title}</legend>
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">Part {step}</p>
        <h2 className="mt-1 font-display text-2xl font-semibold text-ink">{title}</h2>
        <p className="mt-1 text-sm text-stone">{hint}</p>
      </div>
      {children}
    </fieldset>
  );
}

function Points({ name, label, points }: { name: string; label: string; points: CoursesStoryPoint[] }) {
  return (
    <div className="space-y-4">
      {points.map((point, i) => (
        <div key={i} className="space-y-3 rounded-xl border border-ink/10 bg-slate-50/60 p-4">
          <p className="text-sm font-semibold text-ink">
            {label} {i + 1}
          </p>
          <LangField name={`${name}${i}Title`} label="Title" value={point.title} />
          <LangField name={`${name}${i}Body`} label="Text" value={point.body} rows={2} />
        </div>
      ))}
    </div>
  );
}

export default async function AdminCoursesStoryPage(props: { searchParams: Promise<{ saved?: string }> }) {
  const searchParams = await props.searchParams;
  await requireAdminOnly();
  const content = await readContent();
  const story: CoursesStoryContent = content.coursesStory;
  const text = (key: CoursesStoryTextKey, label: string, rows?: number) => (
    <LangField name={key} label={label} value={story[key]} rows={rows} />
  );
  const stars = 'words in *stars* are highlighted';

  return (
    <div>
      <h1 className="text-center font-display text-4xl font-semibold text-ink">Courses page story</h1>
      <p className="mx-auto mt-3 max-w-2xl text-center text-sm text-stone">
        The Courses page tells a story in six parts before parents pick an age group: the problem, our answer, the path from 4 to 18,
        the vision, then the picker. Leave a field empty to hide it.
      </p>

      {searchParams.saved ? <p className="mt-6 text-center text-sm font-semibold text-emerald-600">Saved.</p> : null}

      <form action={updateCoursesStory} className="mt-8 space-y-6">
        <Section step={1} title="Opening" hint="The top of the page, with the age group photos beside it.">
          {text('eyebrow', 'Small line above')}
          {text('heading', `Heading, ${stars}`, 2)}
          {text('intro', 'Text under the heading', 3)}
        </Section>

        <Section step={2} title="The problem" hint="What is missing today for children. Points with an empty title are hidden.">
          {text('problemEyebrow', 'Small line above')}
          {text('problemHeading', `Heading, ${stars}`, 2)}
          {text('problemIntro', 'Text under the heading', 2)}
          <Points name="problems" label="Problem" points={story.problems} />
        </Section>

        <Section step={3} title="Our answer" hint="How BrainTrain answers it. Points with an empty title are hidden.">
          {text('answerEyebrow', 'Small line above')}
          {text('answerHeading', `Heading, ${stars}`, 2)}
          {text('answerIntro', 'Text under the heading', 2)}
          <Points name="answers" label="Answer" points={story.answers} />
        </Section>

        <Section step={4} title="The path" hint="One step per age group, in order.">
          {text('pathEyebrow', 'Small line above')}
          {text('pathHeading', `Heading, ${stars}`, 2)}
          {text('pathIntro', 'Text under the heading', 2)}
          {content.ageGroups.map((g) => (
            <div key={g.slug} className="space-y-3 rounded-xl border border-ink/10 bg-slate-50/60 p-4">
              <p className="text-sm font-semibold text-ink">
                {g.stage.en || g.label.en} ({g.label.en})
              </p>
              <LangField
                name={`pathPitch_${g.slug}`}
                label="Text for parents"
                value={story.pathPitches[g.slug] ?? { en: '', fr: '' }}
                rows={3}
              />
            </div>
          ))}
          <p className="text-sm text-stone">
            Each step shows an age group&apos;s name, ages and photo, with the text above (or, left empty, the age group&apos;s
            description). Change the name, ages and photo in{' '}
            <Link href="/admin/age-groups" className="font-semibold text-accent hover:underline">
              Age groups
            </Link>
            .
          </p>
        </Section>

        <Section step={5} title="The vision" hint="Where the path leads, with an icon per quality (a lightbulb, building blocks, a flag). Line breaks in the statement are kept.">
          {text('visionEyebrow', 'Small line above')}
          {text('visionHeading', `Statement, ${stars}`, 3)}
          <Points name="visions" label="Quality" points={story.visions} />
        </Section>

        <Section step={6} title="The picker" hint="The age group carousel at the bottom of the page.">
          {text('pickHeading', 'Heading')}
          {text('pickIntro', 'Text under the heading')}
        </Section>

        <div className="flex justify-end">
          <PendingSubmitButton className="rounded-full bg-ink px-6 py-2.5 text-sm font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-stone/90">
            Save the story
          </PendingSubmitButton>
        </div>
      </form>
    </div>
  );
}
