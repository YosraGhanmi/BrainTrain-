import { readContent } from '@/lib/content/store';
import { addNews, deleteNews } from '@/lib/admin/actions';
import DeleteIconButton from '@/components/admin/DeleteIconButton';

export const dynamic = 'force-dynamic';

export default function AdminNewsPage({ searchParams }: { searchParams: { error?: string } }) {
  const { news, ageGroups, courses } = readContent();

  return (
    <div>
      <h1 className="text-center font-display text-4xl font-semibold text-ink">News</h1>
      <p className="mx-auto mt-2 max-w-xl text-center text-sm text-stone">
        Posted announcements show up on the parent dashboard. Leave age groups / courses unchecked to target everyone.
      </p>

      <form action={addNews} className="mt-8 space-y-5 rounded-2xl border border-dashed border-ink/30 bg-white p-6">
        <div className="space-y-2">
          <label htmlFor="title" className="text-xs font-semibold uppercase tracking-[0.2em] text-stone">
            Title
          </label>
          <input
            id="title"
            name="title"
            type="text"
            required
            className="w-full rounded-xl border border-ink/10 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-accent"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="body" className="text-xs font-semibold uppercase tracking-[0.2em] text-stone">
            Message
          </label>
          <textarea
            id="body"
            name="body"
            rows={4}
            required
            className="w-full rounded-xl border border-ink/10 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-accent"
          />
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone">Target age groups</p>
            <div className="flex flex-wrap gap-2">
              {ageGroups.map((g) => (
                <label
                  key={g.slug}
                  className="flex items-center gap-2 rounded-full border border-ink/10 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-ink"
                >
                  <input type="checkbox" name="targetAgeGroups" value={g.slug} className="accent-accent" />
                  {g.label.en}
                </label>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone">Target courses</p>
            <div className="flex flex-wrap gap-2">
              {courses.map((c) => (
                <label
                  key={c.slug}
                  className="flex items-center gap-2 rounded-full border border-ink/10 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-ink"
                >
                  <input type="checkbox" name="targetCourses" value={c.slug} className="accent-accent" />
                  {c.title.en}
                </label>
              ))}
            </div>
          </div>
        </div>

        {searchParams.error ? <p className="text-sm font-semibold text-red-600">Fill in both a title and a message.</p> : null}
        <button
          type="submit"
          className="rounded-full bg-ink px-6 py-2.5 text-sm font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-stone/90"
        >
          Post news
        </button>
      </form>

      <div className="mt-8 space-y-4">
        {news.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-ink/15 bg-white p-8 text-center text-stone">No news posted yet.</p>
        ) : (
          news.map((post) => {
            const groupLabels = post.targetAgeGroups
              .map((slug) => ageGroups.find((g) => g.slug === slug)?.label.en ?? slug)
              .join(', ');
            const courseLabels = post.targetCourses
              .map((slug) => courses.find((c) => c.slug === slug)?.title.en ?? slug)
              .join(', ');
            const targeting = [groupLabels && `Age: ${groupLabels}`, courseLabels && `Course: ${courseLabels}`]
              .filter(Boolean)
              .join(' · ');

            return (
              <div key={post.id} className="relative rounded-2xl border border-ink/10 bg-white p-6 shadow-soft">
                <div className="absolute right-4 top-4">
                  <DeleteIconButton action={deleteNews.bind(null, post.id)} />
                </div>
                <h2 className="pr-10 font-display text-lg font-bold text-ink">{post.title}</h2>
                <p className="mt-1 text-xs text-stone">
                  {new Date(post.createdAt).toLocaleString()} · {targeting || 'All parents'}
                </p>
                <p className="mt-3 whitespace-pre-wrap text-sm text-ink">{post.body}</p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
