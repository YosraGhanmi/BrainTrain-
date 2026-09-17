import { requireAdmin } from '@/lib/admin/guard';
import { deleteChild } from '@/lib/admin/portal-actions';
import { getAgeGroupEntryOrThrow } from '@/lib/content/lookup';
import DeleteIconButton from '@/components/admin/DeleteIconButton';
import { listAllFirebaseChildren } from '@/lib/firebase/children';

export const dynamic = 'force-dynamic';

export default async function AdminChildrenPage() {
  await requireAdmin();
  const children = await listAllFirebaseChildren();

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold text-ink">Children</h1>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-ink/10 bg-white shadow-soft">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-ink/10 text-xs font-bold uppercase tracking-wide text-stone">
            <tr>
              <th className="px-5 py-3">Child</th>
              <th className="px-5 py-3">Age group</th>
              <th className="px-5 py-3">Parent</th>
              <th className="px-5 py-3">Enrollments</th>
              <th className="px-5 py-3">Special accommodations</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {children.map((c) => (
              <tr key={c.id} className="border-b border-ink/5 last:border-0">
                <td className="px-5 py-4 font-semibold text-ink">{c.fullName}</td>
                <td className="px-5 py-4 text-stone">{getAgeGroupEntryOrThrow(c.ageGroupSlug).label.en}</td>
                <td className="px-5 py-4 text-stone">{c.parentName}</td>
                <td className="px-5 py-4 text-stone">{c.enrollmentCount}</td>
                <td className="px-5 py-4 text-stone">{c.specialNeeds ?? '—'}</td>
                <td className="px-5 py-4 text-right">
                  <DeleteIconButton action={deleteChild.bind(null, c.id)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
