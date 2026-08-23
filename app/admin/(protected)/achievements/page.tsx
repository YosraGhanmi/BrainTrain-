import { readContent } from '@/lib/content/store';
import { addAchievementImage, deleteAchievementImage } from '@/lib/admin/actions';

export const dynamic = 'force-dynamic';

export default function AdminAchievementsPage({ searchParams }: { searchParams: { error?: string } }) {
  const { achievementsImages } = readContent();

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink">Achievements gallery</h1>
      <p className="mt-2 text-stone">Photos shown in the achievements carousel.</p>

      <form
        action={addAchievementImage}
        className="mt-8 flex flex-wrap items-end gap-4 rounded-2xl border border-ink/10 bg-white p-6"
      >
        <div className="space-y-2">
          <label htmlFor="image" className="text-xs font-semibold uppercase tracking-[0.2em] text-stone">
            New photo
          </label>
          <input id="image" name="image" type="file" accept="image/*" required className="block text-sm text-ink" />
        </div>
        <button
          type="submit"
          className="rounded-full bg-ink px-6 py-2.5 text-sm font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-stone/90"
        >
          Add photo
        </button>
        {searchParams.error ? <p className="w-full text-sm font-semibold text-red-600">Pick a file first.</p> : null}
      </form>

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {achievementsImages.map((src) => (
          <div key={src} className="overflow-hidden rounded-2xl border border-ink/10 bg-white">
            <img src={src} alt="" className="aspect-square w-full object-cover" />
            <form action={deleteAchievementImage.bind(null, src)} className="p-3">
              <button
                type="submit"
                className="w-full rounded-full border border-red-200 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-red-600 transition hover:bg-red-50"
              >
                Remove
              </button>
            </form>
          </div>
        ))}
      </div>
    </div>
  );
}
