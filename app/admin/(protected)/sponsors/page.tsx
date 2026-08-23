import { readContent } from '@/lib/content/store';
import { addSponsor, deleteSponsor } from '@/lib/admin/actions';

export const dynamic = 'force-dynamic';

export default function AdminSponsorsPage({ searchParams }: { searchParams: { error?: string } }) {
  const { sponsors } = readContent();

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink">Sponsors</h1>
      <p className="mt-2 text-stone">Logos shown in the partners strip on the homepage.</p>

      <form action={addSponsor} className="mt-8 flex flex-wrap items-end gap-4 rounded-2xl border border-ink/10 bg-white p-6">
        <div className="space-y-2">
          <label htmlFor="logo" className="text-xs font-semibold uppercase tracking-[0.2em] text-stone">
            New logo
          </label>
          <input id="logo" name="logo" type="file" accept="image/*" required className="block text-sm text-ink" />
        </div>
        <button
          type="submit"
          className="rounded-full bg-ink px-6 py-2.5 text-sm font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-stone/90"
        >
          Add logo
        </button>
        {searchParams.error ? <p className="w-full text-sm font-semibold text-red-600">Pick a file first.</p> : null}
      </form>

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {sponsors.map((src) => (
          <div key={src} className="rounded-2xl border border-ink/10 bg-white p-4">
            <div className="flex h-20 items-center justify-center">
              <img src={src} alt="" className="max-h-full max-w-full object-contain" />
            </div>
            <form action={deleteSponsor.bind(null, src)} className="mt-3">
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
