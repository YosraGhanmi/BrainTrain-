import { CalendarDays, ExternalLink, Images, Newspaper, Type } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { readContent } from '@/lib/content/store';
import { updateEvents } from '@/lib/admin/actions';
import { requireAdminOnly } from '@/lib/admin/guard';
import PendingSubmitButton from '@/components/portal/PendingSubmitButton';
import type { EventEntry, LocalizedString } from '@/lib/content/types';

export const dynamic = 'force-dynamic';

const inputClass =
  'w-full rounded-xl border border-accent/15 bg-white px-4 py-2.5 text-sm text-ink outline-none focus:border-accent/40';

const EMPTY: LocalizedString = { en: '', fr: '' };

function Field({ label, name, defaultValue, rows, hint }: { label: string; name: string; defaultValue: string; rows?: number; hint?: string }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-semibold uppercase tracking-wide text-stone">{label}</span>
      {rows ? (
        <textarea name={name} defaultValue={defaultValue} rows={rows} className={inputClass} />
      ) : (
        <input name={name} defaultValue={defaultValue} className={inputClass} />
      )}
      {hint ? <span className="block text-xs text-stone">{hint}</span> : null}
    </label>
  );
}

// The same field in French and English, side by side
function Pair({ label, name, value, rows }: { label: string; name: string; value: LocalizedString; rows?: number }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Field label={`${label} (French)`} name={`${name}_fr`} defaultValue={value.fr} rows={rows} />
      <Field label={`${label} (English)`} name={`${name}_en`} defaultValue={value.en} rows={rows} />
    </div>
  );
}

function ImageField({ name, image, label }: { name: string; image: string; label: string }) {
  return (
    <div className="space-y-2">
      <span className="text-xs font-semibold uppercase tracking-wide text-stone">{label}</span>
      <input type="hidden" name={`${name}Existing`} value={image} />
      <div className="flex flex-wrap items-center gap-4">
        {image ? <img src={image} alt="" className="h-16 w-24 rounded-lg border border-ink/10 object-cover" /> : null}
        <input name={name} type="file" accept="image/*" className="text-sm text-ink" />
        {image ? (
          <label className="flex items-center gap-2 text-sm text-stone">
            <input type="checkbox" name={`${name}Remove`} className="h-4 w-4 accent-accent" />
            Remove picture
          </label>
        ) : null}
      </div>
    </div>
  );
}

// Facebook link, our own video file and the poster, shared by every story
function VideoFields({ prefix, facebookUrl, videoFile, poster, portrait }: { prefix: string; facebookUrl: string; videoFile: string; poster: string; portrait: boolean }) {
  return (
    <div className="space-y-4 rounded-xl border border-ink/10 bg-surface/60 p-4">
      <p className="text-xs text-stone">
        Video: if you upload a file below it plays in our own player. Otherwise the Facebook video plays on the page. Leave both empty for a story without video.
      </p>
      <Field
        label="Facebook video link"
        name={`${prefix}_facebookUrl`}
        defaultValue={facebookUrl}
        hint="Use the full address, like facebook.com/reel/123… or facebook.com/<page>/videos/123… (not a facebook.com/share/… link). The video must be public."
      />
      <div className="space-y-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-stone">Video file (MP4 or WebM, up to 10 MB)</span>
        <input type="hidden" name={`${prefix}_videoFileExisting`} value={videoFile} />
        <div className="flex flex-wrap items-center gap-4">
          {videoFile ? <span className="rounded-lg border border-ink/10 bg-white px-3 py-1.5 text-xs text-ink">{videoFile.split('/').pop()}</span> : null}
          <input name={`${prefix}_videoFile`} type="file" accept="video/mp4,video/webm" className="text-sm text-ink" />
          {videoFile ? (
            <label className="flex items-center gap-2 text-sm text-stone">
              <input type="checkbox" name={`${prefix}_videoFileRemove`} className="h-4 w-4 accent-accent" />
              Remove video file
            </label>
          ) : null}
        </div>
      </div>
      <ImageField name={`${prefix}_poster`} image={poster} label="Preview picture (shown before the video plays)" />
      <label className="flex items-center gap-2 text-sm text-stone">
        <input type="checkbox" name={`${prefix}_portrait`} defaultChecked={portrait} className="h-4 w-4 accent-accent" />
        Tall video (reel, phone video). Untick for a wide video.
      </label>
    </div>
  );
}

function Card({ icon: Icon, title, hint, children }: { icon: LucideIcon; title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="relative space-y-4 overflow-hidden rounded-2xl border border-accent/15 bg-accent/[0.04] p-5">
      <span className="absolute inset-x-0 top-0 h-1 bg-accent" />
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-white shadow-sm shadow-accent/30">
          <Icon className="h-5 w-5" />
        </span>
        <h2 className="font-display text-sm font-semibold uppercase tracking-[0.2em] text-ink">{title}</h2>
      </div>
      {hint ? <p className="text-sm text-stone">{hint}</p> : null}
      {children}
    </section>
  );
}

function Row({ title, isNew, children }: { title: string; isNew: boolean; children: React.ReactNode }) {
  return (
    <div className={`space-y-4 rounded-xl border p-4 ${isNew ? 'border-dashed border-ink/25 bg-white/50' : 'border-accent/15 bg-white'}`}>
      <p className="text-sm font-semibold text-ink">{isNew ? `${title} (new, fill in to add)` : title}</p>
      {children}
    </div>
  );
}

export default async function AdminEventsPage(props: { searchParams: Promise<{ error?: string; saved?: string }> }) {
  await requireAdminOnly();
  const { error, saved } = await props.searchParams;
  const { events } = await readContent();

  // One empty story at the end to add a new one
  const blank: EventEntry = {
    id: '',
    kicker: EMPTY,
    title: EMPTY,
    date: EMPTY,
    standfirst: EMPTY,
    body: EMPTY,
    speakers: [],
    facebookUrl: '',
    videoFile: '',
    poster: '',
    portrait: true,
    postUrl: '',
  };
  const stories = [...events.events, blank];
  const up = events.upcoming;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-center gap-4">
        <h1 className="text-center font-display text-4xl font-semibold text-ink">Events page</h1>
        <a href="/fr/events" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent">
          View page <ExternalLink className="h-4 w-4" />
        </a>
      </div>

      {saved ? <p className="mt-6 rounded-xl bg-emerald-50 px-4 py-3 text-center text-sm font-semibold text-emerald-700">Saved.</p> : null}
      {error === 'type' ? (
        <p className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-center text-sm font-semibold text-red-700">
          The video file must be an MP4 or a WebM. Nothing was saved.
        </p>
      ) : null}

      <form action={updateEvents} className="mt-8 space-y-6 rounded-2xl border border-ink/10 bg-white p-6">
        <input type="hidden" name="eventCount" value={stories.length} />
        <input type="hidden" name="heroImageCount" value={events.heroImages.length} />

        <Card icon={Type} title="Page" hint="The Google title and description, then the small label, the big title and the intro at the top of the page.">
          <Pair label="Google title" name="seoTitle" value={events.seoTitle} />
          <Pair label="Google description" name="seoDescription" value={events.seoDescription} rows={2} />
          <Pair label="Title (*stars* = coloured words)" name="mastheadTitle" value={events.mastheadTitle} />
          <Pair label="Small label above the title" name="mastheadTagline" value={events.mastheadTagline} />
          <Pair label="Intro" name="intro" value={events.intro} rows={3} />
        </Card>

        <Card
          icon={Images}
          title="Floating photos at the top"
          hint="These photos drift down the top of the page. Visitors can click one to enlarge it. Landscape and portrait photos both work. New photos are added at the end."
        >
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {events.heroImages.map((src, i) => (
              <div key={src} className="space-y-2 rounded-xl border border-accent/15 bg-white p-2">
                <input type="hidden" name={`hi${i}_src`} value={src} />
                <img src={src} alt="" className="aspect-square w-full rounded-lg object-cover" />
                <label className="flex items-center gap-2 text-xs text-stone">
                  <input type="checkbox" name={`hi${i}_remove`} className="h-4 w-4 accent-accent" />
                  Remove
                </label>
              </div>
            ))}
          </div>
          <label className="block space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-stone">Add photos</span>
            <input name="newHeroImages" type="file" accept="image/*" multiple className="block text-sm text-ink" />
          </label>
        </Card>

        <Card
          icon={CalendarDays}
          title="Coming soon: next competition"
          hint="The dark block with the poster and the teaser. Clear the title to hide the whole block."
        >
          <Pair label="Small label" name="up_eyebrow" value={up.eyebrow} />
          <Pair label="Title (*stars* = coloured words)" name="up_title" value={up.title} />
          <Pair label="Line under the title" name="up_tagline" value={up.tagline} />
          <Pair label="Text" name="up_text" value={up.text} rows={4} />
          <Pair label="Date label (e.g. 2026 - 2027)" name="up_dateLabel" value={up.dateLabel} />
          <ImageField name="up_image" image={up.image} label="Poster" />
          <Pair label="Poster description for Google (alt)" name="up_imageAlt" value={up.imageAlt} />
          <VideoFields prefix="up" facebookUrl={up.facebookUrl} videoFile={up.videoFile} poster={up.poster} portrait={up.portrait} />
        </Card>

        <Card
          icon={Newspaper}
          title="Stories"
          hint="Newest first, the top one is the big lead story. Separate paragraphs with a blank line. Speakers: one per line, written “Name | Role” (the role is optional). Clear a story's title to delete it."
        >
          {stories.map((s, i) => (
            <Row key={s.id || 'new'} title={s.title.fr || s.title.en || 'Story'} isNew={i === stories.length - 1}>
              <input type="hidden" name={`e${i}_id`} value={s.id} />
              <Pair label="Small line above the title" name={`e${i}_kicker`} value={s.kicker} />
              <Pair label="Title" name={`e${i}_title`} value={s.title} />
              <Pair label="Date (e.g. September 2026)" name={`e${i}_date`} value={s.date} />
              <Pair label="Line under the title" name={`e${i}_standfirst`} value={s.standfirst} rows={2} />
              <Pair label="Story" name={`e${i}_body`} value={s.body} rows={8} />
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Speakers (French, one per line)" name={`e${i}_speakers_fr`} defaultValue={s.speakers.map((x) => x.fr).join('\n')} rows={4} />
                <Field label="Speakers (English, same order)" name={`e${i}_speakers_en`} defaultValue={s.speakers.map((x) => x.en).join('\n')} rows={4} />
              </div>
              <VideoFields prefix={`e${i}`} facebookUrl={s.facebookUrl} videoFile={s.videoFile} poster={s.poster} portrait={s.portrait} />
              <Field label="Facebook post link (for the “see the post” link, optional)" name={`e${i}_postUrl`} defaultValue={s.postUrl} />
            </Row>
          ))}
        </Card>

        <div className="sticky bottom-4 flex justify-end">
          <PendingSubmitButton className="rounded-full bg-ink px-6 py-2.5 text-sm font-semibold uppercase tracking-[0.2em] text-white shadow-lg transition hover:bg-stone/90">
            Save
          </PendingSubmitButton>
        </div>
      </form>
    </div>
  );
}
