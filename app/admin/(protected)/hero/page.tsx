import { readContent } from '@/lib/content/store';
import { updateHeroText, updateHeroVideo } from '@/lib/admin/actions';
import { requireAdminOnly } from '@/lib/admin/guard';
import PendingSubmitButton from '@/components/portal/PendingSubmitButton';

export const dynamic = 'force-dynamic';

const ERRORS: Record<string, string> = {
  empty: 'Pick a video or a cover image first.',
  type: 'The video must be an MP4 or WebM file.',
};

export default async function AdminHeroPage(props: { searchParams: Promise<{ saved?: string; error?: string }> }) {
  const searchParams = await props.searchParams;
  await requireAdminOnly();
  const { heroVideo, heroText } = (await readContent());

  return (
    <div>
      <h1 className="text-center font-display text-4xl font-semibold text-ink">Hero</h1>
      <p className="mx-auto mt-3 max-w-2xl text-center text-sm text-stone">
        The full-screen video at the top of the home page and the text over it.
      </p>

      {searchParams.saved ? <p className="mt-6 text-center text-sm font-semibold text-emerald-600">Saved.</p> : null}

      <form action={updateHeroText} className="mt-8 space-y-6 rounded-2xl border border-ink/10 bg-white p-6">
        <h2 className="font-display text-2xl font-semibold text-ink">Text</h2>
        <p className="text-sm text-stone">
          Headline: each new line in the box is a new line on the site. Wrap words in *stars* to colour them in the
          logo&apos;s blue and red, in turn.
        </p>
        <div className="grid gap-6 md:grid-cols-2">
          {(['En', 'Fr'] as const).map((lang) => {
            const key = lang === 'En' ? 'en' : 'fr';
            return (
              <div key={lang} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor={`headline${lang}`} className="text-xs font-semibold uppercase tracking-[0.2em] text-stone">
                    Headline ({lang === 'En' ? 'English' : 'French'})
                  </label>
                  <textarea
                    id={`headline${lang}`}
                    name={`headline${lang}`}
                    defaultValue={heroText.headline[key]}
                    rows={4}
                    required
                    className="w-full rounded-xl border border-ink/15 px-4 py-3 text-sm text-ink"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor={`lead${lang}`} className="text-xs font-semibold uppercase tracking-[0.2em] text-stone">
                    Intro text ({lang === 'En' ? 'English' : 'French'})
                  </label>
                  <textarea
                    id={`lead${lang}`}
                    name={`lead${lang}`}
                    defaultValue={heroText.lead[key]}
                    rows={4}
                    required
                    className="w-full rounded-xl border border-ink/15 px-4 py-3 text-sm text-ink"
                  />
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex justify-end">
          <PendingSubmitButton className="rounded-full bg-ink px-6 py-2.5 text-sm font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-stone/90">
            Save text
          </PendingSubmitButton>
        </div>
      </form>

      <h2 className="mt-10 font-display text-2xl font-semibold text-ink">Video</h2>

      <div className="mt-4 overflow-hidden rounded-2xl border border-ink/10 bg-ink">
        <video
          key={heroVideo.src}
          src={heroVideo.src}
          poster={heroVideo.poster || undefined}
          controls
          muted
          playsInline
          preload="metadata"
          className="aspect-video w-full object-cover"
        />
      </div>

      <form action={updateHeroVideo} className="mt-6 space-y-6 rounded-2xl border border-ink/10 bg-white p-6">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="video" className="text-xs font-semibold uppercase tracking-[0.2em] text-stone">
              New video
            </label>
            <input id="video" name="video" type="file" accept="video/mp4,video/webm" className="block text-sm text-ink" />
            <p className="text-xs text-stone">
              MP4 or WebM, under 10 MB. It plays muted in the background; the sound plays when visitors press
              &ldquo;Watch the video&rdquo;.
            </p>
          </div>
          <div className="space-y-2">
            <label htmlFor="poster" className="text-xs font-semibold uppercase tracking-[0.2em] text-stone">
              New cover image
            </label>
            <input id="poster" name="poster" type="file" accept="image/*" className="block text-sm text-ink" />
            <p className="text-xs text-stone">Shown while the video loads. Ideally the video&apos;s first frame.</p>
          </div>
        </div>

        {searchParams.error ? (
          <p className="text-sm font-semibold text-red-600">{ERRORS[searchParams.error] ?? ERRORS.empty}</p>
        ) : null}
        <div className="flex justify-end">
          <PendingSubmitButton className="rounded-full bg-ink px-6 py-2.5 text-sm font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-stone/90">
            Save video
          </PendingSubmitButton>
        </div>
      </form>
    </div>
  );
}
