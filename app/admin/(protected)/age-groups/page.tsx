import { readContent } from '@/lib/content/store';
import { upsertAgeGroup, deleteAgeGroup } from '@/lib/admin/actions';
import DeleteIconButton from '@/components/admin/DeleteIconButton';
import type { AgeGroupEntry } from '@/lib/content/types';

export const dynamic = 'force-dynamic';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-stone">{label}</span>
      {children}
    </label>
  );
}

function AgeGroupForm({ group, isNew }: { group: AgeGroupEntry; isNew: boolean }) {
  return (
    <details className={`group rounded-2xl border bg-white ${isNew ? 'border-dashed border-ink/30' : 'border-ink'}`}>
      <summary className="flex cursor-pointer list-none items-center justify-between px-6 py-4 text-sm font-semibold text-ink">
        {isNew ? '+ New age group' : group.label || 'Untitled age group'}
        <span className="flex items-center gap-3">
          {!isNew ? <DeleteIconButton action={deleteAgeGroup.bind(null, group.slug)} /> : null}
          <span className="text-stone transition group-open:rotate-180">▾</span>
        </span>
      </summary>

      <form action={upsertAgeGroup} className="space-y-4 border-t border-ink/10 p-6">
        <input type="hidden" name="existingSlug" value={isNew ? '' : group.slug} />

        <Field label="Label (e.g. 6-9 years)">
          <input
            name="label"
            defaultValue={group.label}
            placeholder="Label (e.g. 6-9 years)"
            required
            className="w-full rounded-xl border border-ink/10 bg-slate-50 px-4 py-2.5 text-sm text-ink outline-none focus:border-ink/30"
          />
        </Field>

        <Field label="Description">
          <textarea
            name="description"
            defaultValue={group.description}
            placeholder="Description"
            rows={2}
            className="w-full resize-none rounded-xl border border-ink/10 bg-slate-50 px-4 py-2.5 text-sm text-ink outline-none focus:border-ink/30"
          />
        </Field>

        <Field label="Image (shown on the age group's card — optional)">
          <div className="flex items-center gap-4">
            {group.image ? (
              <img src={group.image} alt="" className="h-16 w-16 rounded-xl border border-ink/10 object-cover" />
            ) : null}
            <input name="image" type="file" accept="image/*" className="block flex-1 text-sm text-ink" />
          </div>
        </Field>

        <div className="flex justify-end">
          <button
            type="submit"
            className="rounded-full bg-ink px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-stone/90"
          >
            {isNew ? 'Add age group' : 'Save'}
          </button>
        </div>
      </form>
    </details>
  );
}

export default function AdminAgeGroupsPage() {
  const { ageGroups } = readContent();
  const blank: AgeGroupEntry = { slug: '', label: '', description: '', icon: 'Puzzle', image: '' };

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink">Age groups</h1>
      <p className="mt-2 text-stone">
        Edit each age group's label, blurb and image. Each course belongs to exactly one age group — add, edit or
        remove courses (including which age group they belong to) on the{' '}
        <a href="/admin/courses" className="underline">
          courses
        </a>{' '}
        page.
      </p>

      <div className="mt-8 space-y-6">
        <AgeGroupForm group={blank} isNew />

        {ageGroups.map((group) => (
          <AgeGroupForm key={group.slug} group={group} isNew={false} />
        ))}
      </div>
    </div>
  );
}
