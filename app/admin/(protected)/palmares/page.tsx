import { ExternalLink, Film, Hash, Images, Newspaper, Trophy, Type } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { readContent } from '@/lib/content/store';
import { updatePalmares } from '@/lib/admin/actions';
import { requireAdminOnly } from '@/lib/admin/guard';
import PendingSubmitButton from '@/components/portal/PendingSubmitButton';
import type { LocalizedString } from '@/lib/content/types';

export const dynamic = 'force-dynamic';

const inputClass =
  'w-full rounded-xl border border-accent/15 bg-white px-4 py-2.5 text-sm text-ink outline-none focus:border-accent/40';

const EMPTY: LocalizedString = { en: '', fr: '' };

function Field({ label, name, defaultValue, rows, type }: { label: string; name: string; defaultValue: string | number; rows?: number; type?: string }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-semibold uppercase tracking-wide text-stone">{label}</span>
      {rows ? (
        <textarea name={name} defaultValue={defaultValue} rows={rows} className={inputClass} />
      ) : (
        <input name={name} type={type ?? 'text'} defaultValue={defaultValue} className={inputClass} />
      )}
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

function ImageField({ prefix, image, label }: { prefix: string; image: string; label: string }) {
  return (
    <div className="space-y-2">
      <span className="text-xs font-semibold uppercase tracking-wide text-stone">{label}</span>
      <input type="hidden" name={`${prefix}_imageExisting`} value={image} />
      <div className="flex flex-wrap items-center gap-4">
        {image ? <img src={image} alt="" className="h-16 w-24 rounded-lg border border-ink/10 object-cover" /> : null}
        <input name={`${prefix}_image`} type="file" accept="image/*" className="text-sm text-ink" />
        {image ? (
          <label className="flex items-center gap-2 text-sm text-stone">
            <input type="checkbox" name={`${prefix}_imageRemove`} className="h-4 w-4 accent-accent" />
            Remove picture
          </label>
        ) : null}
      </div>
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

export default async function AdminPalmaresPage() {
  await requireAdminOnly();
  const { palmares } = await readContent();

  // One empty row at the end of each list to add a new entry
  const competitions = [...palmares.competitions, { title: EMPTY, intro: EMPTY, awards: [], image: '', imageAlt: EMPTY }];
  const videos = [...palmares.videos, { title: EMPTY, highlight: EMPTY, description: EMPTY, url: '', image: '' }];
  const media = [...palmares.media, { name: EMPTY, badge: EMPTY, description: EMPTY, url: '', image: '', logo: false }];
  const stats = [...palmares.stats, { value: 0, label: EMPTY }];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-center gap-4">
        <h1 className="text-center font-display text-4xl font-semibold text-ink">Palmarès</h1>
        <a href="/fr/palmares" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent">
          View page <ExternalLink className="h-4 w-4" />
        </a>
      </div>

      <form action={updatePalmares} className="mt-8 space-y-6 rounded-2xl border border-ink/10 bg-white p-6">
        <input type="hidden" name="competitionCount" value={competitions.length} />
        <input type="hidden" name="videoCount" value={videos.length} />
        <input type="hidden" name="mediaCount" value={media.length} />
        <input type="hidden" name="statCount" value={stats.length} />
        <input type="hidden" name="photoCount" value={palmares.photos.length} />

        <Card icon={Type} title="Page" hint="The Google title and description, then the big title and intro at the top of the page.">
          <Pair label="Google title" name="seoTitle" value={palmares.seoTitle} />
          <Pair label="Google description" name="seoDescription" value={palmares.seoDescription} rows={2} />
          <Pair label="Title" name="heading" value={palmares.heading} />
          <Pair label="Intro" name="intro" value={palmares.intro} rows={3} />
        </Card>

        <Card
          icon={Trophy}
          title="Competitions"
          hint="One award per line, written “1re place – Prix” (with a dash). A line without a dash shows as a note, like a qualification. A competition stays hidden on the page until it has at least one line. Clear the title to delete it."
        >
          <Pair label="Small label above the title" name="awardsEyebrow" value={palmares.awardsEyebrow} />
          <Pair label="Section title (*stars* = coloured words)" name="awardsHeading" value={palmares.awardsHeading} />
          <Pair label="Section intro" name="awardsIntro" value={palmares.awardsIntro} rows={2} />
          {competitions.map((c, i) => (
            <Row key={i} title={c.title.fr || c.title.en || 'Competition'} isNew={i === competitions.length - 1}>
              <Pair label="Title" name={`c${i}_title`} value={c.title} />
              <Pair label="Intro (optional)" name={`c${i}_intro`} value={c.intro} />
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Awards (French, one per line)" name={`c${i}_awards_fr`} defaultValue={c.awards.map((a) => a.fr).join('\n')} rows={6} />
                <Field label="Awards (English, same order)" name={`c${i}_awards_en`} defaultValue={c.awards.map((a) => a.en).join('\n')} rows={6} />
              </div>
              <ImageField prefix={`c${i}`} image={c.image} label="Picture (optional)" />
              <Pair label="Picture description for Google (alt)" name={`c${i}_imageAlt`} value={c.imageAlt} />
            </Row>
          ))}
        </Card>

        <Card icon={Film} title="Videos" hint="Each card opens the video on Facebook. The picture is shown behind the play button. Clear the title to delete a video.">
          <Pair label="Section title" name="videosHeading" value={palmares.videosHeading} />
          {videos.map((v, i) => (
            <Row key={i} title={v.title.fr || v.title.en || 'Video'} isNew={i === videos.length - 1}>
              <Pair label="Title" name={`v${i}_title`} value={v.title} />
              <Pair label="Highlight badge (optional)" name={`v${i}_highlight`} value={v.highlight} />
              <Pair label="Description" name={`v${i}_description`} value={v.description} rows={3} />
              <Field label="Video link" name={`v${i}_url`} defaultValue={v.url} />
              <ImageField prefix={`v${i}`} image={v.image} label="Picture" />
            </Row>
          ))}
        </Card>

        <Card icon={Newspaper} title="In the media" hint="Clear the name to delete an entry.">
          <Pair label="Section title" name="mediaHeading" value={palmares.mediaHeading} />
          <Pair label="Intro" name="mediaIntro" value={palmares.mediaIntro} rows={2} />
          {media.map((m, i) => (
            <Row key={i} title={m.name.fr || m.name.en || 'Media'} isNew={i === media.length - 1}>
              <Pair label="Name" name={`m${i}_name`} value={m.name} />
              <Pair label="Label on the picture (empty hides it)" name={`m${i}_badge`} value={m.badge} />
              <Pair label="Description" name={`m${i}_description`} value={m.description} rows={2} />
              <Field label="Link" name={`m${i}_url`} defaultValue={m.url} />
              <ImageField prefix={`m${i}`} image={m.image} label="Picture (photo, flag or logo)" />
              <label className="flex items-center gap-2 text-sm text-stone">
                <input type="checkbox" name={`m${i}_logo`} defaultChecked={m.logo} className="h-4 w-4 accent-accent" />
                This picture is a logo: show it whole on a white background instead of filling the space
              </label>
            </Row>
          ))}
        </Card>

        <Card icon={Hash} title="In numbers" hint="The numbers count up when they come into view. Clear a label to delete it.">
          <Pair label="Section title" name="statsHeading" value={palmares.statsHeading} />
          <div className="grid gap-4 lg:grid-cols-2">
            {stats.map((s, i) => (
              <Row key={i} title={s.label.fr || s.label.en || 'Number'} isNew={i === stats.length - 1}>
                <Field label="Number" name={`s${i}_value`} defaultValue={s.value} type="number" />
                <Pair label="Label" name={`s${i}_label`} value={s.label} />
              </Row>
            ))}
          </div>
        </Card>

        <Card icon={Images} title="Photos" hint="Shown under the numbers. Describe each photo for Google and screen readers. New photos start without a description: add one after saving.">
          <div className="grid gap-4 md:grid-cols-2">
            {palmares.photos.map((p, i) => (
              <div key={p.src} className="flex gap-4 rounded-xl border border-accent/15 bg-white p-3">
                <input type="hidden" name={`p${i}_src`} value={p.src} />
                <img src={p.src} alt="" className="h-24 w-24 shrink-0 rounded-lg border border-ink/10 object-cover" />
                <div className="min-w-0 flex-1 space-y-2">
                  <Field label="Description (French)" name={`p${i}_alt_fr`} defaultValue={p.alt.fr} />
                  <Field label="Description (English)" name={`p${i}_alt_en`} defaultValue={p.alt.en} />
                  <label className="flex items-center gap-2 text-sm text-stone">
                    <input type="checkbox" name={`p${i}_remove`} className="h-4 w-4 accent-accent" />
                    Remove photo
                  </label>
                </div>
              </div>
            ))}
          </div>
          <label className="block space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-stone">Add photos</span>
            <input name="newPhotos" type="file" accept="image/*" multiple className="block text-sm text-ink" />
          </label>
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
